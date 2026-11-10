"""Outgoing email, sent through Resend.

Every email is a template in templates/email/. Values put into a template are
escaped automatically, so text typed by a user can never inject HTML.

Each send method returns True on success and False on failure; it never
raises, so a mail problem cannot fail the request that triggered it.
"""
import logging
import os
from datetime import datetime

import resend
from flask import render_template

from models import CaseStatusEnum, ReturnCase, Role, User, UserRole, db

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY")
if not resend.api_key:
    logger.error("RESEND_API_KEY environment variable is not set!")

SENDER = "Centa Arıza Takip Sistemi <centa-ariza@centa.com.tr>"

# Who is told when a case arrives at a stage, and what the email says comes next.
STAGE_RECIPIENT_ROLES = {
    CaseStatusEnum.TECHNICAL_REVIEW: [UserRole.TECHNICIAN],
    CaseStatusEnum.PAYMENT_COLLECTION: [UserRole.SALES],
    CaseStatusEnum.SHIPPING: [UserRole.LOGISTICS],
    CaseStatusEnum.COMPLETED: [UserRole.MANAGER, UserRole.ADMIN],
}
NEXT_STEP_TEXT = {
    CaseStatusEnum.TECHNICAL_REVIEW: ('Teknik Servis', 'Teknik inceleme yapılacak ve ürün detayları eklenecek'),
    CaseStatusEnum.PAYMENT_COLLECTION: ('Satış Departmanı', 'Ödeme tahsilatı yapılacak'),
    CaseStatusEnum.SHIPPING: ('Lojistik Departmanı', 'Kargo işlemleri yapılacak'),
    CaseStatusEnum.COMPLETED: ('Yönetici', 'Vaka tamamlanacak'),
}


def _send(description, to, subject, template, **context):
    try:
        if not to:
            logger.warning("%s: no recipients, nothing sent", description)
            return False
        result = resend.Emails.send({
            "from": SENDER,
            "to": to,
            "subject": subject,
            "html": render_template(f"email/{template}.html", **context),
        })
        logger.info("%s sent to %d recipient(s). ID: %s", description, len(to), result.get("id", "unknown"))
        return True
    except Exception:
        logger.exception("%s could not be sent", description)
        return False


def _notifiable_users(roles=None):
    """Addresses of users who have notifications switched on, optionally
    limited to some roles."""
    query = User.query.filter(User.email_notifications_enabled.is_(True))
    if roles:
        query = query.join(Role).filter(Role.name.in_(roles))
    return [user.email for user in query.all()]


def _now():
    return datetime.now().strftime('%d.%m.%Y %H:%M')


class CentaEmailService:
    # --- Account emails ------------------------------------------------------

    @staticmethod
    def send_password_reset(user_email, user_name, reset_url):
        return _send("Password reset email", [user_email],
                     "Centa Arıza Takip Sistemi - Şifre Sıfırlama", "password_reset",
                     user_name=user_name, reset_url=reset_url)

    @staticmethod
    def send_password_reset_confirmation(user_email, user_name):
        return _send("Password reset confirmation", [user_email],
                     "Centa Arıza Takip Sistemi - Şifreniz Sıfırlandı", "password_reset_confirmation",
                     user_name=user_name)

    @staticmethod
    def send_user_invitation(user_email, role_name, invitation_url, invited_by_name):
        return _send("Invitation email", [user_email],
                     "Centa Arıza Takip Sistemi - Davet", "invitation",
                     role_name=role_name, invitation_url=invitation_url, invited_by_name=invited_by_name)

    @staticmethod
    def send_welcome_email(user_email, user_name):
        return _send("Welcome email", [user_email],
                     "Centa Arıza Takip Sistemi - Hoş Geldiniz", "welcome",
                     user_name=user_name)

    # --- Case emails ---------------------------------------------------------

    @staticmethod
    def send_custom_customer_email(customer_email, case_id, email_content):
        """A message written by staff, sent to the customer."""
        return _send(f"Customer email for case #{case_id}", [customer_email],
                     f"Centa - Arıza Vakası #{case_id} Bilgilendirmesi", "customer_message",
                     case_id=case_id, email_content=email_content)

    @staticmethod
    def new_return_case_notification(case_id):
        """Tell every user with notifications on that a case was opened."""
        try:
            case = db.session.get(ReturnCase, case_id)
            if not case:
                logger.error("New case notification: case %s not found", case_id)
                return False
            return _send(f"New case notification for case #{case_id}", _notifiable_users(),
                         f"Centa - Arıza Vakası #{case_id} - {case.customer.name} Bildirimi", "new_case",
                         case_id=case_id, customer_name=case.customer.name,
                         customer_contact_info=case.customer.contact_info,
                         arrival_date=case.arrival_date.strftime('%d.%m.%Y'))
        except Exception:
            logger.exception("New case notification for case %s could not be prepared", case_id)
            return False

    @staticmethod
    def send_stage_completion_notification(case_id, completed_status, next_status, updated_by=None):
        """Tell the team that owns `next_status` that the case has reached them.
        Only sent when STAGE_EMAILS_ENABLED is on (see config.py)."""
        try:
            case = db.session.get(ReturnCase, case_id)
            if not case:
                logger.error("Stage notification: case %s not found", case_id)
                return False
            next_responsible, next_action = NEXT_STEP_TEXT[next_status]
            return _send(f"Stage notification for case #{case_id}",
                         _notifiable_users(STAGE_RECIPIENT_ROLES[next_status]),
                         f"Centa - Arıza Vakası #{case_id} - {case.customer.name} Aşama Tamamlandı",
                         "stage_completed",
                         case_id=case_id, customer_name=case.customer.name,
                         completed_stage=completed_status.value, next_stage=next_status.value,
                         updated_by=updated_by or 'Sistem', current_time=_now(),
                         next_responsible=next_responsible, next_action=next_action)
        except Exception:
            logger.exception("Stage notification for case %s could not be prepared", case_id)
            return False

    @staticmethod
    def send_case_completion_notification(case_id, completed_by=None):
        """Tell managers and admins that a case is finished."""
        try:
            case = db.session.get(ReturnCase, case_id)
            if not case:
                logger.error("Completion notification: case %s not found", case_id)
                return False
            return _send(f"Completion notification for case #{case_id}",
                         _notifiable_users([UserRole.MANAGER, UserRole.ADMIN]),
                         f"Centa - Arıza Vakası #{case_id} Tamamlandı", "case_completed",
                         case_id=case_id, customer_name=case.customer.name,
                         completed_by=completed_by or 'Sistem', current_time=_now())
        except Exception:
            logger.exception("Completion notification for case %s could not be prepared", case_id)
            return False
