import os
import datetime
import random
import uuid

from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from sqlalchemy.exc import IntegrityError

from api.utils import APIException, generate_sitemap
from api.models import db, User, Project, Task, Comment, RestorePassword

from api.routes import api  # Only /api/hello or similar test endpoints here!
from api.admin import setup_admin
from api.commands import setup_commands
from flask_cors import CORS

from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message

# Environment setup
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.dirname(os.path.realpath(__file__))

# Initialize Flask app
app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app)

# Database config
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///dev.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key")  

# Mail configuration
app.config.update(dict(
    DEBUG=False,
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USE_SSL=False,
    MAIL_USERNAME=os.getenv('MAIL_DEFAULT_SENDER'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
))


# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db, compare_type=True)
jwt = JWTManager(app)
mail = Mail(app)
setup_admin(app)
setup_commands(app)
# ONLY /api/hello, no main endpoints here
app.register_blueprint(api, url_prefix='/api')
CORS(app)

# Error handler


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Development sitemap route


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# Serve static files (SPA fallback)


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response

# --- REGISTER endpoint (with password hashing)


@app.route('/register', methods=['POST'])
def register():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'full_name' not in body or body['full_name'].strip() == '':
        return jsonify({'msg': 'Debes enviar un nombre válido'}), 400
    if 'email' not in body or body['email'].strip() == '':
        return jsonify({'msg': 'Debes enviar un email válido'}), 400
    if 'password' not in body or body['password'].strip() == '':
        return jsonify({'msg': 'Debes enviar un password válido'}), 400
    if 'country' not in body or body['country'].strip() == '':
        return jsonify({'msg': 'Debes enviar un country válido'}), 400

    phone = body.get('phone')
    profile_picture_url = body.get('profile_picture_url')
    random_profile_color = random.randint(0, 9)
    hashed_password = generate_password_hash(body['password'])

    new_user = User(
        full_name=body['full_name'],
        email=body['email'],
        password=hashed_password,
        phone=phone,
        country=body['country'],
        created_at=datetime.datetime.now(),
        profile_picture_url=profile_picture_url,
        random_profile_color=random_profile_color,
        is_active=True
    )
    db.session.add(new_user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Ingresa un email distinto.'}), 400
    
    # Send welcome email
    path = os.path.join(static_file_dir, 'api', 'HTML mails', 'Welcome.html')
    with open(path, 'r') as f:
        html_content = f.read()
    msg = Message(
        subject="Hello, welcome to EchoBoard!",
        recipients=[new_user.email],
    )
    msg.html = html_content
    mail.send(msg)

    return jsonify({'msg': 'ok', 'new_user': new_user.serialize()}), 201

# --- LOGIN endpoint (JWT + hash check)


@app.route('/login', methods=['POST'])
def login():
    body = request.get_json()
    if not body or 'email' not in body or 'password' not in body:
        return jsonify({'msg': 'Email y contraseña requeridos'}), 400

    user = User.query.filter_by(email=body['email']).first()
    if not user or not check_password_hash(user.password, body['password']):
        return jsonify({'msg': 'Credenciales inválidas'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": token,
        "user": user.serialize()
    }), 200



# --- CREATE PROJECT endpoint (protected)
@app.route('/project', methods=['POST'])
@jwt_required()
def new_project():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'title' not in body or body['title'].strip() == '':
        return jsonify({'msg': 'Debes enviar un título válido'}), 400
    if 'due_date' not in body or body['due_date'].strip() == '':
        return jsonify({'msg': 'Debes enviar una fecha de entrega válida'}), 400

    description = body.get('description')
    project_picture_url = body.get('project_picture_url')

    description = body.get('description')
    project_picture_url = body.get('project_picture_url')
    status = body.get('status', 'in progress')
    new_project = Project(
        title=body['title'],
        description=description,
        created_at=datetime.datetime.now(),
        project_picture_url=project_picture_url,
        due_date=datetime.datetime.strptime(body['due_date'], '%Y-%m-%d'),
        admin=user,
        status=status
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify({'msg': 'ok', 'new_project': new_project.serialize()}), 201


# --- GET PROJECTS endpoint (protected)
@app.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    admin_of = [project.serialize() for project in user.admin_of]
    member_of = [project.project.serialize() for project in user.member_of]

    if not admin_of and not member_of:
        return jsonify({'msg': 'No projects found for this user', 'user_projects': []}), 200

    return jsonify({
        'msg': 'Projects retrieved successfully',
        'user_projects': {
            'admin': admin_of,
            'member': member_of
        },
    }), 200


# --- Mail sending example


@app.route('/send-mail', methods=['GET'])
def send_mail():
    path = os.path.join(static_file_dir, 'api', 'HTML mails', 'RestorePassword.html')#testpath
    with open(path, 'r') as f:
        html_content = f.read()
    msg = Message(
        subject="Hello",
        recipients=["echoboard.4geeks@gmail.com"],
    )
    msg.html = html_content
    mail.send(msg)
    return jsonify({'msg': 'Email sent'}), 200


# --- Protected endpoint JWT token check
@app.route('/jwtcheck', methods=['GET'])
@jwt_required()
def verification_token():
    # jwt_data = get_jwt()
    # exp_timestamp = jwt_data['exp']
    # now = datetime.datetime.now().timestamp()
    # # Check if the token is about to expire in the next 60 seconds
    # if exp_timestamp - now < 60:
    #     user_id = get_jwt_identity()
    #     new_token = create_access_token(identity=user_id)
    #     return jsonify({'msg': 'Token is about to expire', 'new_token': new_token}), 200
    return jsonify({'msg': 'Token is valid'}), 200

# --- Restore password endpoint
@app.route('/restore-password', methods=['POST'])
def restore_password():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'email' not in body or body['email'].strip() == '':
        return jsonify({'msg': 'Debes enviar un email válido'}), 400

    user = User.query.filter_by(email=body['email']).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    # Generate a password reset token and send it via email
    token = str(uuid.uuid4())
    expires_at = datetime.datetime.now() + datetime.timedelta(hours=2)
    restore_password = RestorePassword(
        user_mail=user.email,
        uuid=token,
        expires_at=expires_at
    )
    db.session.add(restore_password)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'msg': 'Error creating password reset request'}), 500
    # create link to restore password
    restore_link = f"{os.getenv('FRONTEND_URL')}/restore-password/{token}"
    # Send password reset email

    path = os.path.join(static_file_dir, 'api', 'HTML mails', 'RestorePassword.html')
    with open(path, 'r') as f:
        html_content = f.read()
    html_content = html_content.replace('{{restore_link}}', restore_link)
    msg = Message(
        subject="Password Reset Request",
        recipients=[user.email],
    )
    msg.html = html_content
    mail.send(msg)

    return jsonify({'msg': 'Password reset email sent'}), 200

# --- restore password confirmation endpoint
@app.route('/restore-password/<token>', methods=['POST'])
def restore_password_confirmation(token):
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'new_password' not in body or body['new_password'].strip() == '':
        return jsonify({'msg': 'Debes enviar una nueva contraseña válida'}), 400

    restore_request = RestorePassword.query.filter_by(uuid=token).first()
    if not restore_request:
        return jsonify({'msg': 'Invalid or expired token'}), 404

    if restore_request.expires_at < datetime.datetime.now():
        return jsonify({'msg': 'Token has expired'}), 400

    user = User.query.filter_by(email=restore_request.user_mail).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    user.password = generate_password_hash(body['new_password'])
    db.session.commit()

    # Delete the restore password request
    db.session.delete(restore_request)
    db.session.commit()

    return jsonify({'msg': 'Password updated successfully'}), 200

# --- Run app ---
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
