from flask import Blueprint, request, jsonify, current_app
import jwt
from functools import wraps
import os
from app.utils.firebase_utils import add_word, update_word, delete_word, get_words_by_user

bp = Blueprint('wordbook', __name__, url_prefix='/api/wordbook')

# JWT认证装饰器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        print('------- 单词本接口认证开始 -------')
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            print('错误: Authorization 头部缺失')
            return jsonify({'error': '未提供授权头部'}), 401
        
        if not auth_header.startswith('Bearer '):
            print(f'错误: Authorization 格式不正确: {auth_header}')
            return jsonify({'error': '授权令牌格式不正确 (应为 Bearer token)'}), 401
        
        token = auth_header.split(' ')[1]
        print(f'收到的令牌: {token[:20]}...{token[-10:] if len(token) > 30 else ""}')
        
        try:
            # 获取密钥
            secret_key = current_app.config.get('SECRET_KEY') or os.environ.get('SECRET_KEY')
            if not secret_key:
                print('错误: SECRET_KEY 未设置')
                return jsonify({'error': 'SECRET_KEY 配置缺失'}), 500
            
            print(f'尝试使用密钥解码令牌 (密钥前10个字符: {secret_key[:10] if secret_key else "None"})')
            
            # 解码令牌
            try:
                payload = jwt.decode(token, secret_key, algorithms=['HS256'])
                print(f'令牌解码成功: {payload}')
                user_id = payload['user_id']
            except jwt.ExpiredSignatureError:
                print('错误: 令牌已过期')
                return jsonify({'error': '令牌已过期'}), 401
            except jwt.InvalidTokenError as e:
                print(f'错误: 无效的令牌 (JWT格式错误): {str(e)}')
                return jsonify({'error': '无效的令牌', 'details': str(e)}), 401
            except KeyError as e:
                print(f'错误: 令牌中缺少必要字段: {str(e)}')
                return jsonify({'error': f'令牌中缺少 {str(e)} 字段'}), 401
            except Exception as e:
                print(f'错误: 解码令牌时发生未知错误: {str(e)}')
                return jsonify({'error': '令牌验证失败', 'details': str(e)}), 401
            
            # 直接使用令牌中的信息构建用户数据
            try:
                user = {
                    'id': user_id,
                    'name': payload.get('name', '用户'),
                    'email': payload.get('email', ''),
                    'profile_picture': payload.get('profile_picture', '')
                }
                
                print(f'用户验证成功: {user["id"]}')
            except Exception as e:
                print(f'错误: 获取用户信息时出错: {str(e)}')
                return jsonify({'error': '获取用户信息失败', 'details': str(e)}), 500
            
            print('------- 单词本接口认证成功 -------')
            return f(user, *args, **kwargs)
            
        except Exception as e:
            print(f'错误: 处理认证过程中发生意外错误: {str(e)}')
            return jsonify({'error': '认证过程中发生错误', 'details': str(e)}), 500
    
    return decorated

# 获取单词列表
@bp.route('', methods=['GET'])
@token_required
def get_wordbook(user):
    words = get_words_by_user(user['id'])
    return jsonify(words), 200

# 添加单词
@bp.route('/add', methods=['POST'])
@token_required
def add_new_word(user):
    data = request.get_json()
    
    if not data or not all(k in data for k in ('word', 'kana', 'meaning')):
        return jsonify({'error': '缺少必要参数'}), 400
    
    # 准备单词数据
    word_data = {
        'word': data['word'],
        'kana': data['kana'],
        'meaning': data['meaning']
    }
    
    # 尝试添加单词
    word_id = add_word(user['id'], word_data['word'], word_data['kana'], word_data['meaning'])
    
    # 返回添加的单词数据
    return jsonify({
        'id': word_id,
        'word': word_data['word'],
        'kana': word_data['kana'],
        'meaning': word_data['meaning'],
        'user_id': user['id']
    }), 201

# 更新单词
@bp.route('/<word_id>', methods=['PUT'])
@token_required
def update_word_api(user, word_id):
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '没有提供更新数据'}), 400
    
    # 准备更新数据
    update_data = {}
    if 'word' in data:
        update_data['word'] = data['word']
    if 'kana' in data:
        update_data['kana'] = data['kana']
    if 'meaning' in data:
        update_data['meaning'] = data['meaning']
    
    # 更新单词
    try:
        update_word(word_id, update_data)
        return jsonify({'message': '单词更新成功', 'id': word_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# 删除单词
@bp.route('/<word_id>', methods=['DELETE'])
@token_required
def delete_word_api(user, word_id):
    try:
        delete_word(word_id)
        return jsonify({'message': '单词已删除'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404