"""
AmbuRoute User & Operator Management Router
Handles CRUD operations and persistence for Ambulance Drivers, ER Staff, Traffic Officers, and Admins.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os

router = APIRouter(prefix="/api/users", tags=["Users"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "users.json")

DEFAULT_USERS = [
    {
        "id": "admin",
        "username": "admin",
        "name": "System Administrator (God Mode)",
        "role": "admin",
        "department": "Master Administration",
        "badge": "ALL POWERS ENABLED",
        "password": "admin123",
        "status": "active",
        "assignedTab": "admin_panel",
        "createdAt": "2026-01-01",
        "description": "Full Root Authority: V2I traffic override, live telemetry simulation, hospital beds, and system users."
    },
    {
        "id": "driver108",
        "username": "driver108",
        "name": "Paramedic J. Miller & Driver Rajesh",
        "role": "driver",
        "department": "Ambulance Crew (ALS)",
        "badge": "UNIT MEDIC-12 (ALS)",
        "password": "1080",
        "status": "active",
        "assignedTab": "command_map",
        "createdAt": "2026-01-01",
        "description": "Emergency turn-by-turn navigation, patient vitals transmission, and dynamic hospital routing."
    },
    {
        "id": "doctor_aiims",
        "username": "doctor_aiims",
        "name": "Dr. C. Sterling (Attending Physician)",
        "role": "hospital",
        "department": "Hospital Emergency Room",
        "badge": "AIIMS GORAKHPUR ER",
        "password": "aiims123",
        "status": "active",
        "assignedTab": "handoff",
        "createdAt": "2026-01-01",
        "description": "Pre-arrival patient telemetry intake, Lead-II ECG monitor, ICU bed reservation, and clinical triage."
    },
    {
        "id": "traffic_gkp",
        "username": "traffic_gkp",
        "name": "Officer R. Verma (Traffic ITMS)",
        "role": "traffic",
        "department": "ITMS Traffic Police HQ",
        "badge": "GORAKHPUR TRAFFIC POLICE",
        "password": "traffic123",
        "status": "active",
        "assignedTab": "signals",
        "createdAt": "2026-01-01",
        "description": "Real-time V2I intersection preemption, automated green wave corridors, and manual cycle overrides."
    }
]


def load_users():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        save_users(DEFAULT_USERS)
        return DEFAULT_USERS
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_USERS


def save_users(users_list):
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(users_list, f, indent=2)


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., pattern="^(driver|hospital|traffic|admin)$")
    department: Optional[str] = None
    badge: Optional[str] = None
    password: str = Field(..., min_length=4)
    status: Optional[str] = "active"
    description: Optional[str] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    badge: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


@router.get("")
def get_users():
    users = load_users()
    # Mask passwords in listing for security
    safe_users = []
    for u in users:
        item = dict(u)
        item["hasPassword"] = bool(item.get("password"))
        # Do not expose raw password in open listing
        item["password"] = "••••••••"
        safe_users.append(item)
    return {"users": safe_users, "total": len(safe_users)}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(req: UserCreateRequest):
    users = load_users()
    clean_username = req.username.strip().lower()

    if any(u.get("username", "").lower() == clean_username for u in users):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User ID '{clean_username}' already exists. Choose a different username."
        )

    tab_map = {
        "driver": "command_map",
        "hospital": "handoff",
        "traffic": "signals",
        "admin": "admin_panel"
    }

    dept_map = {
        "driver": "Ambulance Crew (ALS/BLS)",
        "hospital": "Hospital Emergency Room",
        "traffic": "Traffic Police ITMS",
        "admin": "Master Administration"
    }

    new_user = {
        "id": clean_username,
        "username": clean_username,
        "name": req.name.strip(),
        "role": req.role,
        "department": req.department or dept_map.get(req.role, "Operations"),
        "badge": req.badge.strip().upper() if req.badge else f"UNIT-{clean_username.upper()}",
        "password": req.password.strip(),
        "status": req.status or "active",
        "assignedTab": tab_map.get(req.role, "command_map"),
        "createdAt": "2026-09-20",
        "description": req.description or f"Registered operator {req.name.strip()}."
    }

    users.append(new_user)
    save_users(users)
    return {"message": "User created successfully", "user": {k: v for k, v in new_user.items() if k != "password"}}


@router.put("/{username}")
def update_user(username: str, req: UserUpdateRequest):
    users = load_users()
    clean_username = username.strip().lower()

    index = next((i for i, u in enumerate(users) if u.get("username", "").lower() == clean_username), -1)
    if index == -1:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if clean_username == "admin" and req.status and req.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Root admin cannot be deactivated.")

    update_dict = req.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if v is not None:
            users[index][k] = v

    save_users(users)
    return {"message": "User updated successfully"}


@router.delete("/{username}")
def delete_user(username: str):
    clean_username = username.strip().lower()
    if clean_username == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Root admin cannot be deleted.")

    users = load_users()
    initial_len = len(users)
    users = [u for u in users if u.get("username", "").lower() != clean_username]

    if len(users) == initial_len:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    save_users(users)
    return {"message": f"User '{clean_username}' deleted successfully"}


@router.post("/sync")
def sync_users(users_list: List[dict]):
    if users_list:
        save_users(users_list)
    return {"status": "synced", "count": len(users_list)}
