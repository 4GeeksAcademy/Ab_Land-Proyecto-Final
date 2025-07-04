from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import User

api = Blueprint('api', __name__)

@api.route('/hello', methods=['GET'])
def handle_hello():
    return jsonify({"message": "Hello from backend!"}), 200

@api.route('/private', methods=['GET'])
@jwt_required()
def api_private():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({'msg': 'Este es un endpoint privado!', 'user': user.serialize()}), 200


