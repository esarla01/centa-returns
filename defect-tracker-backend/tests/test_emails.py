"""Notification emails: who gets them, when, and that they are safe."""
import resend

from models import Customers, db
from tests.conftest import advance_to, case_status, create_case, email_for, make_client


def test_stage_emails_are_off_by_default(client_for, customer, product, service, sent_emails):
    case_id = create_case(client_for("SUPPORT"), customer)
    sent_emails.clear()
    advance_to(client_for, case_id, "COMPLETED", product, service)
    assert sent_emails == []


def test_stage_emails_go_to_the_team_that_owns_the_next_stage(
        app, client_for, customer, product, service, sent_emails, monkeypatch):
    monkeypatch.setitem(app.config, "STAGE_EMAILS_ENABLED", True)
    case_id = create_case(client_for("SUPPORT"), customer)
    sent_emails.clear()
    advance_to(client_for, case_id, "COMPLETED", product, service)

    assert [sorted(mail["to"]) for mail in sent_emails] == [
        [email_for("TECHNICIAN")],
        [email_for("SALES")],
        [email_for("LOGISTICS")],
        [email_for("ADMIN"), email_for("MANAGER")],
    ]
    first = sent_emails[0]
    assert first["subject"] == f"Centa - Arıza Vakası #{case_id} - Acme Asansör Aşama Tamamlandı"
    for expected in ("Teslim Alındı", "Teknik İnceleme", "Teknik Servis", "Support"):
        assert expected in first["html"]


def test_stage_emails_respect_the_notification_switch(
        app, client_for, customer, sent_emails, monkeypatch):
    monkeypatch.setitem(app.config, "STAGE_EMAILS_ENABLED", True)
    client_for("ADMIN").patch("/admin/toggle-email-notifications",
                              json={"email": email_for("TECHNICIAN"), "enabled": False})
    case_id = create_case(client_for("SUPPORT"), customer)
    sent_emails.clear()
    advance_to(client_for, case_id, "TECHNICAL_REVIEW")
    assert sent_emails == []  # the only technician opted out


def test_a_mail_failure_never_fails_the_request(app, client_for, customer, monkeypatch):
    def broken(params):
        raise RuntimeError("mail service down")

    monkeypatch.setattr(resend.Emails, "send", broken)
    monkeypatch.setitem(app.config, "STAGE_EMAILS_ENABLED", True)

    case_id = create_case(client_for("SUPPORT"), customer)  # asserts 201
    advance_to(client_for, case_id, "TECHNICAL_REVIEW")     # asserts 200
    assert case_status(case_id) == "TECHNICAL_REVIEW"


def test_user_text_cannot_inject_html(client_for, sent_emails):
    db.session.add(Customers(name='<script>alert(1)</script>', contact_info="a@b.co"))
    db.session.commit()
    customer_id = Customers.query.one().id

    case_id = create_case(client_for("SUPPORT"), customer_id)
    assert "<script>" not in sent_emails[-1]["html"]
    assert "&lt;script&gt;" in sent_emails[-1]["html"]

    client_for("LOGISTICS").post(f"/returns/{case_id}/send-customer-email", json={
        "emailContent": "Merhaba,\n<b>ürününüz</b> yolda", "recipientEmail": "a@b.co"})
    html = sent_emails[-1]["html"]
    assert "<b>" not in html
    assert "Merhaba,\n&lt;b&gt;ürününüz&lt;/b&gt; yolda" in html  # line breaks kept, tags escaped
    assert "white-space: pre-wrap" in html


def test_password_reset_sends_a_confirmation(app, sent_emails):
    import re
    anon = make_client(app)
    anon.post("/auth/forgot-password", json={"email": email_for("SALES")})
    token = re.search(r"token=([\w\-]+)", sent_emails[-1]["html"]).group(1)

    res = anon.post("/auth/reset-password", json={"token": token, "new_password": "Strong1234!"})
    assert res.get_json()["msg"] == "Şifre başarıyla sıfırlandı"
    assert sent_emails[-1]["subject"] == "Centa Arıza Takip Sistemi - Şifreniz Sıfırlandı"
    assert sent_emails[-1]["to"] == [email_for("SALES")]
