import uuid
from datetime import datetime
from firebase_admin import firestore
from app import firestore_db, storage_bucket

def add_word(user_id, word, kana, meaning):
    word_id = str(uuid.uuid4())
    word_ref = firestore_db.collection('words').document(word_id)
    
    word_data = {
        'id': word_id,
        'user_id': user_id,
        'word': word,
        'kana': kana,
        'meaning': meaning,
        'created_at': firestore.SERVER_TIMESTAMP
    }
    
    word_ref.set(word_data)
    return word_id

def get_words_by_user(user_id):
    words_ref = firestore_db.collection('words')
    query = words_ref.where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    results = []
    for doc in query.get():
        word_data = doc.to_dict()
        # 格式化日期
        if 'created_at' in word_data and word_data['created_at']:
            word_data['createdAt'] = word_data['created_at'].isoformat()
        results.append(word_data)
    
    return results

def update_word(word_id, data):
    word_ref = firestore_db.collection('words').document(word_id)
    word_ref.update(data)

def delete_word(word_id):
    word_ref = firestore_db.collection('words').document(word_id)
    word_ref.delete()

def add_history_item(user_id, image_url, image_storage_path, sentence, translated_sentence, detected_words):
    history_id = str(uuid.uuid4())
    history_ref = firestore_db.collection('history').document(history_id)
    
    history_data = {
        'id': history_id,
        'user_id': user_id,
        'image_url': image_url,
        'image_storage_path': image_storage_path,
        'sentence': sentence,
        'translated_sentence': translated_sentence,
        'created_at': firestore.SERVER_TIMESTAMP,
        'word_count': len(detected_words)
    }
    
    # 使用事务同时添加历史记录和单词
    transaction = firestore_db.transaction()
    
    @firestore.transactional
    def add_in_transaction(transaction, history_ref, history_data, detected_words):
        transaction.set(history_ref, history_data)
        
        for word_data in detected_words:
            word_id = str(uuid.uuid4())
            word_ref = firestore_db.collection('detected_words').document(word_id)
            
            word_data['id'] = word_id
            word_data['history_id'] = history_id
            
            transaction.set(word_ref, word_data)
    
    add_in_transaction(transaction, history_ref, history_data, detected_words)
    return history_id

def get_history_by_user(user_id):
    history_ref = firestore_db.collection('history')
    query = history_ref.where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
    
    results = []
    for doc in query.get():
        history_data = doc.to_dict()
        # 格式化日期
        if 'created_at' in history_data and history_data['created_at']:
            history_data['createdAt'] = history_data['created_at'].isoformat()
        results.append(history_data)
    
    return results

def get_history_item(history_id):
    history_ref = firestore_db.collection('history').document(history_id)
    history_doc = history_ref.get()
    
    if not history_doc.exists:
        return None
    
    history_data = history_doc.to_dict()
    
    # 获取关联的单词
    words_ref = firestore_db.collection('detected_words')
    words_query = words_ref.where('history_id', '==', history_id)
    
    words = []
    for doc in words_query.get():
        word_data = doc.to_dict()
        words.append(word_data)
    
    history_data['words'] = words
    
    # 格式化日期
    if 'created_at' in history_data and history_data['created_at']:
        history_data['createdAt'] = history_data['created_at'].isoformat()
    
    return history_data

def delete_history_item(history_id):
    # 获取历史记录
    history_ref = firestore_db.collection('history').document(history_id)
    history_doc = history_ref.get()
    
    if not history_doc.exists:
        return False
    
    history_data = history_doc.to_dict()
    
    # 删除存储中的图片
    if 'image_storage_path' in history_data:
        try:
            blob = storage_bucket.blob(history_data['image_storage_path'])
            blob.delete()
        except Exception as e:
            print(f"删除图片失败: {e}")
    
    # 使用事务删除历史记录和关联的单词
    transaction = firestore_db.transaction()
    
    @firestore.transactional
    def delete_in_transaction(transaction, history_id):
        # 删除历史记录
        history_ref = firestore_db.collection('history').document(history_id)
        transaction.delete(history_ref)
        
        # 删除关联的单词
        words_ref = firestore_db.collection('detected_words')
        words_query = words_ref.where('history_id', '==', history_id)
        
        for doc in words_query.get():
            transaction.delete(doc.reference)
    
    delete_in_transaction(transaction, history_id)
    return True

def upload_image(file_data, filename):
    """
    上传图片到Firebase Storage
    """
    # 生成唯一文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}_{filename}"
    
    # 创建Blob
    blob = storage_bucket.blob(f"uploads/{unique_filename}")
    
    # 设置内容类型
    content_type = 'image/jpeg'
    if filename.lower().endswith('.png'):
        content_type = 'image/png'
    elif filename.lower().endswith('.gif'):
        content_type = 'image/gif'
    
    # 上传文件
    blob.upload_from_string(file_data, content_type=content_type)
    
    # 生成公共URL
    blob.make_public()
    
    return blob.public_url, f"uploads/{unique_filename}"
