import os
import datetime
import random
import uuid

from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from sqlalchemy.exc import IntegrityError

from api.utils import APIException, generate_sitemap
from api.models import db, User, Project, Task, RestorePassword, ProjectStatus, Project_Member, TaskStatus

from api.admin import setup_admin
from api.commands import setup_commands

from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Mail, Message
from flask_cors import CORS

# ENVIRONMENT
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')

template_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'api/templates/emails')


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

# ====== CORS: HARDCODE YOUR FRONTEND URLS! ======
CORS(app)
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
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=3)

# MAIL CONFIG
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USE_SSL=False,
    MAIL_USERNAME=os.getenv('MAIL_DEFAULT_SENDER'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    DEBUG=True
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


@app.route('/api/register', methods=['POST'])
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
    path = os.path.join(template_dir, 'Welcome.html')
    if os.path.exists(path):
        with open(path, 'r') as f:
            html_content = f.read()
        msg = Message(
            subject="Hello, welcome to EchoBoard!",
            recipients=[new_user.email],
        )
        msg.html = html_content
        try:
            mail.send(msg)
        except Exception as e:
            return jsonify({'msg': f'Mail error: {str(e)}'}), 500

    return jsonify({'msg': 'ok', 'new_user': new_user.serialize()}), 201


@app.route('/api/login', methods=['POST'])
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


@app.route('/api/jwtcheck', methods=['GET'])
@jwt_required()
def verification_token():
    return jsonify({'msg': 'Token is valid'}), 200

@app.route('/api/test-mail/<string:email>', methods=['GET'])
def test_mail(email):
    path = os.path.join(template_dir, 'Test.html')
    
    if os.path.exists(path):
        with open(path, 'r') as file:
            html_content = file.read()
        msg = Message(
            subject="Test mail",
            recipients=[email],
        )
        msg.html = html_content
        
    try:
        mail.send(msg)
        return jsonify({'msg': 'Test email sent!'}), 200
    except Exception as e:
        return jsonify({'msg': f'Mail error: {str(e)}'}), 500

@app.route('/api/restore-password', methods=['POST'])
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
    path = os.path.join(template_dir, 'RestorePassword.html')
    if os.path.exists(path):
        with open(path, 'r') as f:
            html_content = f.read()
        html_content = html_content.replace('{{restore_link}}', restore_link)
        msg = Message(
            subject="Password Reset Request",
            recipients=[user.email],
        )
        msg.html = html_content
        try:
            mail.send(msg)
        except Exception as e:
            return jsonify({'msg': f'Mail error: {str(e)}'}), 500

    return jsonify({'msg': 'Password reset email sent'}), 200


@app.route('/api/restore-password/<token>', methods=['POST'])
def restore_password_confirmation(token):
    body = request.get_json(silent=True)
    if body is None or not body.get('new_password', '').strip():
        return jsonify({'msg': 'Debes enviar una nueva contraseña válida'}), 400

    restore_request = RestorePassword.query.filter_by(uuid=token).first()
    if not restore_request or restore_request.expires_at < datetime.datetime.now():
        return jsonify({'msg': 'Invalid or expired token'}), 404

    user = User.query.filter_by(email=restore_request.user_mail).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    user.password = generate_password_hash(body['new_password'])
    db.session.commit()

    # Delete the restore password request
    db.session.delete(restore_request)
    db.session.commit()

    return jsonify({'msg': 'Password updated successfully'}), 200


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({'user': user.serialize()}), 200

@app.route('/api/profile/<int:user_id>', methods=['GET'])
@jwt_required()
def get_profile_by(user_id):    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({'user': user.serialize()}), 200


@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    body = request.get_json(silent=True)
    if not body:
        return jsonify({'msg': 'Missing body'}), 400

    if 'full_name' in body:
        user.full_name = body['full_name']
    if 'country' in body:
        user.country = body['country']
    if 'phone' in body:
        try:
            user.phone = int(body['phone']) if body['phone'] not in [
                None, ""] else None
        except Exception:
            return jsonify({'msg': 'Phone number must be numeric'}), 400
    if 'profile_picture_url' in body:
        user.profile_picture_url = body['profile_picture_url']
    try:
        db.session.commit()
        return jsonify({'msg': 'Profile updated', 'user': user.serialize()}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Failed to update profile'}), 500

#  ALIAS for PUT /user and GET /user


@app.route('/api/user', methods=['GET', 'PUT'])
@jwt_required()
def user_alias():
    if request.method == 'GET':
        # Si hay un parámetro email, buscar usuario por email
        email = request.args.get('email')
        if email:
            if not email.strip():
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
        else:
            # Si no hay parámetro email, devolver perfil del usuario autenticado
            return get_profile()
    elif request.method == 'PUT':
        return update_profile()


@app.route('/api/user', methods=['DELETE'])
@jwt_required()
def delete_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    # Optional: delete all user-related objects
    # Remove user from all projects
    
    # Remove all projects where user is admin (optional, or force them to transfer)
    # Project.query.filter_by(admin_id=user_id).delete()
    # Remove user's tasks, comments, etc, as needed

    db.session.delete(user)
    try:
        db.session.commit()
        return jsonify({'msg': 'User deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Error deleting user'}), 500


# ========== PROJECT ENDPOINTS ==========

@app.route('/api/project', methods=['POST'])
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


@app.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    admin_of = [project.serialize() for project in user.admin_of]
    member_of = [project.project.serialize() for project in user.member_of]

    return jsonify({
        'msg': 'Projects retrieved successfully',
        'user_projects': {
            'admin': admin_of,
            'member': member_of
        }
    }), 200

@app.route('/api/projects/<int:user_id>', methods=['GET'])
@jwt_required()
def get_projects_by(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    admin_of = [project.serialize() for project in user.admin_of]
    member_of = [project.project.serialize() for project in user.member_of]

    return jsonify({
        'msg': 'Projects retrieved successfully',
        'user_projects': {
            'admin': admin_of,
            'member': member_of
        }
    }), 200


@app.route('/api/project/<int:project_id>', methods=['GET'])
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
        # If the user is not an admin or a member of the project, return an error
        return jsonify({'msg': 'You are not authorized to view this project'}), 403

    return jsonify({
        'msg': 'Project retrieved successfully',
        'project': project.serialize()
    }), 200


@app.route('/api/project/<int:project_id>', methods=['PUT'])
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
        # Usar el mapping global para validar y asignar el status
        if body['status'] in PROJECT_STATUS_MAPPING:
            project.status = PROJECT_STATUS_MAPPING[body['status']]

    try:
        db.session.commit()
        return jsonify({'msg': 'Project updated successfully', 'project': project.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Error updating project'}), 500


@app.route('/api/project/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404
    if project.admin_id != user.id:
        return jsonify({'msg': 'Only the project admin can delete this project'}), 403

    # Delete all members, tasks, and comments (if you have foreign key constraints)
    Project_Member.query.filter_by(project_id=project_id).delete()
    Task.query.filter_by(project_id=project_id).delete()
    # If you want: Comment.query.filter_by(project_id=project_id).delete()

    db.session.delete(project)
    try:
        db.session.commit()
        return jsonify({'msg': 'Project deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Error deleting project'}), 500


# ========== PROJECT MEMBERS ENDPOINTS ==========


@app.route('/api/project/<int:project_id>/members', methods=['POST'])
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

    for email in member_emails:
        if not email or not email.strip():
            continue
        member_user = User.query.filter_by(email=email.strip()).first()
        if not member_user:
            return jsonify({'msg': f'User with email {email} not found'}), 400
        existing_member = Project_Member.query.filter_by(
            project_id=project_id,
            member_id=member_user.id
        ).first()

        if existing_member:
            return jsonify({'msg': f'User {email} is already a member'}), 400
        if member_user.id == user.id:
            return jsonify({'msg': 'Cannot add admin as member'}), 400
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
        return jsonify({
            'msg': 'Members added successfully',
            'added_members': added_members
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Error adding members'}), 500


@app.route('/api/project/<int:project_id>/member/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_project_member(project_id, member_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404
    if project.admin_id != user.id:
        return jsonify({'msg': 'Only the project admin can remove members'}), 403

    # Cannot remove admin as member (should not exist, but for safety)
    if member_id == user.id:
        return jsonify({'msg': 'Admin cannot be removed from members'}), 400

    member = Project_Member.query.filter_by(
        project_id=project_id, member_id=member_id).first()
    if not member:
        return jsonify({'msg': 'Member not found in project'}), 404

    db.session.delete(member)
    try:
        db.session.commit()
        return jsonify({'msg': 'Member removed from project successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Error removing member'}), 500


# ========== TASK ENDPOINTS ==========


@app.route('/api/project/<int:project_id>/tasks', methods=['GET'])
@jwt_required()
def get_project_tasks(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404

    project_members = Project_Member.query.filter_by(
        project_id=project_id).all()
    is_admin = (user.id == project.admin_id)
    is_member = user.id in [member.member_id for member in project_members]

    if not is_admin and not is_member:
        return jsonify({'msg': 'You are not authorized to view tasks from this project'}), 400

    if is_admin:
        all_tasks = Task.query.filter_by(project_id=project_id).all()
        tasks_data_serialize = [task.serialize() for task in all_tasks]

        return jsonify({
            'msg': 'All project tasks retrieved successfully',
            'role': 'admin',
            'tasks': tasks_data_serialize,
            'total_tasks': len(tasks_data_serialize)
        }), 200

    else:
        member_tasks = Task.query.filter_by(project_id=project_id).filter(
            (Task.assigned_to_id == user.id) | (Task.author_id == user.id)
        ).all()

        tasks_data = [task.serialize_for_member(
            user.id) for task in member_tasks]

        return jsonify({
            'msg': 'Your tasks retrieved successfully',
            'role': 'member',
            'tasks': tasks_data,
            'total_tasks': len(tasks_data)
        }), 200


@app.route('/api/project/<int:project_id>/task', methods=['POST'])
@jwt_required()
def create_task(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404

    project_members = Project_Member.query.filter_by(
        project_id=project_id).all()
    is_admin = (user.id == project.admin_id)
    is_member = user.id in [member.member_id for member in project_members]

    if not is_admin and not is_member:
        return jsonify({'msg': 'You are not authorized to create tasks in this project'}), 400

    body = request.get_json(silent=True)

    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if not body.get('title', '').strip():
        return jsonify({'msg': 'Debes enviar un título válido'}), 400

    assigned_to_id = body.get('assigned_to_id')

    if assigned_to_id:
        assigned_user = User.query.get(assigned_to_id)
        if not assigned_user:
            return jsonify({'msg': 'Assigned user not found'}), 404

        valid_assignee = (assigned_user.id == project.admin_id or
                          assigned_user.id in [member.member_id for member in project_members])
        if not valid_assignee:
            return jsonify({'msg': 'Cannot assign task to user who is not part of the project'}), 400
        if is_member and assigned_user.id != user.id:
            return jsonify({'msg': 'You can only assign tasks to yourself'}), 400
    else:
        assigned_to_id = None

    status_value = body.get('status', 'in progress')

    if status_value not in TASK_STATUS_MAPPING:
        return jsonify({'msg': 'Invalid task status'}), 400

    try:
        new_task = Task(
            title=body['title'],
            description=body.get('description'),
            created_at=datetime.datetime.now(),
            status=TASK_STATUS_MAPPING[status_value],
            author_id=user.id,
            project_id=project_id,
            assigned_to_id=assigned_to_id
        )

        db.session.add(new_task)
        db.session.commit()
 
        return jsonify({
            'msg': 'Task created successfully',
            'task': new_task.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': f'Error creating task: {str(e)}'}), 500


@app.route('/api/project/<int:project_id>/task/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(project_id, task_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404
    project_members = Project_Member.query.filter_by(
        project_id=project_id).all()
    is_admin = (user.id == project.admin_id)
    is_member = user.id in [member.member_id for member in project_members]
    task = Task.query.filter_by(id=task_id, project_id=project_id).first()
    if not task:
        return jsonify({'msg': 'Task not found'}), 404
    if task.author_id != user.id and project.admin_id != user.id:
        return jsonify({'msg': 'You are not authorized to edit this task'}), 400

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'msg': 'Debes enviar información en el body'}), 400
    if 'title' in body and body['title'].strip():
        task.title = body['title']
    if 'description' in body:
        task.description = body['description']
    if 'status' in body:
        if body['status'] in TASK_STATUS_MAPPING:
            task.status = TASK_STATUS_MAPPING[body['status']]

    if 'assigned_to_id' in body and project.admin_id == user.id:
        assigned_to_id = body['assigned_to_id']
        if assigned_to_id:
            assigned_user = User.query.get(assigned_to_id)
            if not assigned_user:
                return jsonify({'msg': 'Assigned user not found'}), 404
            project_members = Project_Member.query.filter_by(
                project_id=project_id).all()
            valid_assignee = (assigned_user.id == project.admin_id or
                              assigned_user.id in [member.member_id for member in project_members])
            if not valid_assignee:
                return jsonify({'msg': 'Cannot assign task to user who is not part of the project'}), 400
            if is_member and assigned_user.id != user.id:
                return jsonify({'msg': 'You can only assign tasks to yourself'}), 400
        else:
            assigned_to_id = None

        task.assigned_to_id = assigned_to_id

    try:
        db.session.commit()
        return jsonify({
            'msg': 'Task updated successfully',
            'task': task.serialize()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Error updating task'}), 500


@app.route('/api/project/<int:project_id>/task/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(project_id, task_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'msg': 'Project not found'}), 404
    task = Task.query.filter_by(id=task_id, project_id=project_id).first()
    if not task:
        return jsonify({'msg': 'Task not found'}), 404
    if task.author_id != user.id and project.admin_id != user.id:
        return jsonify({'msg': 'You are not authorized to edit this task'}), 400

    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({
            'msg': 'Task deleted successfully',
            'task': task.serialize()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'msg': 'Error updating task'}), 500

# ========== AI ENDPOINTS ==========

import requests

@app.route("/api/ai/suggest-description", methods=["POST"])
def ai_suggest_description():
    data = request.get_json()
    task_title = data.get("title", "")

    if not task_title:
        return jsonify({"msg": "No title provided"}), 400

    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        return jsonify({"msg": "Mistral API key not configured"}), 500

    headers = {
        "Authorization": f"Bearer {mistral_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "mistral-tiny",  # Or mistral-small, mistral-medium
        "messages": [
            {"role": "system", "content": "You help write clear, concise task descriptions for dev teams."},
            {"role": "user", "content": f"Write a clear and concise description for this task: {task_title}"}
        ],
        "max_tokens": 60,
        "temperature": 0.7
    }

    try:
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        if response.status_code != 200:
            print("Mistral API Error:", response.text)
            return jsonify({"msg": "Error generating description", "error": response.text}), 500

        suggestion = response.json()["choices"][0]["message"]["content"].strip()
        return jsonify({"suggestion": suggestion})
    except Exception as e:
        print("Mistral API Error:", e)
        return jsonify({"msg": "Error generating description", "error": str(e)}), 500
    

@app.route('/api/ai/standup', methods=['POST'])
@jwt_required()
def ai_standup():
    all_projects = Project.query.all()
    if not all_projects:
        return jsonify({"msg": "No projects found."}), 404

    project_summaries = []
    for project in all_projects:
        tasks = Task.query.filter_by(project_id=project.id).all()
        num_tasks = len(tasks)
        num_done = len([t for t in tasks if t.status and "done" in str(t.status).lower()])
        num_inprogress = len([t for t in tasks if t.status and "progress" in str(t.status).lower()])
        num_urgent = len([t for t in tasks if t.status and "urgent" in str(t.status).lower()])
        project_summaries.append({
            "title": project.title,
            "description": project.description or "",
            "tasks": [t.title for t in tasks],
            "num_tasks": num_tasks,
            "num_done": num_done,
            "num_inprogress": num_inprogress,
            "num_urgent": num_urgent,
        })

    prompt = (
        "You are an AI standup bot. Summarize the current progress for each project. "
        "For each project, give a brief status update mentioning tasks done, in progress, urgent tasks, and anything notable. "
        "Make it readable and actionable for a daily standup update.\n\n"
    )
    for proj in project_summaries:
        prompt += (
            f"Project: {proj['title']}\n"
            f"Description: {proj['description']}\n"
            f"Total Tasks: {proj['num_tasks']}, Done: {proj['num_done']}, In Progress: {proj['num_inprogress']}, Urgent: {proj['num_urgent']}\n"
            f"Tasks: {', '.join(proj['tasks']) if proj['tasks'] else 'No tasks yet.'}\n\n"
        )

    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        return jsonify({"msg": "Mistral API key not configured"}), 500

    headers = {
        "Authorization": f"Bearer {mistral_api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "mistral-tiny",
        "messages": [
            {"role": "system", "content": "You are an AI project manager. Write a short standup summary update for all current projects given their tasks and status."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 280,
        "temperature": 0.6
    }

    try:
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        if response.status_code != 200:
            print("Mistral API Error:", response.text)
            return jsonify({"msg": "Error generating standup summary", "error": response.text}), 500

        summary = response.json()["choices"][0]["message"]["content"].strip()
        return jsonify({"standup": summary})
    except Exception as e:
        print("Mistral API Error:", e)
        return jsonify({"msg": "Error generating standup summary", "error": str(e)}), 500



# ---- RUN APP ----
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
