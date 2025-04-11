from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import datetime
import os
import firebase_admin
from firebase_admin import auth, credentials

# 移除了所有用户集合相关的导入和函数调用

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# 初始化 Firebase Admin
try:
    # 检查是否已经初始化
    firebase_admin.get_app()
    print("Firebase Admin SDK 已经初始化")
except ValueError:
    # 如果没有初始化，则初始化
    try:
        cred_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'firebase-key.json')
        print(f"Firebase 密钥文件路径: {cred_path}")
        
        if not os.path.exists(cred_path):
            print(f"Firebase 密钥文件不存在: {cred_path}")
            raise FileNotFoundError(f"Firebase key file not found at {cred_path}")
            
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK 初始化成功")
    except Exception as e:
        print(f"Firebase Admin SDK 初始化失败: {str(e)}")
        raise

# Google/Firebase登录处理
@bp.route('/google', methods=['POST'])
def google_auth():
    # 从请求中获取Firebase ID Token
    data = request.get_json()
    id_token_str = data.get('idToken')
    
    # 验证Firebase ID Token
    try:
        # 尝试验证 Firebase ID 令牌
        try:
            decoded_token = auth.verify_id_token(id_token_str)
            
            # 获取用户信息
            uid = decoded_token['uid']
            email = decoded_token.get('email')
            name = decoded_token.get('name', '用户')
            picture = decoded_token.get('picture', '')
            
            print(f"成功验证 Firebase ID 令牌并提取用户信息: {email}")
        except Exception as firebase_error:
            # 如果 Firebase 验证失败，尝试其他方法
            print(f"Firebase 验证失败: {str(firebase_error)}")
            
            # 如果是 Firebase ID 令牌有问题，尝试直接解析 JWT
            try:
                import jwt as pyjwt
                # 只是试图解析令牌，不做验证
                token_data = pyjwt.decode(id_token_str, options={"verify_signature": False})
                print(f"手动解析令牌结果: {token_data}")
                
                # 从 JWT 计划提取用户信息
                uid = token_data.get('sub') or token_data.get('user_id')
                email = token_data.get('email')
                name = token_data.get('name', '用户')
                picture = token_data.get('picture', '')
            except Exception as jwt_error:
                print(f"JWT 解析失败: {str(jwt_error)}")
                raise
        
        # 直接使用用户信息
        user = {
            'id': uid,
            'email': email,
            'name': name,
            'profile_picture': picture
        }
        
        print(f"使用用户信息生成 JWT: {user}")
        
        # 创建JWT令牌
        expiration = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        payload = {
            'user_id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'profile_picture': user['profile_picture'],
            'exp': expiration
        }
        secret_key = current_app.config.get('SECRET_KEY') or os.environ.get('SECRET_KEY')
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'photoURL': user['profile_picture']
            }
        }), 200
        
    except Exception as e:
        import traceback
        print(f"错误类型: {type(e).__name__}")
        print(f"错误消息: {str(e)}")
        print(f"堆栈跟踪: {traceback.format_exc()}")
        return jsonify({'error': str(e), 'error_type': type(e).__name__}), 401

# JWT令牌验证
@bp.route('/verify', methods=['GET'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '未提供有效的授权令牌'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        secret_key = current_app.config.get('SECRET_KEY') or os.environ.get('SECRET_KEY')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        user_id = payload['user_id']
        
        # 直接使用JWT中的信息构建用户数据
        user = {
            'id': user_id,
            'name': payload.get('name', '用户'),
            'email': payload.get('email', ''),
            'profile_picture': payload.get('profile_picture', '')
        }
        
        return jsonify({
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'photoURL': user['profile_picture']
            }
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': '令牌已过期'}), 401
    except (jwt.InvalidTokenError, Exception) as e:
        return jsonify({'error': '无效的令牌', 'details': str(e)}), 401
