# Pub Fitness Studio Web Application

A Flask-based web application for managing fitness studio memberships with role-based access control.

## Features

- **User Authentication**: JWT-based login system
- **Role-Based Access**: Admin and User roles with different permissions
- **Admin Dashboard**: Register new users, view statistics, manage studio
- **User Dashboard**: Personalized fitness dashboard with navigation
- **Secure Registration**: Only admins can register new users
- **Modern UI**: Built with Tailwind CSS and Feather Icons

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   FLASK_SECRET_KEY=your_secret_key_here
   AUTH_SECRET_KEY=your_auth_secret_key_here
   DB_NAME=pubfitnessstudio.db
   NEW_USER_PASSWORD=secret_password
   ```

3. **Run the Application**:
   ```bash
   python main.py
   ```

4. **Access the Application**:
   - Open your browser and go to `http://localhost:5000`
   - You'll be redirected to the login page
