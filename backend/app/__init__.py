from flask import Flask
from flask_cors import CORS
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# Firebase 客户端
firebase = None
firestore_db = None
storage_bucket = None

def create_app(test_config=None):
    # 创建Flask应用
    app = Flask(__name__)
    
    # 配置CORS，允许前端访问
    CORS(app)
    
    # 初始化Firebase
    global firebase, firestore_db, storage_bucket
    
    cred_path = os.environ.get('FIREBASE_CREDENTIALS', 'firebase-key.json')
    bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET', 'shiru-pic.firebasestorage.app')
        
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate(cred_path)
            # 初始化Firebase应用
            firebase = firebase_admin.initialize_app(cred, {
                'storageBucket': bucket_name,
                'projectId': 'shiru-pic'
            })
            
            # 输出更详细的日志
            print(f"Firebase初始化成功: {firebase._name}")
            print(f"项目ID: {firebase.project_id}")
            # 确保在初始化成功后再获取客户端
            firestore_db = firestore.client()
            storage_bucket = storage.bucket()
            app.logger.info('Firebase 初始化成功')
        except Exception as e:
            app.logger.error(f'Firebase 初始化失败: {str(e)}')
            # 在初始化失败时，将客户端设为None，防止后续代码出错
            firestore_db = None
            storage_bucket = None
    
    # 设置应用密钥
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_please_change_in_production')
    
    with app.app_context():
        from .api import auth, wordbook, image, tts, history, ai
        app.register_blueprint(auth.bp)
        app.register_blueprint(wordbook.bp)
        app.register_blueprint(image.bp)
        app.register_blueprint(tts.bp)
        app.register_blueprint(history.bp)
        app.register_blueprint(ai.ai_bp)
    
    # 添加ping端点用于测试
    @app.route('/api/ping')
    def ping():
        return {'status': 'success', 'message': 'Firebase API正在运行'}, 200
        
    @app.route('/')
    def index():
        return {'status': 'success', 'message': 'ShiruPic API服务器已启动'}, 200
    
    return app
