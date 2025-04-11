from flask import Blueprint, request, jsonify, send_file
import os
import io
import tempfile
import openai
from app.api.wordbook import token_required

bp = Blueprint('tts', __name__, url_prefix='/api/tts')

# 文本转语音
@bp.route('/speak', methods=['POST'])
@token_required
def text_to_speech(user):
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({'error': '没有提供文本'}), 400
    
    text = data['text']
    
    # 获取OpenAI API密钥
    from dotenv import load_dotenv
    load_dotenv(override=True)
    api_key = os.environ.get('OPENAI_API_KEY')
    
    if not api_key:
        return jsonify({'error': 'OpenAI API密钥未配置'}), 500
    
    try:
        openai.api_key = api_key
        
        # 创建临时文件存储音频数据
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        
        # 调用OpenAI TTS API生成语音
        response = openai.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="alloy",
            input=text,
        )
        
        # 保存音频数据到临时文件
        temp_file.write(response.content)
        temp_file.close()
        
        # 发送音频文件
        return send_file(
            temp_file.name,
            mimetype="audio/mpeg",
            as_attachment=True,
            download_name="speech.mp3"
        )
        
    except Exception as e:
        return jsonify({'error': f'生成语音失败: {str(e)}'}), 500
