import os
import datetime
import random
import uuid

from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from sqlalchemy.exc import IntegrityError

from api.utils import APIException, generate_sitemap
from api.models import db, User, Project, Task, Comment, RestorePassword, ProjectStatus, Project_Member, TaskStatus

from api.admin import setup_admin
from api.commands import setup_commands

from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
from flask_cors import CORS

# ENVIRONMENT
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.dirname(os.path.realpath(__file__))

# CONSTANTS
TASK_STATUS_MAPPING = {
    'in progress': TaskStatus.in_progress,
    'delegated': TaskStatus.delegated,
    'urgent': TaskStatus.urgent,
    'done': TaskStatus.done
}

PROJECT_STATUS_MAPPING = {
    'in progress': ProjectStatus.in_progress,
    'yet to start': ProjectStatus.yet_to_start,
    'done': ProjectStatus.done,
    'dismissed': ProjectStatus.dismissed
}

app = Flask(__name__)
app.url_map.strict_slashes = False


# Añadir todas las URLs de frontend necesarias para CORS
CORS(
    app,
    resources={r"/*": {"origins": [os.getenv("FRONTEND_URL", "http://localhost:3000"),
                                   ]}},
    supports_credentials=True
)
# =================================================

# DATABASE CONFIG
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///dev.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT CONFIG
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key")

# MAIL CONFIG
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USE_SSL=False,
    MAIL_USERNAME=os.getenv('MAIL_DEFAULT_SENDER'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    DEBUG=False
)

# INIT EXTENSIONS
db.init_app(app)
migrate = Migrate(app, db, compare_type=True)
jwt = JWTManager(app)
mail = Mail(app)
setup_admin(app)
setup_commands(app)

# ERROR HANDLER


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# SITEMAP (DEV ONLY)


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# SPA FALLBACK


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response

# ==== API ENDPOINTS BELOW ====

# ========== AUTH & USER ENDPOINTS ==========


@app.route('/register', methods=['POST'])
def register():
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if not body.get('full_name', '').strip():
        return jsonify({'msg': 'Debes enviar un nombre válido'}), 400
    if not body.get('email', '').strip():
        return jsonify({'msg': 'Debes enviar un email válido'}), 400
    if not body.get('password', '').strip():
        return jsonify({'msg': 'Debes enviar un password válido'}), 400
    if not body.get('country', '').strip():
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
    if os.path.exists(path):
        with open(path, 'r') as f:
            html_content = f.read()
        msg = Message(
            subject="Hello, welcome to EchoBoard!",
            recipients=[new_user.email],
        )
        msg.html = html_content
        mail.send(msg)

    return jsonify({'msg': 'ok', 'new_user': new_user.serialize()}), 201


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


@app.route('/jwtcheck', methods=['GET'])
@jwt_required()
def verification_token():
    return jsonify({'msg': 'Token is valid'}), 200


@app.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    email = request.args.get('email')
    if not email or not email.strip():
        return jsonify({'msg': 'Email parameter is required'}), 400

    user = User.query.filter_by(email=email.strip()).first()

    if user:
        return jsonify({
            'found': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            }
        }), 200
    else:
        return jsonify({'found': False}), 404

# ========== USER PROFILE ENDPOINTS ADDED HERE ==========


@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({'user': user.serialize()}), 200


@app.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'msg': 'Missing body'}), 400

    # Editable fields
    if 'full_name' in body:
        user.full_name = body['full_name']
    if 'country' in body:
        user.country = body['country']
    if 'phone' in body:
        user.phone = body['phone']
    if 'profile_picture_url' in body:
        user.profile_picture_url = body['profile_picture_url']
    try:
        db.session.commit()
        return jsonify({'msg': 'Profile updated', 'user': user.serialize()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Failed to update profile'}), 500
# ========== END PROFILE ENDPOINTS ==========


@app.route('/restore-password', methods=['POST'])
def restore_password():
    body = request.get_json(silent=True)
    if body is None or not body.get('email', '').strip():
        return jsonify({'msg': 'Debes enviar un email válido'}), 400

    user = User.query.filter_by(email=body['email']).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

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

    # Create password reset link
    frontend_url = os.getenv('FRONTEND_URL') or "http://localhost:3000"
    restore_link = f"{frontend_url}/restore-password/{token}"

    # Send password reset email
    path = os.path.join(static_file_dir, 'api',
                        'HTML mails', 'RestorePassword.html')
    if os.path.exists(path):
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


@app.route('/restore-password/<token>', methods=['POST'])
def restore_password_confirmation(token):

    restore_request = RestorePassword.query.filter_by(uuid=token).first()
    if not restore_request or restore_request.expires_at < datetime.datetime.now():
        return jsonify({'msg': 'Invalid or expired token'}), 404

    body = request.get_json(silent=True)
    if body is None or not body.get('new_password', '').strip():
        return jsonify({'msg': 'Debes enviar una nueva contraseña válida'}), 400

    user = User.query.filter_by(email=restore_request.user_mail).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    user.password = generate_password_hash(body['new_password'])
    db.session.commit()

    # Delete the restore password request
    db.session.delete(restore_request)
    db.session.commit()

    return jsonify({'msg': 'Password updated successfully'}), 200

# ========== PROJECT ENDPOINTS ==========


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
    if not body.get('title', '').strip():
        return jsonify({'msg': 'Debes enviar un título válido'}), 400
    if not body.get('due_date', '').strip():
        return jsonify({'msg': 'Debes enviar una fecha de entrega válida'}), 400

    description = body.get('description')
    project_picture_url = body.get('project_picture_url')
    status = body.get('status', 'in progress')
    due_date = body['due_date']
    if "T" in due_date:
        due_date = due_date.split("T")[0]

    # Validar el status
    status_enum = PROJECT_STATUS_MAPPING.get(status, ProjectStatus.in_progress)

    new_project = Project(
        title=body['title'],
        description=description,
        created_at=datetime.datetime.now(),
        project_picture_url=project_picture_url,
        due_date=datetime.datetime.strptime(due_date, '%Y-%m-%d'),
        admin=user,
        status=status_enum
    )
    db.session.add(new_project)
    db.session.flush()

    member_emails = body.get('members', [])
    added_members = []
    member_errors = []

    if member_emails and isinstance(member_emails, list):
        for email in member_emails:
            if not email or not email.strip():
                continue

            member_user = User.query.filter_by(email=email.strip()).first()
            if not member_user:
                member_errors.append(f"User with email {email} not found")
                continue

            if member_user.id == user.id:
                member_errors.append(f"Cannot add admin as member")
                continue

            new_member = Project_Member(
                project_id=new_project.id,
                member_id=member_user.id
            )
            db.session.add(new_member)
            added_members.append({
                'email': member_user.email,
                'full_name': member_user.full_name
            })

    try:
        db.session.commit()
        response_data = {
            'msg': 'Project created successfully',
            'new_project': new_project.serialize()
        }

        # Agregar información de miembros si se procesaron
        if member_emails:
            response_data['members_info'] = {
                'added_members': added_members,
                'errors': member_errors
            }

        return jsonify(response_data), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Error creating project'}), 500


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


@app.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404

    project_members = Project_Member.query.filter_by(
        project_id=project_id).all()

    if user.id is not project.admin_id and user.id not in [member.member_id for member in project_members]:
        return jsonify({'msg': 'You are not authorized to view this project'}), 403

    return jsonify({
        'msg': 'Project retrieved successfully',
        'project': project.serialize()
    }), 200

@app.route('/project/<int:project_id>', methods=['PUT'])
@jwt_required()
def edit_project(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404

    if project.admin_id != user.id:
        return jsonify({'msg': 'Only the project admin can edit this project'}), 403

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'title' in body and body['title'].strip():
        project.title = body['title']
    if 'description' in body:
        project.description = body['description']

    if 'due_date' in body and body['due_date'].strip():
        due_date = body['due_date']
        if "T" in due_date:
            due_date = due_date.split("T")[0]
        project.due_date = datetime.datetime.strptime(due_date, '%Y-%m-%d')
    if 'project_picture_url' in body:
        project.project_picture_url = body['project_picture_url']
    if 'status' in body:
        # Mapear los valores string a los enum values
        status_value = body['status']
        if status_value == "in progress":
            project.status = ProjectStatus.in_progress
        elif status_value == "yet to start":
            project.status = ProjectStatus.yet_to_start
        elif status_value == "done":
            project.status = ProjectStatus.done
        elif status_value == "dismissed":
            project.status = ProjectStatus.dismissed

    try:
        db.session.commit()
        return jsonify({'msg': 'Project updated successfully', 'project': project.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Error updating project'}), 500

@app.route('/project/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_project_members(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404

    if project.admin_id != user.id:
        return jsonify({'msg': 'Only the project admin can add members'}), 403

    body = request.get_json(silent=True)
    if body is None or 'members' not in body:
        return jsonify({'msg': 'Must provide members list'}), 400

    member_emails = body['members']
    if not isinstance(member_emails, list):
        return jsonify({'msg': 'Members must be a list of emails'}), 400

    added_members = []
    errors = []

    for email in member_emails:
        if not email or not email.strip():
            continue

        member_user = User.query.filter_by(email=email.strip()).first()
        if not member_user:
            errors.append(f"User with email {email} not found")
            continue
        existing_member = Project_Member.query.filter_by(
            project_id=project_id,
            member_id=member_user.id
        ).first()

        if existing_member:
            errors.append(f"User {email} is already a member")
            continue
        if member_user.id == user.id:
            errors.append(f"Cannot add admin as member")
            continue
        new_member = Project_Member(
            project_id=project_id,
            member_id=member_user.id
        )
        db.session.add(new_member)
        added_members.append({
            'id': member_user.id,
            'email': member_user.email,
            'full_name': member_user.full_name
        })
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({'msg': 'Error adding members'}), 500
        return jsonify({
            'msg': 'Members processed successfully',
            'added_members': added_members,
            'errors': errors
        }), 200


# ---- RUN APP ----
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
