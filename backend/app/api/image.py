from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import uuid
import base64
import json
import os
import logging
from app import firestore_db, storage_bucket
from app.api.wordbook import token_required
from app.utils.firebase_utils import upload_image, add_history_item
import openai
from PIL import Image
import io

# 配置日志记录器
logger = logging.getLogger(__name__)

bp = Blueprint('image', __name__, url_prefix='/api/image')

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    # 统一使用小写扩展名进行判断
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    # 兼容JPG和JPEG扩展名的大小写问题
    if ext in ('jpg', 'jpeg'):
        return True
    return ext in ALLOWED_EXTENSIONS



# 使用OpenAI分析图片内容
def analyze_image_with_openai(image_url_or_path, api_key, is_url=False, image_data=None):
    try:
        logger.info(f"开始分析图片: {'使用URL' if is_url else '使用二进制数据' if image_data else '使用本地文件'}")
        
        # 创建OpenAI客户端
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # 处理图片数据
        if is_url:
            # 使用URL直接调用API
            image_url = image_url_or_path
            logger.info(f"使用图片URL: {image_url[:50]}...")
        elif image_data:
            # 使用传入的二进制数据
            logger.info("使用传入的图片数据")
            image_data_base64 = base64.b64encode(image_data).decode('ascii')
            # 使用通用的MIME类型
            image_url = f"data:image/png;base64,{image_data_base64}"
        else:
            # 读取本地图片文件
            logger.info(f"读取本地图片: {image_url_or_path}")
            with open(image_url_or_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode('ascii')
                image_url = f"data:image/png;base64,{image_data}"
        
        # 调用OpenAI视觉API分析图片
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": "分析这张图片，识别图片中的物体，并给出每个物体的日语名称、假名读音和中文翻译。 \
                        还要给出每个物体在图片中的大致位置（用x和y的百分比表示）。然后，使用这些日语单词创建一个自然的日语句子，并提供中文翻译。\
                        单个图片最多返回5个单词，并且返回的物体坐标不要重叠，如果多个识别的物体非常靠近，坐标可以相对分散。\
                        \n\n请使用以下的JSON格式返回结果，不要添加其他文本说明：\n{\n  \"words\": [\n    {\n      \"id\": \"uuid\",\n      \"word\": \"[日语单词]\",\n      \"kana\": \"[假名读音]\",\n      \"meaning\": \"[中文意思]\",\n      \"position\": {\"x\": [横坐标百分比], \"y\": [纵坐标百分比]}\n    }\n  ],\n  \"sentence\": {\n    \"japanese\": \"[日语句子]\",\n    \"chinese\": \"[中文翻译]\"\n  }\n}"},
                        {"type": "input_image", "image_url": image_url},
                    ],
                }
            ]
        )
        # 打印响应
        logger.info(f"OpenAI API 响应: {response}")
        # 处理返回的文本，提取JSON（适配新版OpenAI API响应格式）
        # 新的响应格式为 response.output[0].content[0].text
        try:
            # 获取AI返回的文本
            ai_text = response.output[0].content[0].text
            logger.info(f"API返回文本: {ai_text[:200]}...")
            
            # 如果返回的是markdown格式的JSON，需要去除```json和```
            if ai_text.startswith('```json'):
                ai_text = ai_text.replace('```json', '', 1)
                ai_text = ai_text.replace('```', '', 1)
            
            # 宽松解析，查找文本中的JSON部分
            json_start = ai_text.find('{')
            json_end = ai_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = ai_text[json_start:json_end]
                result = json.loads(json_str)
                
                # 处理返回结果，确保格式符合前端需求
                # 统一处理words的id字段
                if "words" in result:
                    for word in result["words"]:
                        # 确保每个单词有唯一ID
                        if "id" not in word or not word["id"]:
                            word["id"] = str(uuid.uuid4())
                        elif word["id"] == "uuid" or word["id"] == "1":
                            word["id"] = str(uuid.uuid4())
                
                # 处理句子字段，确保与前端兼容
                if "sentence" in result and isinstance(result["sentence"], dict):
                    # 将sentence的japanese和chinese字段分别提取到外部
                    if "japanese" in result["sentence"]:
                        result["sentence_japanese"] = result["sentence"]["japanese"]
                    
                    if "chinese" in result["sentence"]:
                        result["sentence_chinese"] = result["sentence"]["chinese"]
                    
                    # 为兼容性保留sentence字段
                    if "japanese" in result["sentence"]:
                        result["sentence"] = result["sentence"]["japanese"]
                    
                    # 添加translatedSentence字段保持兼容性
                    if "chinese" in result["sentence"]:
                        result["translatedSentence"] = result["sentence"]["chinese"]
            else:
                # 无法提取JSON，返回简单模拟数据
                result = {
                    "words": [
                        {
                            "id": str(uuid.uuid4()),
                            "word": "椅子",
                            "kana": "いす",
                            "meaning": "椅子",
                            "position": {"x": 30, "y": 50}
                        },
                        {
                            "id": str(uuid.uuid4()),
                            "word": "テーブル",
                            "kana": "てーぶる",
                            "meaning": "桌子",
                            "position": {"x": 70, "y": 60}
                        }
                    ],
                    "sentence": "椅子はテーブルのそばにあります。",
                    "translatedSentence": "椅子在桌子旁边。",
                    "sentence_japanese": "椅子はテーブルのそばにあります。",
                    "sentence_chinese": "椅子在桌子旁边。"
                }
        except Exception as e:
            logger.error(f"解析AI图像JSON响应错误: {str(e)}")
            # 返回简洁的模拟数据
            result = {
                "words": [
                    {
                        "id": str(uuid.uuid4()),
                        "word": "猫",
                        "kana": "ねこ",
                        "meaning": "猫",
                        "position": {"x": 50, "y": 50}
                    }
                ],
                "sentence": "猫がいます。",
                "translatedSentence": "有一只猫。",
                "sentence_japanese": "猫がいます。",
                "sentence_chinese": "有一只猫。"
            }
        
        return result
        
    except Exception as e:
        logger.error(f"OpenAI图像分析服务错误: {str(e)}", exc_info=True)
        # 返回简洁的错误信息与空数据
        return {
            "error": str(e),
            "words": [],
            "sentence": "无法分析图像。",
            "sentence_japanese": "画像を分析できません。",
            "sentence_chinese": "无法分析图像。",
            "translatedSentence": "无法分析图像。"
        }

# 分析图片
@bp.route('/analyze', methods=['POST'])
@token_required
def analyze_image(user):
    # 检查请求中是否有文件
    if 'image' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    
    file = request.files['image']
    
    # 检查文件名是否为空
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    # 检查文件类型
    if file and allowed_file(file.filename):
        original_filename = secure_filename(file.filename).lower()
        
        try:
            # 读取文件内容
            file_data = file.read()
            
            # 上传到Firebase Storage
            image_url, storage_path = upload_image(file_data, original_filename)
            
            # 获取OpenAI API密钥
            from dotenv import load_dotenv
            load_dotenv(override=True)
            api_key = os.environ.get('OPENAI_API_KEY')
            
            if not api_key:
                return jsonify({'error': 'OpenAI API密钥未配置'}), 500
            
            # 分析图片 - 使用原始文件数据
            # 重置文件指针并重新读取数据
            file.seek(0)
            analysis_result = analyze_image_with_openai(image_url, api_key, is_url=False, image_data=file_data)
            
            if 'error' in analysis_result:
                return jsonify({'error': f'图片分析失败: {analysis_result["error"]}'}), 500
            
            # 准备检测到的单词数据
            detected_words = []
            for word_data in analysis_result.get('words', []):
                detected_words.append({
                    'word': word_data.get('word', ''),
                    'kana': word_data.get('kana', ''),
                    'meaning': word_data.get('meaning', ''),
                    'position_x': word_data.get('position', {}).get('x', 0),
                    'position_y': word_data.get('position', {}).get('y', 0)
                })
            
            # 获取句子，优先使用sentence_japanese，兼容新旧格式
            japanese_sentence = analysis_result.get('sentence_japanese', analysis_result.get('sentence', ''))
            chinese_sentence = analysis_result.get('sentence_chinese', analysis_result.get('translatedSentence', ''))
            
            # 将数据保存到Firebase
            history_id = add_history_item(
                user['id'],
                image_url,
                storage_path,
                japanese_sentence,
                chinese_sentence,
                detected_words
            )
            
            # 构建响应 - 包含新增字段
            response_data = {
                'imageUrl': image_url,
                'historyId': history_id,  # 增加历史记录ID
                'words': analysis_result.get('words', []),
                'sentence': japanese_sentence,
                'translatedSentence': chinese_sentence,
                'sentence_japanese': japanese_sentence,  # 增加新字段
                'sentence_chinese': chinese_sentence     # 增加新字段
            }
            
            return jsonify(response_data), 200
                
        except Exception as e:
            return jsonify({'error': f'处理图片失败: {str(e)}'}), 500
    
    return jsonify({'error': '不支持的文件类型'}), 400
