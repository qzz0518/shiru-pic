import os
import json
from openai import OpenAI
from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
import logging

# 创建blueprint
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
logger = logging.getLogger(__name__)

# 初始化OpenAI客户端 - 注意这里不预先初始化客户端
# 而是在每次请求时重新创建，确保使用最新的API密钥

@ai_bp.route('/translate', methods=['POST'])
@cross_origin()
def translate():
    """使用AI模型进行日中互译"""
    try:
        # 获取请求数据
        data = request.get_json()
        if not data:
            return jsonify({'error': '请求数据为空'}), 400
        
        requested_model = data.get('model', 'gpt-4o-mini')
        query = data.get('query')
        system_prompt = data.get('system_prompt', '你是一个专业的日中互译助手。请提供以下日语单词的详细信息，包括原始单词、假名(如果有)、中文意思和例句。请用JSON格式返回，格式为：{"word": "单词", "kana": "假名", "meaning": "中文意思", "example": "例句", "exampleMeaning": "例句翻译"}')
        
        if not query:
            return jsonify({'error': '查询文本不能为空'}), 400
        
        try:
            # 在每次请求时重新创建OpenAI客户端
            # 直接从.env文件重新读取API密钥
            from dotenv import load_dotenv
            # 强制重新加载.env文件
            load_dotenv(override=True)
            api_key = os.environ.get('OPENAI_API_KEY')
            logger.info(f"使用API密钥前缀: {api_key[:10] if api_key else None}...")
            client = OpenAI(api_key=api_key)
            
            # 使用OpenAI客户端直接调用API
            response = client.chat.completions.create(
                model=requested_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.2,
                max_tokens=800
            )
            
            # 从响应中提取内容
            content = response.choices[0].message.content
            
            # 尝试解析JSON响应
            try:
                # 首先尝试直接解析整个内容
                result = json.loads(content)
            except json.JSONDecodeError:
                # 如果不是有效的JSON，尝试从文本中提取JSON部分
                json_match = content.find('{')
                if json_match != -1:
                    try:
                        # 提取{}包含的内容
                        json_content = content[json_match:]
                        # 找到最后一个}的位置
                        last_brace = json_content.rfind('}')
                        if last_brace != -1:
                            json_content = json_content[:last_brace+1]
                            result = json.loads(json_content)
                        else:
                            raise ValueError("无法在响应中找到完整的JSON")
                    except Exception as e:
                        logger.error(f"JSON解析错误: {str(e)}")
                        # 返回原始文本响应
                        return jsonify({"content": content}), 200
                else:
                    # 没有找到JSON，返回原始文本
                    return jsonify({"content": content}), 200
            
            # 返回解析后的JSON或原始响应
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"OpenAI API调用错误: {str(e)}")
            return jsonify({'error': f'模型API请求失败: {str(e)}'}), 500
    
    except Exception as e:
        logger.error(f"翻译服务错误: {str(e)}")
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500
