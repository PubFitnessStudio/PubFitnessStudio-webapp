from models import RegisterModel, ContactModel

from datetime import datetime
from pydantic import ValidationError

import sqlite3
import aiosqlite
import bcrypt
import uuid
import os

DB_NAME = os.getenv("DB_NAME", "pubfitnessstudio.db")

def create_tables():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        device_id TEXT,
        phone_no TEXT,
        profile_img BLOB,
        sub_start_date DATE,
        sub_end_date DATE,
        calories_goal INTEGER,
        proteins_goal INTEGER,
        fats_goal INTEGER,
        carbs_goal INTEGER,
        gender TEXT,
        dob DATE,
        height INTEGER,
        weight INTEGER
    )
    """)

    # Create nutrition_data table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS nutrition_data (
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        breakfast TEXT,
        lunch TEXT,
        snacks TEXT,
        dinner TEXT,
        calories REAL,
        carbs REAL,
        proteins REAL,
        fats REAL,
        water REAL,
        PRIMARY KEY (user_id, date),
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
    )
    """)

    # Create registrations table for contact admin requests
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        registration_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        phone_no TEXT NOT NULL,
        email_id TEXT NOT NULL,
        message TEXT NOT NULL,
        preferred_role TEXT NOT NULL,
        device_id TEXT,
        gender TEXT NOT NULL,
        dob TEXT NOT NULL,
        height INTEGER,
        weight INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by TEXT,
        notes TEXT
    )
    """)

    # Check if default admin exists, if not create it
    admin_username = os.getenv("ADMIN_USERNAME", "PubFit")
    admin_password = os.getenv("ADMIN_PASSWORD", "PubFit@123")

    cursor.execute("SELECT COUNT(*) FROM users WHERE username = ?", (admin_username,))
    admin_exists = cursor.fetchone()[0]
    
    if admin_exists == 0:
        # Create default admin user
        admin_id = uuid.uuid4().hex
        
        admin_password = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        
        cursor.execute("""
            INSERT INTO users (
                user_id, role, username, password, phone_no, 
                sub_start_date, sub_end_date, calories_goal, proteins_goal, fats_goal, carbs_goal,
                gender, dob
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            admin_id, 'admin', admin_username, admin_password, '9876543210',
            '2024-01-01', '9999-12-31', 2000, 150, 65, 250,
            'prefer_not_to_say', '1990-01-01'
        ))
        
        print("Default admin user created successfully!")

    conn.commit()
    conn.close()
    print("Tables created successfully.")



async def login(username: str, password: str):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(
            "SELECT user_id, username, password, sub_end_date, role FROM users WHERE username=?",
            (username,)
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        return {
            "status": "failure",
            "reason": "No such user exists",
            "username": None,
            "user_id": None,
            "subscription_end_date": None,
            "no_days_to_subscription_end": None,
            "role": None
        }

    user_id, uname, hashed_pw, sub_end_date, role = row
    
    # Verify password with bcrypt
    if not bcrypt.checkpw(password.encode("utf-8"), hashed_pw.encode("utf-8")):
        return {
            "status": "failure",
            "reason": "Invalid password",
            "username": None,
            "user_id": None,
            "subscription_end_date": None,
            "no_days_to_subscription_end": None,
            "role": None
        }

    # Calculate remaining days
    days_left = None
    if sub_end_date:
        try:
            end_date = datetime.strptime(sub_end_date, "%Y-%m-%d").date()
            days_left = (end_date - datetime.today().date()).days
            if days_left < 0:
                days_left = None
        except Exception:
            days_left = None
    print(days_left)
    return {
        "status": "success" if days_left is not None else "failure",
        "reason": "User validated successfully" if days_left is not None else "Subscription Expired",
        "username": uname,
        "user_id": user_id,
        "subscription_end_date": sub_end_date,
        "no_days_to_subscription_end": days_left,
        "role": role
    }


async def register(data: dict):
    try:
        validated = RegisterModel(**data)
    except ValidationError as e:
        return {"status": "failure", "error": e.errors()}

    user_id = uuid.uuid4().hex
    role = validated.role if validated.role in ["admin", "user"] else "user"

    # Hash password
    hashed_pw = bcrypt.hashpw(validated.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Handle profile image if provided
    profile_img = None
    if hasattr(validated, 'profile_image') and validated.profile_image:
        try:
            # Read the file content
            profile_img = validated.profile_image.read()
        except Exception as e:
            return {"status": "failure", "error": f"Error reading profile image: {str(e)}"}

    async with aiosqlite.connect(DB_NAME) as db:
        try:
            await db.execute("""
                INSERT INTO users (
                    user_id, role, username, password, device_id, phone_no, 
                    sub_start_date, sub_end_date, calories_goal, proteins_goal, fats_goal, carbs_goal,
                    gender, dob, height, weight, profile_img
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, role, validated.username, hashed_pw, validated.device_id, validated.phone_no,
                validated.sub_start_date, validated.sub_end_date,
                validated.calories_goal, validated.proteins_goal,
                validated.fats_goal, validated.carbs_goal,
                validated.gender, validated.dob, validated.height, validated.weight, profile_img
            ))
            await db.commit()
        except Exception as e:
            return {"status": "failure", "error": str(e)}

    days_left = None
    if validated.sub_end_date:
        try:
            end_date = datetime.strptime(validated.sub_end_date, "%Y-%m-%d").date()
            days_left = (end_date - datetime.today().date()).days
        except Exception:
            days_left = None
            
    return {
        "status": "success",
        "reason": "Registration Successful",
        "user_id": user_id,
        "username": validated.username,
        "subscription_end_date": validated.sub_end_date,
        "no_days_to_subscription_end": days_left,
        "role": role
    }


async def contact_admin(data: dict):
    try:
        validated = ContactModel(**data)
    except ValidationError as e:
        return {"status": "failure", "message": f"Validation error: {e.errors()}"}

    registration_id = uuid.uuid4().hex

    async with aiosqlite.connect(DB_NAME) as db:
        try:
            await db.execute("""
                INSERT INTO registrations (
                    registration_id, username, phone_no, email_id, message, 
                    preferred_role, device_id, gender, dob, height, weight, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                registration_id, validated.username, validated.phone_no, 
                validated.email_id, validated.message, validated.preferred_role, 
                validated.device_id, validated.gender, validated.dob, 
                validated.height, validated.weight, 'pending'
            ))
            await db.commit()
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}

    return {
        "status": "success",
        "message": "Your registration request has been submitted successfully! We will review it and contact you soon.",
        "registration_id": registration_id
    }


async def get_pending_registrations():
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            async with db.execute("""
                SELECT registration_id, username, phone_no, email_id, message, 
                       preferred_role, device_id, gender, dob, height, weight, status, created_at
                FROM registrations 
                WHERE status = 'pending'
                ORDER BY created_at DESC
            """) as cursor:
                rows = await cursor.fetchall()
                
                requests = []
                for row in rows:
                    requests.append({
                        "registration_id": row[0],
                        "username": row[1],
                        "phone_no": row[2],
                        "email_id": row[3],
                        "message": row[4],
                        "preferred_role": row[5],
                        "device_id": row[6],
                        "gender": row[7],
                        "dob": row[8],
                        "height": row[9],
                        "weight": row[10],
                        "status": row[11],
                        "created_at": row[12]
                    })
                
                return {"status": "success", "requests": requests}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def approve_registration(registration_id: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            # First, get the registration details
            async with db.execute("""
                SELECT username, phone_no, email_id, preferred_role, device_id, 
                       gender, dob, height, weight
                FROM registrations 
                WHERE registration_id = ?
            """, (registration_id,)) as cursor:
                row = await cursor.fetchone()
                
                if not row:
                    return {"status": "failure", "message": "Registration request not found"}
                
                username, phone_no, email_id, preferred_role, device_id, gender, dob, height, weight = row
                
                # Check if username already exists
                async with db.execute("SELECT COUNT(*) FROM users WHERE username = ? and phone_no = ?", (username, phone_no)) as user_cursor:
                    user_exists = (await user_cursor.fetchone())[0]
                    
                    if user_exists > 0:
                        return {"status": "failure", "message": "Username already exists in users table"}
                
                # Generate a random password for the new user
                temp_password = os.getenv("NEW_USER_PASSWORD", "pubfitnessstudio")
                
                # Hash the password
                hashed_pw = bcrypt.hashpw(temp_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                
                # Create user account with current date as subscription start and end dates
                user_id = uuid.uuid4().hex
                current_date = datetime.now().strftime("%Y-%m-%d")
                
                await db.execute("""
                    INSERT INTO users (
                        user_id, role, username, password, phone_no, device_id,
                        gender, dob, height, weight, sub_start_date, sub_end_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id, preferred_role, username, hashed_pw, phone_no, device_id,
                    gender, dob, height, weight, current_date, current_date
                ))
                
                # Update registration status to approved
                await db.execute("""
                    UPDATE registrations 
                    SET status = 'approved', processed_at = CURRENT_TIMESTAMP
                    WHERE registration_id = ?
                """, (registration_id,))
                
                await db.commit()
                
                return {
                    "status": "success", 
                    "message": f"Registration approved and user account created successfully! Temporary password: {temp_password}",
                    "user_id": user_id,
                    "username": username,
                    "temp_password": temp_password
                }
                
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def reject_registration(registration_id: str, reason: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            # Update status to rejected with reason
            await db.execute("""
                UPDATE registrations 
                SET status = 'rejected', processed_at = CURRENT_TIMESTAMP, notes = ?
                WHERE registration_id = ?
            """, (reason, registration_id))
            
            await db.commit()
            return {"status": "success", "message": "Registration request rejected successfully"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def get_dashboard_statistics():
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            # Get total users
            async with db.execute("SELECT COUNT(*) FROM users") as cursor:
                total_users = (await cursor.fetchone())[0]
            
            # Get active users (subscription not expired)
            async with db.execute("""
                SELECT COUNT(*) FROM users 
                WHERE sub_end_date IS NOT NULL AND sub_end_date > date('now')
            """) as cursor:
                active_users = (await cursor.fetchone())[0]
            
            # Get users expiring in 7 days
            async with db.execute("""
                SELECT COUNT(*) FROM users 
                WHERE sub_end_date IS NOT NULL 
                AND sub_end_date BETWEEN date('now') AND date('now', '+7 days')
            """) as cursor:
                expiring_users = (await cursor.fetchone())[0]
            
            # Get expired users (subscription expired)
            async with db.execute("""
                SELECT COUNT(*) FROM users 
                WHERE sub_end_date < date('now')
            """) as cursor:
                expired_users = (await cursor.fetchone())[0]
            
            return {
                "status": "success",
                "total_users": total_users,
                "active_users": active_users,
                "expiring_users": expiring_users,
                "expired_users": expired_users
            }
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def get_all_users():
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            async with db.execute("""
                SELECT user_id, username, phone_no, profile_img, 
                       sub_start_date, sub_end_date, role
                FROM users 
                ORDER BY username
            """) as cursor:
                rows = await cursor.fetchall()
                
                users = []
                for row in rows:
                    profile_img = None
                    if row[3]:  # If profile_img exists
                        import base64
                        profile_img = base64.b64encode(row[3]).decode('utf-8')
                    
                    users.append({
                        "user_id": row[0],
                        "username": row[1],
                        "phone_no": row[2],
                        "profile_img": profile_img,
                        "sub_start_date": row[4],
                        "sub_end_date": row[5],
                        "role": row[6]
                    })
                return {"status": "success", "users": users}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def get_user_goals_from_db(user_id: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            async with db.execute("""
                SELECT calories_goal, proteins_goal, fats_goal, carbs_goal
                FROM users 
                WHERE user_id = ?
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    return {
                        "status": "success",
                        "goals": {
                            "calories_goal": row[0] or 2000,
                            "proteins_goal": row[1] or 150,
                            "fats_goal": row[2] or 65,
                            "carbs_goal": row[3] or 250
                        }
                    }
                else:
                    return {"status": "failure", "message": "User not found"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def get_nutrition_data_from_db(user_id: str, date: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            async with db.execute("""
                SELECT breakfast, lunch, snacks, dinner, calories, carbs, proteins, fats, water
                FROM nutrition_data 
                WHERE user_id = ? AND date = ?
            """, (user_id, date)) as cursor:
                row = await cursor.fetchone()
                
                if row:
                    return {
                        "status": "success",
                        "nutrition_data": {
                            "breakfast": row[0] or "",
                            "lunch": row[1] or "",
                            "snacks": row[2] or "",
                            "dinner": row[3] or "",
                            "calories": row[4] or 0,
                            "carbs": row[5] or 0,
                            "proteins": row[6] or 0,
                            "fats": row[7] or 0,
                            "water": row[8] or 0
                        }
                    }
                else:
                    return {
                        "status": "success",
                        "nutrition_data": {
                            "breakfast": "",
                            "lunch": "",
                            "snacks": "",
                            "dinner": "",
                            "calories": 0,
                            "carbs": 0,
                            "proteins": 0,
                            "fats": 0,
                            "water": 0
                        }
                    }
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def save_nutrition_data_to_db(user_id: str, data: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            # Insert or update nutrition data with all nutrition fields
            await db.execute("""
                INSERT OR REPLACE INTO nutrition_data 
                (user_id, date, breakfast, lunch, snacks, dinner, calories, carbs, proteins, fats, water)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                data.get('date'),
                data.get('breakfast', ''),
                data.get('lunch', ''),
                data.get('snacks', ''),
                data.get('dinner', ''),
                data.get('calories', 0),
                data.get('carbs', 0),
                data.get('proteins', 0),
                data.get('fats', 0),
                data.get('water', 0)
            ))
            
            await db.commit()
            return {"status": "success", "message": "Nutrition data saved successfully"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def get_user_profile_from_db(user_id: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            async with db.execute("""
                SELECT user_id, username, phone_no, role, profile_img, gender, dob, height, weight,
                       calories_goal, proteins_goal, fats_goal, carbs_goal
                FROM users 
                WHERE user_id = ?
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                
                if row:
                    profile_img = None
                    if row[4]:  # If profile_img exists
                        import base64
                        profile_img = base64.b64encode(row[4]).decode('utf-8')
                    
                    return {
                        "status": "success",
                        "user": {
                            "user_id": row[0],
                            "username": row[1],
                            "phone_no": row[2],
                            "role": row[3],
                            "profile_img": profile_img,
                            "gender": row[5],
                            "dob": row[6],
                            "height": row[7],
                            "weight": row[8],
                            "calories_goal": row[9] or 2000,
                            "proteins_goal": row[10] or 150,
                            "fats_goal": row[11] or 65,
                            "carbs_goal": row[12] or 250
                        }
                    }
                else:
                    return {"status": "failure", "message": "User not found"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def update_user_profile_to_db(user_id: str, data: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            await db.execute("""
                UPDATE users 
                SET username = ?, phone_no = ?, gender = ?, dob = ?, height = ?, weight = ?
                WHERE user_id = ?
            """, (
                data.get('username'),
                data.get('phone_no'),
                data.get('gender'),
                data.get('dob'),
                data.get('height'),
                data.get('weight'),
                user_id
            ))
            
            await db.commit()
            return {"status": "success", "message": "Profile updated successfully"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def update_user_goals_to_db(user_id: str, data: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            await db.execute("""
                UPDATE users 
                SET calories_goal = ?, proteins_goal = ?, fats_goal = ?, carbs_goal = ?
                WHERE user_id = ?
            """, (
                data.get('calories_goal'),
                data.get('proteins_goal'),
                data.get('fats_goal'),
                data.get('carbs_goal'),
                user_id
            ))
            
            await db.commit()
            return {"status": "success", "message": "Nutrition goals updated successfully"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def update_profile_image_to_db(user_id: str, file):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            # Read the file content
            file_content = file.read()
            
            await db.execute("""
                UPDATE users 
                SET profile_img = ?
                WHERE user_id = ?
            """, (file_content, user_id))
            
            await db.commit()
            return {"status": "success", "message": "Profile image updated successfully"}
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def update_user_password_in_db(user_id: str, data: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            
            if not current_password or not new_password:
                return {"status": "failure", "message": "Current password and new password are required"}
            
            # First, verify the current password
            async with db.execute("""
                SELECT password FROM users WHERE user_id = ?
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                
                if not row:
                    return {"status": "failure", "message": "User not found"}
                
                stored_password = row[0]
                
                # Verify current password with bcrypt
                if not bcrypt.checkpw(current_password.encode("utf-8"), stored_password.encode("utf-8")):
                    return {"status": "failure", "message": "Current password is incorrect"}
            
            # Hash the new password
            hashed_new_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            # Update the password
            await db.execute("""
                UPDATE users 
                SET password = ?
                WHERE user_id = ?
            """, (hashed_new_password, user_id))
            
            await db.commit()
            return {"status": "success", "message": "Password updated successfully"}
            
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def update_user_details_in_db(data: dict):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            user_id = data.get('user_id')
            reset_password = data.get('reset_password', False)
            sub_end_date = data.get('sub_end_date')
            device_id = data.get('device_id')
            
            # Generate new password if reset is requested
            new_password = None
            if reset_password:
                import os
                from dotenv import load_dotenv
                load_dotenv()
                new_password = os.getenv("NEW_USER_PASSWORD", "pubfitnessstudio")
                
                # Hash the password
                hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                
                # Update password
                await db.execute("""
                    UPDATE users 
                    SET password = ?
                    WHERE user_id = ?
                """, (hashed_password, user_id))
            
            # Update subscription end date
            if sub_end_date:
                await db.execute("""
                    UPDATE users 
                    SET sub_end_date = ?
                    WHERE user_id = ?
                """, (sub_end_date, user_id))
            
            # Update device ID
            if device_id is not None:
                await db.execute("""
                    UPDATE users 
                    SET device_id = ?
                    WHERE user_id = ?
                """, (device_id, user_id))
            
            await db.commit()
            
            return {
                "status": "success", 
                "message": "User details updated successfully",
                "temp_password": new_password if reset_password else None
            }
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def delete_user_from_db(user_id: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            # First, get user details for confirmation
            async with db.execute("""
                SELECT username, role FROM users WHERE user_id = ?
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                
                if not row:
                    return {"status": "failure", "message": "User not found"}
                
                username, role = row
                
                # Prevent deletion of admin users
                if role == 'admin':
                    return {"status": "failure", "message": "Cannot delete admin users"}
            
            # Delete nutrition data first (due to foreign key constraint)
            await db.execute("DELETE FROM nutrition_data WHERE user_id = ?", (user_id,))
            
            # Delete the user
            await db.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
            
            await db.commit()
            
            return {
                "status": "success", 
                "message": f"User '{username}' and all associated data deleted successfully"
            }
            
        except Exception as e:
            return {"status": "failure", "message": f"Database error: {str(e)}"}


async def get_user_by_id_from_db(user_id: str):
    async with aiosqlite.connect(DB_NAME) as db:
        try:
            async with db.execute("""
                SELECT user_id, username, phone_no, role, profile_img, gender, dob, height, weight,
                       calories_goal, proteins_goal, fats_goal, carbs_goal, sub_start_date, sub_end_date, device_id
                FROM users 
                WHERE user_id = ?
            """, (user_id,)) as cursor:
                row = await cursor.fetchone()
                
                if row:
                    profile_img = None
                    if row[4]:  # If profile_img exists
                        import base64
                        profile_img = base64.b64encode(row[4]).decode('utf-8')
                    
                    return {
                        "user_id": row[0],
                        "username": row[1],
                        "phone_no": row[2],
                        "role": row[3],
                        "profile_img": profile_img,
                        "gender": row[5],
                        "dob": row[6],
                        "height": row[7],
                        "weight": row[8],
                        "calories_goal": row[9] or 2000,
                        "proteins_goal": row[10] or 150,
                        "fats_goal": row[11] or 65,
                        "carbs_goal": row[12] or 250,
                        "sub_start_date": row[13],
                        "sub_end_date": row[14],
                        "device_id": row[15]
                    }
                else:
                    return None
        except Exception as e:
            return None


