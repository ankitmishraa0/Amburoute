"""
AmbuRoute Advanced Authentication & Cryptographic Security Service
Implements:
- Bcrypt password hashing and automatic legacy password migration
- JWT Access and Refresh token generation with secure verification
- In-memory sliding-window rate limiting and temporary terminal lockout
- Challenge-response CAPTCHA for repeated failure deterrence
- Two-Factor Authentication (TOTP / 6-digit OTP)
- Expiring, single-use password reset tokens with SHA-256 hashing
- Input sanitization and parameterized query validation to prevent SQLi & XSS
"""
import os
import time
import secrets
import hashlib
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Tuple, Any
import bcrypt
import jwt

# Security Configuration
SECRET_KEY = os.getenv("AMBUROUTE_SECRET_KEY", "amburoute-cad-telemetry-secure-jwt-key-2026-v2")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Rate Limiting Configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 60
CAPTCHA_TRIGGER_ATTEMPTS = 3

# In-memory stores (in production, backed by Redis or SQL)
_failed_attempts: Dict[str, list] = {}  # key -> list of timestamp floats
_lockouts: Dict[str, float] = {}        # key -> lockout expiry timestamp
_captcha_store: Dict[str, dict] = {}    # challenge_id -> {answer, expires_at}
_two_factor_otps: Dict[str, dict] = {}  # username -> {code_hash, expires_at}
_reset_tokens: Dict[str, dict] = {}     # token_hash -> {username, expires_at, consumed}


# ============================================================================
# 1. BCRYPT PASSWORD HASHING & LEGACY MIGRATION
# ============================================================================

def is_bcrypt_hash(value: str) -> bool:
    """Check if the string is already a valid bcrypt hash."""
    if not isinstance(value, str):
        return False
    return bool(re.match(r"^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$", value))


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using bcrypt with salt rounds = 12."""
    if not plain_password:
        raise ValueError("Password cannot be empty.")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, stored_password_or_hash: str) -> Tuple[bool, bool]:
    """
    Verify password against stored value.
    Returns (is_valid: bool, needs_rehash: bool).
    If the stored value is an unhashed legacy password, matches safely and flags needs_rehash=True.
    """
    if not plain_password or not stored_password_or_hash:
        return False, False

    if is_bcrypt_hash(stored_password_or_hash):
        try:
            is_valid = bcrypt.checkpw(
                plain_password.encode("utf-8"),
                stored_password_or_hash.encode("utf-8")
            )
            return is_valid, False
        except Exception:
            return False, False
    else:
        # Legacy plaintext comparison using constant-time comparison to prevent timing attacks
        is_valid = secrets.compare_digest(plain_password.strip(), stored_password_or_hash.strip())
        return is_valid, True  # Needs rehash to bcrypt


# ============================================================================
# 2. JWT SESSION & REFRESH TOKENS
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed, short-lived JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
        "jti": secrets.token_hex(8)
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a signed, long-lived JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
        "jti": secrets.token_hex(16)
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# ============================================================================
# 3. RATE LIMITING & LOCKOUT MANAGEMENT
# ============================================================================

def get_client_key(ip_address: str, username: Optional[str] = None) -> str:
    """Generate a combined rate-limiting key."""
    clean_ip = (ip_address or "unknown_ip").strip()
    clean_user = (username or "").strip().lower()
    return f"{clean_ip}:{clean_user}" if clean_user else clean_ip


def check_rate_limit(client_key: str) -> Tuple[bool, int, bool]:
    """
    Check if client is currently locked out or needs CAPTCHA.
    Returns (is_locked: bool, retry_after_seconds: int, requires_captcha: bool).
    """
    now = time.time()

    # 1. Check active lockout
    if client_key in _lockouts:
        lockout_expiry = _lockouts[client_key]
        if now < lockout_expiry:
            remaining = int(lockout_expiry - now) + 1
            return True, remaining, True
        else:
            # Lockout expired, clear lockout and attempts
            del _lockouts[client_key]
            _failed_attempts.pop(client_key, None)

    # 2. Check sliding-window attempts within last 5 minutes (300 seconds)
    window = 300.0
    attempts = _failed_attempts.get(client_key, [])
    # Filter attempts within window
    recent_attempts = [t for t in attempts if now - t < window]
    _failed_attempts[client_key] = recent_attempts

    requires_captcha = len(recent_attempts) >= CAPTCHA_TRIGGER_ATTEMPTS

    if len(recent_attempts) >= MAX_FAILED_ATTEMPTS:
        _lockouts[client_key] = now + LOCKOUT_DURATION_SECONDS
        return True, LOCKOUT_DURATION_SECONDS, True

    return False, 0, requires_captcha


def record_failed_attempt(client_key: str) -> Tuple[int, bool, int]:
    """
    Record a failed login attempt.
    Returns (attempt_count: int, is_locked: bool, lockout_seconds: int).
    """
    now = time.time()
    attempts = _failed_attempts.setdefault(client_key, [])
    # Keep attempts within 5 minutes
    attempts = [t for t in attempts if now - t < 300.0]
    attempts.append(now)
    _failed_attempts[client_key] = attempts

    count = len(attempts)
    if count >= MAX_FAILED_ATTEMPTS:
        _lockouts[client_key] = now + LOCKOUT_DURATION_SECONDS
        return count, True, LOCKOUT_DURATION_SECONDS

    return count, False, 0


def reset_failed_attempts(client_key: str) -> None:
    """Clear failed attempts upon successful login."""
    _failed_attempts.pop(client_key, None)
    _lockouts.pop(client_key, None)


# ============================================================================
# 4. CAPTCHA CHALLENGE GENERATION & VERIFICATION
# ============================================================================

def generate_captcha() -> Dict[str, str]:
    """
    Generate an accessible, tamper-proof math CAPTCHA.
    Returns {challenge_id, question}.
    """
    num1 = secrets.randbelow(12) + 2
    num2 = secrets.randbelow(9) + 1
    answer = str(num1 + num2)

    challenge_id = secrets.token_hex(16)
    _captcha_store[challenge_id] = {
        "answer": answer,
        "expires_at": time.time() + 180.0  # 3 minutes
    }

    # Clean old expired captchas
    _purge_expired_captchas()

    return {
        "challenge_id": challenge_id,
        "question": f"Security Check: What is {num1} + {num2}?"
    }


def verify_captcha(challenge_id: Optional[str], user_answer: Optional[str]) -> bool:
    """Verify CAPTCHA solution."""
    if not challenge_id or not user_answer:
        return False

    record = _captcha_store.get(challenge_id)
    if not record:
        return False

    # Single-use challenge: delete immediately
    del _captcha_store[challenge_id]

    if time.time() > record["expires_at"]:
        return False

    return secrets.compare_digest(record["answer"].strip(), user_answer.strip())


def _purge_expired_captchas():
    now = time.time()
    expired = [k for k, v in _captcha_store.items() if now > v.get("expires_at", 0)]
    for k in expired:
        _captcha_store.pop(k, None)


# ============================================================================
# 5. TWO-FACTOR AUTHENTICATION (TOTP / OTP)
# ============================================================================

def generate_2fa_otp(username: str) -> str:
    """
    Generate a 6-digit cryptographic numeric OTP valid for 5 minutes.
    Returns the plain OTP code.
    """
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    code_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()

    _two_factor_otps[username.lower()] = {
        "code_hash": code_hash,
        "expires_at": time.time() + 300.0  # 5 minutes
    }
    return otp_code


def verify_2fa_otp(username: str, submitted_code: str) -> bool:
    """Verify 2FA OTP code; consumed on first successful attempt."""
    if not username or not submitted_code:
        return False

    clean_user = username.strip().lower()
    record = _two_factor_otps.get(clean_user)
    if not record:
        return False

    if time.time() > record["expires_at"]:
        del _two_factor_otps[clean_user]
        return False

    submitted_hash = hashlib.sha256(submitted_code.strip().encode("utf-8")).hexdigest()
    is_match = secrets.compare_digest(record["code_hash"], submitted_hash)

    if is_match:
        # Single use
        del _two_factor_otps[clean_user]
        return True

    return False


# ============================================================================
# 6. EXPIRING, SINGLE-USE PASSWORD RESET TOKENS
# ============================================================================

def create_password_reset_token(username: str) -> str:
    """
    Create a cryptographically secure, 15-minute expiring single-use reset token.
    Returns the URL-safe raw token string for the user.
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    _reset_tokens[token_hash] = {
        "username": username.strip().lower(),
        "expires_at": time.time() + 900.0,  # 15 minutes
        "consumed": False
    }
    return raw_token


def verify_and_consume_reset_token(raw_token: str) -> Optional[str]:
    """
    Validate and consume a single-use reset token.
    Returns target username if valid, otherwise None.
    """
    if not raw_token:
        return None

    token_hash = hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()
    record = _reset_tokens.get(token_hash)
    if not record:
        return None

    if record.get("consumed"):
        return None

    if time.time() > record.get("expires_at", 0):
        del _reset_tokens[token_hash]
        return None

    # Mark as consumed immediately (single-use guarantee)
    record["consumed"] = True
    return record["username"]


# ============================================================================
# 7. INPUT SANITIZATION & PARAMETERIZED QUERY PREVENTATIVE PATTERNS
# ============================================================================

def sanitize_input(value: Any) -> str:
    """Sanitize incoming string input: trim, strip null bytes, and escape HTML tags."""
    if value is None:
        return ""
    text = str(value).strip()
    # Remove null bytes
    text = text.replace("\0", "")
    # Remove dangerous script tags and angle brackets
    text = re.sub(r"[<>]", "", text)
    return text


def execute_parameterized_query(query_template: str, params: Tuple[Any, ...]) -> Tuple[str, Tuple[Any, ...]]:
    """
    Demonstrative parameterized query constructor.
    Ensures SQL queries use bound parameters ('?' or '%s') rather than string concatenation.
    """
    if not isinstance(params, (tuple, list)):
        raise TypeError("Query parameters must be passed as a tuple or list for safe parameter binding.")
    # Verify no raw unescaped interpolations in template
    if re.search(r"['\"][ ]*\+[ ]*[a-zA-Z0-9_]+", query_template):
        raise ValueError("Unsafe string concatenation detected in SQL template. Use parameterized '?' markers.")
    return query_template, tuple(params)
