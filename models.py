from pydantic import BaseModel, EmailStr, constr, ValidationError
from typing import Optional, Literal
from datetime import date


class RegisterModel(BaseModel):
    username: constr(min_length=3, max_length=50)
    password: constr(min_length=6)
    phone_no: Optional[str] = None
    device_id: Optional[str] = None
    role: str = Literal["user", "admin"]
    sub_start_date: Optional[str] = None
    sub_end_date: Optional[str] = None
    calories_goal: Optional[int] = None
    proteins_goal: Optional[int] = None
    fats_goal: Optional[int] = None
    carbs_goal: Optional[int] = None
    gender: str = Literal["male", "female", "other", "prefer_not_to_say"]
    dob: str  # Date of birth in YYYY-MM-DD format
    height: Optional[int] = None
    weight: Optional[int] = None


class ContactModel(BaseModel):
    username: constr(min_length=3, max_length=50)
    phone_no: str
    email_id: EmailStr
    message: constr(min_length=10, max_length=1000)
    preferred_role: str = Literal["user", "admin"]
    device_id: Optional[str] = None
    gender: str = Literal["male", "female", "other", "prefer_not_to_say"]
    dob: str  # Date of birth in YYYY-MM-DD format
    height: Optional[int] = None
    weight: Optional[int] = None