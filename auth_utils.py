import os
import jwt
import datetime

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "supersecretkey")


def generate_token(user_id, username, role):
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # 1 hr expiry
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "Token expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}


# Example usage
if __name__ == "__main__":
    token = generate_token("U123", "satya", "admin")
    print("Generated Token:", token)

    decoded = decode_token(token)
    print("Decoded Payload:", decoded)
