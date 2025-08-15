# services/email_service.py
from flask_mail import Message
from models import mail
import logging
from datetime import datetime

class CentaEmailService:
    @staticmethod
    def send_password_reset(user_email, user_name, reset_url):
        """Send password reset email with Centa branding"""
        try:
            msg = Message(
                subject="Centa - Şifre Sıfırlama",
                recipients=[user_email],
                body=f"""Merhaba {user_name},

Centa Arıza Takip Sistemi'nde şifrenizi sıfırlamak için bir talep aldık.

Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
{reset_url}

Bu talebi siz yapmadıysanız, bu mesajı dikkate almayın.
Bu bağlantı 15 dakika boyunca geçerlidir.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"Password reset email sent to {user_email}")
            return True
        except Exception as e:
            logging.error(f"Failed to send password reset email: {e}")
            return False

    @staticmethod
    def send_return_case_notification(customer_email, customer_name, case_id, status):
        """Send return case status update"""
        try:
            msg = Message(
                subject=f"Centa - İade Vakası #{case_id} Güncellemesi",
                recipients=[customer_email],
                body=f"""Merhaba {customer_name},

Centa Arıza Takip Sistemi'nde kayıtlı iade vakanızın durumu güncellendi.

Vaka Numarası: {case_id}
Yeni Durum: {status}
Güncelleme Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}

Detaylı bilgi için sistemimize giriş yapabilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"Return case notification sent to {customer_email}")
            return True
        except Exception as e:
            logging.error(f"Failed to send return case notification: {e}")
            return False

    @staticmethod
    def send_welcome_email(user_email, user_name):
        """Send welcome email to new users"""
        try:
            msg = Message(
                subject="Centa Arıza Takip Sistemi - Hoş Geldiniz",
                recipients=[user_email],
                body=f"""Merhaba {user_name},

Centa Arıza Takip Sistemi'ne hoş geldiniz!

Hesabınız başarıyla oluşturuldu ve sisteme giriş yapabilirsiniz.

Sistem Özellikleri:
• İade vakalarını takip etme
• Müşteri yönetimi
• Ürün yönetimi
• Detaylı raporlama

Herhangi bir sorunuz için bizimle iletişime geçebilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"Welcome email sent to {user_email}")
            return True
        except Exception as e:
            logging.error(f"Failed to send welcome email: {e}")
            return False
            