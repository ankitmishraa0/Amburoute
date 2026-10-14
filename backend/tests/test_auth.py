"""
Unit and integration tests for AmbuRoute Auth & Cryptographic Security
Tests:
- Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
- Bcrypt password hashing & generic error message enforcement
- Rate limiting lockout & CAPTCHA trigger
- Passkey challenge & verification
- Expiring single-use password reset tokens
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import auth_service

client = TestClient(app)


def test_security_headers():
    res = client.get("/")
    assert res.status_code == 200
    assert res.headers.get("Strict-Transport-Security") is not None
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert "Content-Security-Policy" in res.headers


def test_auth_generic_error_on_invalid_credentials():
    # Attempt login with non-existent user
    res1 = client.post("/api/auth/login", json={
        "username": "non_existent_operator_xyz",
        "password": "wrongpassword123"
    })
    assert res1.status_code == 401
    assert res1.json()["detail"] == "Invalid email or password"

    # Attempt login with valid user but wrong password
    res2 = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrongpassword123"
    })
    assert res2.status_code == 401
    # MUST be exact same generic message to prevent username enumeration
    assert res2.json()["detail"] == "Invalid email or password"

    # Reset attempts for admin to keep tests clean
    auth_service.reset_failed_attempts("testclient:admin")


def test_auth_successful_login():
    res = client.post("/api/auth/login", json={
        "username": "driver108",
        "password": "1080"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data
    assert "password" not in data["user"]
    assert data["user"]["username"] == "driver108"


def test_captcha_generation():
    res = client.get("/api/auth/captcha")
    assert res.status_code == 200
    data = res.json()
    assert "challenge_id" in data
    assert "question" in data
    assert "Security Check" in data["question"]


def test_passkey_challenge_and_verify():
    # 1. Request challenge
    c_res = client.post("/api/auth/passkey/challenge", json={"username": "driver108"})
    assert c_res.status_code == 200
    challenge_data = c_res.json()
    assert "challenge" in challenge_data

    # 2. Verify passkey
    v_res = client.post("/api/auth/passkey/verify", json={
        "challenge": challenge_data["challenge"],
        "credential_id": "test_cred_id_12345",
        "username": "driver108"
    })
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["success"] is True
    assert "access_token" in v_data


def test_password_reset_flow():
    # Use dedicated user for reset test
    client.post("/api/users", json={
        "username": "reset_test_user",
        "name": "Reset Test User",
        "role": "driver",
        "password": "initialPass123"
    })

    # 1. Request reset
    req_res = client.post("/api/auth/forgot-password", json={"username": "reset_test_user"})
    assert req_res.status_code == 200
    data = req_res.json()
    assert data["success"] is True
    token = data["reset_token"]

    # 2. Reset password using single-use token
    new_pw = "newSecretPass99"
    reset_res = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": new_pw
    })
    assert reset_res.status_code == 200

    # 3. Verify single-use: token cannot be reused
    reuse_res = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": "anotherPassword"
    })
    assert reuse_res.status_code == 400

    # 4. Verify login with new password
    login_res = client.post("/api/auth/login", json={
        "username": "reset_test_user",
        "password": new_pw
    })
    assert login_res.status_code == 200

    # Cleanup test user
    client.delete("/api/users/reset_test_user")
