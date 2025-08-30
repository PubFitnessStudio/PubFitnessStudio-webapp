from dotenv import load_dotenv
load_dotenv()

from db_utils import create_tables, login, register, contact_admin, get_pending_registrations, approve_registration, reject_registration, get_dashboard_statistics, get_all_users, get_user_goals_from_db, get_nutrition_data_from_db, save_nutrition_data_to_db, get_user_profile_from_db, update_user_profile_to_db, update_user_goals_to_db, update_profile_image_to_db, update_user_details_in_db, update_user_password_in_db
from auth_utils import generate_token, decode_token

from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from functools import wraps

import os
import asyncio

create_tables()

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY", "supersecretkey")

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pubfitnessstudio.db')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        payload = decode_token(token)
        
        if 'error' in payload:
            return jsonify({"error": "Invalid token"}), 401
        
        if payload.get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
def home():
    return redirect(url_for("login_page"))

@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "GET":
        return render_template("login.html")
    return "Method not allowed", 405

@app.route("/register", methods=["GET", "POST"])
def register_page():
    if request.method == "GET":
        return render_template("register.html")
    return "Method not allowed", 405

@app.route("/contact-admin", methods=["GET", "POST"])
def contact_admin_page():
    if request.method == "GET":
        return render_template("contact_admin.html")
    return "Method not allowed", 405

@app.route("/api/register", methods=["POST"])
@admin_required
def register_route():
    data = request.get_json()
    result = asyncio.run(register(data))
    return jsonify(result)

@app.route("/api/login", methods=["POST"])
def login_route():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    result = asyncio.run(login(username, password))
    if result["status"] == "success":
        jwt_token = generate_token(result["user_id"], result["username"], result["role"])
        result["token"] = jwt_token
    return jsonify(result)

@app.route("/api/contact-admin", methods=["POST"])
def contact_admin_route():
    data = request.get_json()
    result = asyncio.run(contact_admin(data))
    return jsonify(result)

@app.route("/api/pending-requests", methods=["GET"])
@admin_required
def get_pending_requests():
    result = asyncio.run(get_pending_registrations())
    return jsonify(result)

@app.route("/api/approve-request/<registration_id>", methods=["POST"])
@admin_required
def approve_registration_request(registration_id):
    result = asyncio.run(approve_registration(registration_id))
    return jsonify(result)

@app.route("/api/reject-request/<registration_id>", methods=["POST"])
@admin_required
def reject_registration_request(registration_id):
    data = request.get_json()
    reason = data.get("reason", "No reason provided")
    result = asyncio.run(reject_registration(registration_id, reason))
    return jsonify(result)

@app.route("/api/dashboard-stats", methods=["GET"])
@admin_required
def get_dashboard_stats():
    result = asyncio.run(get_dashboard_statistics())
    return jsonify(result)

@app.route("/api/users", methods=["GET"])
@admin_required
def get_users():
    result = asyncio.run(get_all_users())
    # print(result)
    return jsonify(result)

@app.route("/user")
def user_dashboard():
    return render_template("user_base.html")

@app.route("/admin")
def admin_dashboard():
    return render_template("admin_dashboard.html")

@app.route("/home")
def home_page():
    return render_template("home_page.html")

@app.route("/profile")
def profile_page():
    return render_template("profile_page.html")

@app.route("/calculator")
def calculator_page():
    return render_template("calculator_page.html")

@app.route("/update-user-details")
def update_user_details():
    return render_template("update_user_details.html")

@app.route("/logout")
def logout():
    return redirect(url_for("login"))

# API routes for user functionality
@app.route('/api/user-goals', methods=['GET'])
def get_user_goals():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        goals = asyncio.run(get_user_goals_from_db(user_id))
        return jsonify(goals)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/nutrition-data/<date>', methods=['GET'])
def get_nutrition_data(date):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        nutrition_data = asyncio.run(get_nutrition_data_from_db(user_id, date))
        return jsonify(nutrition_data)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/nutrition-data', methods=['POST'])
def save_nutrition_data():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        data = request.get_json()
        result = asyncio.run(save_nutrition_data_to_db(user_id, data))
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/user-profile', methods=['GET'])
def get_user_profile():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        profile = asyncio.run(get_user_profile_from_db(user_id))
        return jsonify(profile)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/update-profile', methods=['PUT'])
def update_user_profile():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        data = request.get_json()
        result = asyncio.run(update_user_profile_to_db(user_id, data))
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/update-goals', methods=['PUT'])
def update_user_goals():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        data = request.get_json()
        result = asyncio.run(update_user_goals_to_db(user_id, data))
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/update-profile-image', methods=['POST'])
def update_profile_image():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        if 'profile_image' not in request.files:
            return jsonify({"status": "failure", "message": "No image file provided"}), 400
        
        file = request.files['profile_image']
        if file.filename == '':
            return jsonify({"status": "failure", "message": "No image file selected"}), 400
        
        result = asyncio.run(update_profile_image_to_db(user_id, file))
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/update-password', methods=['PUT'])
def update_user_password():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        user_id = payload['user_id']
        
        data = request.get_json()
        result = asyncio.run(update_user_password_in_db(user_id, data))
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "failure", "message": str(e)}), 500

@app.route('/api/update-user-details', methods=['POST'])
def update_user_details_api():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"status": "failure", "message": "No token provided"}), 401
    
    try:
        payload = decode_token(token)
        admin_id = payload['user_id']
        
        data = request.get_json()
        result = asyncio.run(update_user_details_in_db(data))
        return jsonify(result)
    except Exception as e:
        print(e)
        return jsonify({"status": "failure", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)