# services/email_service.py
from flask_mail import Message
from models import ReturnCase, User, mail, Role
import logging
from datetime import datetime

class CentaEmailService:
    @staticmethod
    def send_password_reset(user_email, user_name, reset_url):
        """Send password reset email with Centa branding"""
        try:
            msg = Message(
                subject="Centa Arıza Takip Sistemi - Şifre Sıfırlama",
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
            logging.info(f"Şifre sıfırlama e-postası {user_email} adresine gönderildi")
            return True
        except Exception as e:
            logging.error(f"Şifre sıfırlama e-postası gönderilemedi: {e}")
            return False

    @staticmethod
    def send_user_invitation(user_email, role_name, invitation_url, invited_by_name):
        """Send user invitation email"""
        try:
            msg = Message(
                subject="Centa Arıza Takip Sistemi - Davet",
                recipients=[user_email],
                body=f"""Merhaba,

Centa Arıza Takip Sistemi'ne davet edildiniz.

Davet Eden: {invited_by_name}
Rol: {role_name}

Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:
{invitation_url}

Bu bağlantı 24 saat boyunca geçerlidir.

Hesabınızı aktifleştirdikten sonra şifrenizi belirleyebilir ve sisteme giriş yapabilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"Kullanıcı davet e-postası {user_email} adresine gönderildi")
            return True
        except Exception as e:
            logging.error(f"Kullanıcı davet e-postası gönderilemedi: {e}")
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

Herhangi bir sorunuz için bizimle iletişime geçebilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"Hoş geldin e-postası {user_email} adresine gönderildi")
            return True
        except Exception as e:
            logging.error(f"Hoş geldin e-postası gönderilemedi: {e}")
            return False

    @staticmethod
    def send_custom_customer_email(customer_email, customer_name, case_id, email_content):
        """Send custom email to customer about their return case"""
        try:
            msg = Message(
                subject=f"Centa - İade Vakası #{case_id} Bilgilendirmesi",
                recipients=[customer_email],
                body=f"""{email_content}

---
Bu e-posta Centa Arıza Takip Sistemi tarafından otomatik olarak gönderilmiştir.
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"Özel müşteri e-postası {customer_email} adresine vaka #{case_id} için gönderildi")
            return True
        except Exception as e:
            logging.error(f"Özel müşteri e-postası gönderilemedi: {e}")
            return False
    
    @staticmethod
    def new_return_case_notification(case_id):
        """Send return case notification to all users"""
        try:
            # Retrieve the list of all user emails
            users = User.query.all()
            user_emails = [user.email for user in users]
            
            if not user_emails:
                logging.warning("E-posta gönderilecek kullanıcı bulunamadı")
                return False

            # Retrieve the case from the database
            case = ReturnCase.query.get(case_id)
            if not case:
                logging.error(f"Vaka bulunamadı, vaka numarası: {case_id}")
                return False

            # Get customer information
            customer_name = case.customer.name
            customer_contact_info = case.customer.contact_info 
            arrival_date = case.arrival_date.strftime('%d.%m.%Y')

            msg = Message(
                subject=f"Centa - İade Vakası #{case_id} - {customer_name} Bildirimi",
                recipients=user_emails,
                body=f"""Merhaba,

Centa Arıza Takip Sistemi'nde yeni bir iade vakası oluşturuldu.

Vaka Numarası: {case_id}
Tarih: {arrival_date}
Müşteri: {customer_name}
Müşteri İletişim Bilgileri: {customer_contact_info}

En yakın zamanda iade vakasının durumunu güncelleyiniz.

Detaylı bilgi için sistemimize giriş yapabilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"İade vakası #{case_id} bildirimi {len(user_emails)} kullanıcıya gönderildi")
            return True
        except Exception as e:
            logging.error(f"İade vakası bildirimi tüm kullanıcılara gönderilemedi: {e}")
            return False

    @staticmethod
    def send_stage_completion_notification(case_id, completed_stage, next_stage, updated_by=None):
        """Send notification when a stage is completed and inform about the next stage"""
        try:
            # Define which roles should receive emails for each next stage
            stage_role_mapping = {
                'Teknik İnceleme': ['TECHNICIAN'],
                'Ödeme Tahsilatı': ['SALES'],
                'Kargoya Veriliyor': ['LOGISTICS'],
                'Tamamlandı': ['MANAGER', 'ADMIN']
            }
            
            # Get the roles for the next stage
            next_stage_roles = stage_role_mapping.get(next_stage, [])
            
            if not next_stage_roles:
                logging.warning(f"Sonraki aşama {next_stage} için rol tanımlanmamış")
                return False
            
            # Get users with the appropriate roles for the next stage
            users = User.query.join(Role).filter(Role.name.in_(next_stage_roles)).all()
            user_emails = [user.email for user in users]
            
            if not user_emails:
                logging.warning(f"Sonraki aşama {next_stage} için e-posta gönderilecek kullanıcı bulunamadı")
                return False

            # Retrieve the case from the database
            case = ReturnCase.query.get(case_id)
            if not case:
                logging.error(f"Vaka bulunamadı, vaka numarası: {case_id}")
                return False

            # Get customer information
            customer_name = case.customer.name
            current_time = datetime.now().strftime('%d.%m.%Y %H:%M')

            # Stage-specific messages
            stage_messages = {
                'Teslim Alındı': {
                    'next_responsible': 'Teknik Servis',
                    'next_action': 'Teknik inceleme yapılacak ve ürün detayları eklenecek'
                },
                'Teknik İnceleme': {
                    'next_responsible': 'Satış Departmanı',
                    'next_action': 'Ödeme tahsilatı yapılacak'
                },
                'Ödeme Tahsilatı': {
                    'next_responsible': 'Lojistik Departmanı',
                    'next_action': 'Kargo işlemleri yapılacak'
                },
                'Kargoya Veriliyor': {
                    'next_responsible': 'Yönetici',
                    'next_action': 'Vaka tamamlanacak'
                }
            }

            stage_info = stage_messages.get(completed_stage, {
                'next_responsible': 'İlgili Departman',
                'next_action': 'Sonraki aşama işlemleri yapılacak'
            })

            msg = Message(
                subject=f"Centa - İade Vakası #{case_id} - {customer_name} Aşama Tamamlandı",
                recipients=user_emails,
                body=f"""Merhaba,

İade vakası #{case_id} için aşama tamamlandı.

Vaka Numarası: {case_id}
Müşteri: {customer_name}
Tamamlanan Aşama: {completed_stage}
Sonraki Aşama: {next_stage}
Güncelleyen: {updated_by or 'Sistem'}
Güncelleme Tarihi: {current_time}

Sonraki Aşama Sorumlusu: {stage_info['next_responsible']}
Yapılacak İşlem: {stage_info['next_action']}

Lütfen sonraki aşamayı en kısa sürede tamamlayınız.

Detaylı bilgi için sistemimize giriş yapabilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"İade vakası #{case_id} aşama tamamlama bildirimi {len(user_emails)} kullanıcıya gönderildi")
            return True
        except Exception as e:
            logging.error(f"İade vakası aşama tamamlama bildirimi gönderilemedi: {e}")
            return False

    @staticmethod
    def send_case_completion_notification(case_id, completed_by=None):
        """Send notification when a case is fully completed"""
        try:
            # Retrieve the list of all user emails
            users = User.query.filter(User.role.in_(['admin', 'manager'])).all()
            user_emails = [user.email for user in users]
            
            if not user_emails:
                logging.warning("E-posta gönderilecek kullanıcı bulunamadı")
                return False

            # Retrieve the case from the database
            case = ReturnCase.query.get(case_id)
            if not case:
                logging.error(f"Vaka bulunamadı, vaka numarası: {case_id}")
                return False

            # Get customer information
            customer_name = case.customer.name
            current_time = datetime.now().strftime('%d.%m.%Y %H:%M')

            msg = Message(
                subject=f"Centa - İade Vakası #{case_id} Tamamlandı",
                recipients=user_emails,
                body=f"""Merhaba,

İade vakası #{case_id} başarıyla tamamlandı.

Vaka Numarası: {case_id}
Müşteri: {customer_name}
Tamamlayan: {completed_by or 'Sistem'}
Tamamlanma Tarihi: {current_time}

Vaka tüm aşamaları başarıyla tamamlanmıştır.

Detaylı bilgi için sistemimize giriş yapabilirsiniz.

Saygılarımızla,
Centa Teknik Servis
ariza.takip@centa.com.tr
"""
            )
            mail.send(msg)
            logging.info(f"İade vakası #{case_id} tamamlama bildirimi {len(user_emails)} kullanıcıya gönderildi")
            return True
        except Exception as e:
            logging.error(f"İade vakası tamamlama bildirimi gönderilemedi: {e}")
            return False
