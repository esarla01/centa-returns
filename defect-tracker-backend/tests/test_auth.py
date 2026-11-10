"""Login, invitations, password reset and user administration."""
import re

from models import User, db
from seed import ROLE_PERMISSIONS
from models import UserRole
from tests.conftest import PASSWORD, create_case, email_for, make_client


def token_from(email_params):
    return re.search(r"token=([\w\-]+)", email_params["html"]).group(1)


def test_login_and_whoami(app, client_for):
    client = client_for("TECHNICIAN")
    body = client.get("/auth/whoami").get_json()
    assert body["email"] == email_for("TECHNICIAN")
    assert body["firstName"] == "Technician"
    assert body["lastName"] == "User"
    assert body["role"] == "TECHNICIAN"
    assert sorted(body["permissions"]) == sorted(p.name for p in ROLE_PERMISSIONS[UserRole.TECHNICIAN])
    assert db.session.get(User, email_for("TECHNICIAN")).last_login is not None


def test_login_failures(app):
    client = make_client(app)
    assert client.post("/auth/login", json={"email": email_for("ADMIN"), "password": "wrong"}).status_code == 400
    assert client.post("/auth/login", json={"email": "nobody@example.com", "password": PASSWORD}).status_code == 400
    assert client.post("/auth/login", json={"email": email_for("ADMIN")}).status_code == 400
    assert client.get("/auth/whoami").status_code == 401


def test_logout(app):
    client = make_client(app, "SALES")
    assert client.post("/auth/logout").status_code == 200
    assert client.get("/auth/whoami").status_code == 401
    assert db.session.get(User, email_for("SALES")).last_logout is not None


def test_invitation_flow(app, client_for, sent_emails):
    admin = client_for("ADMIN")
    res = admin.post("/admin/invite-user", json={"email": "new@example.com", "role": "SALES"})
    assert res.status_code == 200
    assert sent_emails[-1]["to"] == ["new@example.com"]
    token = token_from(sent_emails[-1])

    anon = make_client(app)
    body = anon.get(f"/auth/validate-invitation/{token}").get_json()
    assert body["valid"] is True
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["role"] == "SALES"

    weak = anon.post("/auth/accept-invitation", json={
        "token": token, "first_name": "Yeni", "last_name": "Kişi", "password": "weak"})
    assert weak.status_code == 400

    ok = anon.post("/auth/accept-invitation", json={
        "token": token, "first_name": "Yeni", "last_name": "Kişi", "password": "Strong1234!"})
    assert ok.status_code == 200
    assert sent_emails[-1]["to"] == ["new@example.com"]  # welcome email

    assert anon.post("/auth/login", json={"email": "new@example.com", "password": "Strong1234!"}).status_code == 200
    # The token is single use.
    assert anon.get(f"/auth/validate-invitation/{token}").status_code == 400


def test_invitation_validation(client_for):
    admin = client_for("ADMIN")
    assert admin.post("/admin/invite-user", json={"email": "not-an-email", "role": "SALES"}).status_code == 400
    assert admin.post("/admin/invite-user", json={"email": "x@example.com", "role": "BOSS"}).status_code == 400
    assert admin.post("/admin/invite-user", json={"email": "x@example.com"}).status_code == 400
    # Already an active user.
    assert admin.post("/admin/invite-user", json={"email": email_for("SALES"), "role": "SALES"}).status_code == 400


def test_reinviting_a_pending_user_issues_a_new_token(app, client_for, sent_emails):
    admin = client_for("ADMIN")
    admin.post("/admin/invite-user", json={"email": "new@example.com", "role": "SALES"})
    first = token_from(sent_emails[-1])
    admin.post("/admin/invite-user", json={"email": "new@example.com", "role": "SALES"})
    second = token_from(sent_emails[-1])

    anon = make_client(app)
    assert first != second
    assert anon.get(f"/auth/validate-invitation/{first}").status_code == 400
    assert anon.get(f"/auth/validate-invitation/{second}").status_code == 200


def test_invited_user_cannot_log_in_before_accepting(app, client_for):
    client_for("ADMIN").post("/admin/invite-user", json={"email": "new@example.com", "role": "SALES"})
    res = make_client(app).post("/auth/login", json={"email": "new@example.com", "password": PASSWORD})
    assert res.status_code == 400


def test_password_reset_flow(app, sent_emails):
    anon = make_client(app)
    email = email_for("LOGISTICS")

    # Unknown addresses get the same answer and no email.
    assert anon.post("/auth/forgot-password", json={"email": "nobody@example.com"}).status_code == 200
    assert sent_emails == []

    assert anon.post("/auth/forgot-password", json={"email": email}).status_code == 200
    token = token_from(sent_emails[-1])

    assert anon.post("/auth/reset-password", json={"token": token, "new_password": "weak"}).status_code == 400
    assert anon.post("/auth/reset-password", json={"token": "bogus", "new_password": "Strong1234!"}).status_code == 400
    assert anon.post("/auth/reset-password", json={"token": token, "new_password": "Strong1234!"}).status_code == 200

    assert anon.post("/auth/login", json={"email": email, "password": PASSWORD}).status_code == 400
    assert anon.post("/auth/login", json={"email": email, "password": "Strong1234!"}).status_code == 200
    # The token is single use.
    assert anon.post("/auth/reset-password", json={"token": token, "new_password": "Other1234!"}).status_code == 400


def test_list_users(client_for):
    admin = client_for("ADMIN")
    body = admin.get("/admin?limit=5").get_json()
    assert body["totalUsers"] == 6
    assert body["totalPages"] == 2
    assert len(body["users"]) == 5

    body = admin.get("/admin?limit=5&role=SALES").get_json()
    assert [u["email"] for u in body["users"]] == [email_for("SALES")]
    user = body["users"][0]
    assert user["firstName"] == "Sales"
    assert user["role"] == "SALES"
    assert user["isActive"] is True
    assert user["isInvited"] is False
    assert user["emailNotificationsEnabled"] is True
    assert user["createdAt"] == "01 Haz 2024 10:00"  # Turkish month names

    body = admin.get("/admin?limit=5&search=logist").get_json()
    assert [u["email"] for u in body["users"]] == [email_for("LOGISTICS")]


def test_delete_user(client_for):
    admin = client_for("ADMIN")
    assert admin.delete("/admin", json={"email": email_for("SALES")}).status_code == 200
    assert db.session.get(User, email_for("SALES")) is None
    assert admin.delete("/admin", json={"email": "nobody@example.com"}).status_code == 404
    assert admin.delete("/admin", json={}).status_code == 400


def test_notification_toggle_controls_new_case_recipients(client_for, customer, sent_emails):
    admin = client_for("ADMIN")
    res = admin.patch("/admin/toggle-email-notifications",
                      json={"email": email_for("MANAGER"), "enabled": False})
    assert res.status_code == 200
    assert res.get_json()["user"]["email_notifications_enabled"] is False

    create_case(client_for("SUPPORT"), customer)
    recipients = sent_emails[-1]["to"]
    assert email_for("MANAGER") not in recipients
    assert len(recipients) == 5

    assert admin.patch("/admin/toggle-email-notifications", json={"email": email_for("MANAGER")}).status_code == 400
    assert admin.patch("/admin/toggle-email-notifications",
                       json={"email": "nobody@example.com", "enabled": True}).status_code == 404
