# A simple backend server using Python Flask
# You will need to install the following packages:
# pip install Flask Flask-SQLAlchemy Flask-Mail Flask-Cors python-dotenv werkzeug
# Make sure you also have `os`, `time`, and `random` which are standard Python libraries.

# 1. Import necessary packages
import os
import time
import random
from datetime import datetime, timezone
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)


# --- Configuration ---
app.secret_key = os.getenv("SECRET_KEY", "a-fallback-secret-key-for-development")
CORS(app, origins=[os.getenv("FRONTEND_URL", "*")], supports_credentials=True)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "sqlite:///users.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
mail = Mail(app)

# --- In-memory OTP Store (For production, use Redis) ---
otp_store = {}
OTP_EXPIRATION_SECONDS = 300 # 5 minutes

# --- File Upload Configuration ---
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Database Models ---

# --- NEW: Association Table for Comment Likes ---
# This is a helper table for the many-to-many relationship between Users and Comments (for likes)
comment_likes = db.Table('comment_likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('comment_id', db.Integer, db.ForeignKey('comment.id'), primary_key=True)
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    verified = db.Column(db.Boolean, default=False)
    posts = db.relationship('Post', backref='author', lazy=True, cascade="all, delete-orphan")
    comments = db.relationship('Comment', backref='author', lazy=True, cascade="all, delete-orphan")
    # --- NEW: Relationship to track liked comments ---
    liked_comments = db.relationship('Comment', secondary=comment_likes, back_populates='likes')

# --- NEW: Lawyer Model for Registration ---
class Lawyer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    contact_number = db.Column(db.String(20), nullable=True)
    bar_enrollment_number = db.Column(db.String(150), unique=True, nullable=False)
    state_bar_council = db.Column(db.String(150), nullable=True)
    enrollment_year = db.Column(db.Integer, nullable=True)
    city_of_practice = db.Column(db.String(100), nullable=True)
    state_of_practice = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    # File paths for uploaded documents
    profile_picture_path = db.Column(db.String(255), nullable=True)
    bar_id_card_path = db.Column(db.String(255), nullable=False)
    enrollment_certificate_path = db.Column(db.String(255), nullable=True)
    govt_id_path = db.Column(db.String(255), nullable=True)
    # Status for admin approval: 'pending', 'approved', 'rejected'
    status = db.Column(db.String(20), default='pending', nullable=False)
    registration_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    location = db.Column(db.String(150), nullable=True)
    is_anonymous = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    comments = db.relationship('Comment', backref='post', lazy=True, cascade="all, delete-orphan")


# --- MODIFIED: Comment Model ---
class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    # --- NEW: For nested replies ---
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'), nullable=True)
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True, cascade="all, delete-orphan")
    # --- NEW: For likes ---
    likes = db.relationship('User', secondary=comment_likes, back_populates='liked_comments')


# Create DB tables if they don't exist
with app.app_context():
    db.create_all()

# --- Helper Functions ---
def send_otp_email(email, otp):
    """Sends an email with the OTP code."""
    try:
        msg = Message('Your Verification Code', sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f"Your one-time code is {otp}. It is valid for 5 minutes."
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {email}: {e}")
        return False

def is_otp_valid(email, otp_input):
    """Checks if the provided OTP is valid and not expired."""
    otp_data = otp_store.get(email)
    if not otp_data or time.time() - otp_data['timestamp'] > OTP_EXPIRATION_SECONDS:
        otp_store.pop(email, None)
        return False
    return otp_data['otp'] == otp_input

# --- Authentication Routes (Unchanged) ---
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name, email, password = data['name'], data['email'], data['password']
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered.'}), 409
        hashed_password = generate_password_hash(password)
        otp = str(random.randint(100000, 999999))
        otp_store[email] = {
            'name': name,
            'password': hashed_password,
            'otp': otp,
            'timestamp': time.time()
        }
        if send_otp_email(email, otp):
            return jsonify({'success': True, 'message': 'Registration successful. Please check your email for the OTP.'})
        else:
            otp_store.pop(email, None)
            return jsonify({'success': False, 'message': 'Could not send verification email.'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'Registration failed: {e}'}), 500

@app.route('/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.get_json()
        email, otp_input = data['email'], data['otp']
        if is_otp_valid(email, otp_input):
            user_data = otp_store.get(email)
            if not user_data:
                return jsonify({'success': False, 'message': 'Verification failed. Please register again.'}), 400
            new_user = User(
                name=user_data['name'],
                email=email,
                password=user_data['password'],
                verified=True
            )
            db.session.add(new_user)
            db.session.commit()
            otp_store.pop(email, None)
            return jsonify({'success': True, 'message': 'Email verified successfully. You can now log in.'})
        else:
            return jsonify({'success': False, 'message': 'Invalid or expired OTP.'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': f'Verification failed: {e}'}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email, password = data['email'], data['password']
        user = User.query.filter_by(email=email).first()
        if not user or not user.verified or not check_password_hash(user.password, password):
            return jsonify({'success': False, 'message': 'Invalid credentials or account not verified.'}), 401
        return jsonify({
            'success': True,
            'message': 'Login successful.',
            'user': {'id': user.id, 'name': user.name, 'email': user.email}
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Login failed: {e}'}), 500


# --- Lawyer Registration Routes (NEW) ---

# This route is new and is needed by the admin panel to fetch the list of lawyers.
@app.route('/lawyers', methods=['GET'])
def get_all_lawyers():
    try:
        lawyers = Lawyer.query.all()
        lawyers_list = []
        for lawyer in lawyers:
            lawyers_list.append({
                'id': lawyer.id,
                'full_name': lawyer.full_name,
                'email': lawyer.email,
                'contact_number': lawyer.contact_number,
                'bar_enrollment_number': lawyer.bar_enrollment_number,
                'state_bar_council': lawyer.state_bar_council,
                'enrollment_year': lawyer.enrollment_year,
                'city_of_practice': lawyer.city_of_practice,
                'state_of_practice': lawyer.state_of_practice,
                'bio': lawyer.bio,
                'profile_picture_path': lawyer.profile_picture_path,
                'bar_id_card_path': lawyer.bar_id_card_path,
                'enrollment_certificate_path': lawyer.enrollment_certificate_path,
                'govt_id_path': lawyer.govt_id_path,
                'status': lawyer.status,
                'registration_date': lawyer.registration_date.isoformat()
            })
        return jsonify({'success': True, 'lawyers': lawyers_list}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch lawyers: {e}'}), 500

# This route handles the POST request from your React Native app.
@app.route('/lawyers/register', methods=['POST'])
def register_lawyer():
    try:
        # Get text data from the form
        full_name = request.form.get('fullName')
        email = request.form.get('email')
        password = request.form.get('password') # Not storing password in this table, but you could
        contact_number = request.form.get('contactNumber')
        bar_enrollment_number = request.form.get('barEnrollmentNumber')
        state_bar_council = request.form.get('stateBarCouncil')
        enrollment_year = request.form.get('enrollmentYear')
        city_of_practice = request.form.get('cityOfPractice')
        state_of_practice = request.form.get('stateOfPractice')
        bio = request.form.get('bio')
        
        # Check if a lawyer with this email or bar enrollment number already exists
        if Lawyer.query.filter_by(email=email).first() or Lawyer.query.filter_by(bar_enrollment_number=bar_enrollment_number).first():
            return jsonify({
                'success': False,
                'message': 'A lawyer with this email or bar enrollment number already exists.'
            }), 409

        # Get file data from the form
        profile_picture = request.files.get('profilePicture')
        bar_id_card = request.files.get('barIdCard')
        enrollment_certificate = request.files.get('enrollmentCertificate')
        govt_id = request.files.get('govtId')
        
        file_paths = {}

        # Save uploaded files
        def save_file(file_obj, key_name):
            if file_obj:
                filename = secure_filename(file_obj.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file_obj.save(file_path)
                file_paths[key_name] = file_path
                return filename # Return the filename, not the full path
            return None

        profile_pic_path = save_file(profile_picture, 'profilePicture_path')
        bar_id_path = save_file(bar_id_card, 'barIdCard_path')
        enrollment_cert_path = save_file(enrollment_certificate, 'enrollmentCertificate_path')
        govt_id_path = save_file(govt_id, 'govtId_path')

        # Create a new Lawyer object and save to the database
        new_lawyer = Lawyer(
            full_name=full_name,
            email=email,
            contact_number=contact_number,
            bar_enrollment_number=bar_enrollment_number,
            state_bar_council=state_bar_council,
            enrollment_year=enrollment_year,
            city_of_practice=city_of_practice,
            state_of_practice=state_of_practice,
            bio=bio,
            profile_picture_path=profile_pic_path,
            bar_id_card_path=bar_id_path,
            enrollment_certificate_path=enrollment_cert_path,
            govt_id_path=govt_id_path,
            status='pending'
        )
        db.session.add(new_lawyer)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Registration data and files received successfully. Awaiting approval.'
        }), 200

    except Exception as e:
        db.session.rollback()
        print('Error during registration:', e)
        return jsonify({
            'success': False,
            'message': 'An internal server error occurred.'
        }), 500

# This route is for the administrator to approve or reject a lawyer's profile.
@app.route('/lawyers/<int:lawyer_id>/status', methods=['PATCH'])
def update_lawyer_status(lawyer_id):
    try:
        data = request.get_json()
        new_status = data.get('status')

        if new_status not in ['approved', 'rejected']:
            return jsonify({'success': False, 'message': 'Invalid status provided.'}), 400
        
        lawyer = Lawyer.query.get(lawyer_id)
        if not lawyer:
            return jsonify({'success': False, 'message': 'Lawyer not found.'}), 404
        
        lawyer.status = new_status
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Lawyer profile status updated to "{new_status}".',
            'lawyer_id': lawyer.id,
            'new_status': lawyer.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update lawyer status: {e}'}), 500


# --- New Route to serve uploaded files ---
@app.route('/uploads/<path:filename>')
def get_file(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({'success': False, 'message': 'File not found.'}), 404


# --- Post Routes (Mostly Unchanged) ---
@app.route('/posts', methods=['POST'])
def create_post():
    try:
        data = request.get_json()
        user_id, content = data.get('user_id'), data.get('content')
        if not user_id or not content:
            return jsonify({'success': False, 'message': 'User ID and content are required.'}), 400
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found.'}), 404
        new_post = Post(
            content=content,
            location=data.get('location'),
            is_anonymous=data.get('is_anonymous', False),
            user_id=user_id
        )
        db.session.add(new_post)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Post created successfully.'}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to create post: {e}'}), 500

@app.route('/posts', methods=['GET'])
def get_posts():
    try:
        posts = Post.query.order_by(Post.timestamp.desc()).all()
        result = []
        for post in posts:
            result.append({
                'id': post.id,
                'content': post.content,
                'timestamp': post.timestamp.isoformat(),
                'location': post.location,
                'is_anonymous': post.is_anonymous,
                'author': "Anonymous" if post.is_anonymous else post.author.name,
                'user_id': post.user_id,
                # --- NEW: Include comment count ---
                'comment_count': len(post.comments)
            })
        return jsonify({'success': True, 'posts': result})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch posts: {e}'}), 500

@app.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    try:
        post = Post.query.get(post_id)
        if not post:
            return jsonify({'success': False, 'message': 'Post not found.'}), 404
        # Optional: Add check to ensure only the author can delete
        # data = request.get_json()
        # if post.user_id != data.get('user_id'):
        #     return jsonify({'message': 'Permission denied.'}), 403
        db.session.delete(post)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Post deleted successfully.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Could not delete post: {e}'}), 500

# --- Comment Routes ---

# --- MODIFIED: Get Comments to handle nesting ---
def format_comment(comment, current_user_id):
    user_has_liked = any(user.id == current_user_id for user in comment.likes)
    return {
        'id': comment.id,
        'content': comment.content,
        'timestamp': comment.timestamp.isoformat(),
        'author': comment.author.name,
        'user_id': comment.user_id,
        'post_id': comment.post_id,
        'parent_id': comment.parent_id,
        'like_count': len(comment.likes),
        'user_has_liked': user_has_liked, # <-- The important new field
        'replies': [format_comment(reply, current_user_id) for reply in comment.replies]
    }

    # --- MODIFIED: Get Comments route ---
@app.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    try:
        # Get user_id from URL query parameters (e.g., ?user_id=123)
        current_user_id = request.args.get('user_id', type=int)
        if not current_user_id:
            return jsonify({'success': False, 'message': 'User ID is required.'}), 400

        top_level_comments = Comment.query.filter_by(post_id=post_id, parent_id=None).order_by(Comment.timestamp.asc()).all()
        
        # Pass the user ID to the formatter
        result = [format_comment(comment, current_user_id) for comment in top_level_comments]
        
        return jsonify({'success': True, 'comments': result})
    except Exception as e:
        print(f"❌ Error in /posts/<id>/comments (GET): {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch comments.'}), 500

# --- MODIFIED: Create Comment to handle replies ---
@app.route('/posts/<int:post_id>/comments', methods=['POST'])
def create_comment(post_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        content = data.get('content')
        parent_id = data.get('parent_id') # For replies

        if not user_id or not content:
            return jsonify({'success': False, 'message': 'User ID and content are required.'}), 400

        user = User.query.get(user_id)
        post = Post.query.get(post_id)
        if not user or not post:
            return jsonify({'success': False, 'message': 'User or Post not found.'}), 404

        new_comment = Comment(
            content=content,
            user_id=user_id,
            post_id=post_id,
            parent_id=parent_id # Will be None if it's a top-level comment
        )
        db.session.add(new_comment)
        db.session.commit()
        
        # Return the formatted comment, including its empty replies array
        return jsonify({
            'success': True, 
            'message': 'Comment created successfully.',
            'comment': format_comment(new_comment)
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to create comment: {e}'}), 500

# --- NEW: Delete Comment Route ---
@app.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id') # The ID of the user trying to delete

        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'success': False, 'message': 'Comment not found.'}), 404
        
        # Security check: only the author of the comment or the author of the post can delete it
        post_author_id = comment.post.user_id
        if comment.user_id != user_id and post_author_id != user_id:
            return jsonify({'success': False, 'message': 'Permission denied.'}), 403

        db.session.delete(comment)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Comment deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Could not delete comment: {e}'}), 500

# --- NEW: Like/Unlike Comment Route ---
@app.route('/comments/<int:comment_id>/like', methods=['POST'])
def toggle_like_comment(comment_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        user = User.query.get(user_id)
        comment = Comment.query.get(comment_id)
        if not user or not comment:
            return jsonify({'success': False, 'message': 'User or Comment not found.'}), 404

        message = ''
        if user in comment.likes:
            # User has already liked it, so unlike it
            comment.likes.remove(user)
            message = 'Comment unliked.'
        else:
            # User has not liked it, so like it
            comment.likes.append(user)
            message = 'Comment liked.'
        
        db.session.commit()

        return jsonify({
            'success': True,
            'message': message,
            'like_count': len(comment.likes)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update like status: {e}'}), 500

    
# --- Run App ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)

