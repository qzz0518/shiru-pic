from flask import Blueprint, request, jsonify, current_app
from app.api.wordbook import token_required
from app.utils.firebase_utils import get_history_by_user, get_history_item, delete_history_item

bp = Blueprint('history', __name__, url_prefix='/api/history')

# 获取历史记录列表
@bp.route('', methods=['GET'])
@token_required
def get_history_list(user):
    history_items = get_history_by_user(user['id'])
    return jsonify(history_items), 200

# 获取单条历史记录详情
@bp.route('/<history_id>', methods=['GET'])
@token_required
def get_history_details(user, history_id):
    history_item = get_history_item(history_id)
    
    if not history_item:
        return jsonify({'error': '记录不存在'}), 404
    
    if history_item['user_id'] != user['id']:
        return jsonify({'error': '没有权限查看此记录'}), 403
    
    return jsonify(history_item), 200

# 删除历史记录
@bp.route('/<history_id>', methods=['DELETE'])
@token_required
def remove_history_item(user, history_id):
    # 尝试删除历史记录
    try:
        # 首先获取历史记录，验证它属于当前用户
        history_item = get_history_item(history_id)
        
        if not history_item:
            return jsonify({'error': '记录不存在'}), 404
        
        if history_item['user_id'] != user['id']:
            return jsonify({'error': '没有权限删除此记录'}), 403
        
        # 删除历史记录（Firebase工具函数将同时删除存储中的图片和相关单词）
        success = delete_history_item(history_id)
        
        if success:
            return jsonify({'message': '记录已删除'}), 200
        else:
            return jsonify({'error': '删除记录失败'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
