# services/email_service.py
from flask_mail import Message
from models import ReturnCase, User, mail
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
            logging.info(f"İade vakası bildirimi {customer_email} adresine gönderildi")
            return True
        except Exception as e:
            logging.error(f"İade vakası bildirimi gönderilemedi: {e}")
            return False
    
    @staticmethod
    def send_return_case_notification_to_all(case_id):
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
            customer_contact_info = case.customer.contact_info if case.customer else "Bilinmiyor"
            arrival_date = case.arrival_date.strftime('%d.%m.%Y') if case.arrival_date else "Belirtilmemiş"

            msg = Message(
                subject=f"Centa - İade Vakası #{case_id} Bildirimi",
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
