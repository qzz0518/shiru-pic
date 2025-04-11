import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理常见错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401错误 - 未认证
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        // 可以在这里触发重定向到登录页
        window.location.href = '/login';
      }
      // 展示错误消息
      const errorMessage = error.response.data?.error || '请求失败';
      console.error(errorMessage);
    } else {
      console.error('网络错误或服务器未响应');
    }
    return Promise.reject(error);
  }
);

// 服务器状态检查API
export const serverAPI = {
  // 获取服务器状态
  ping: () => {
    return api.get('/api/ping');
  }
};

// 认证相关API
export const authAPI = {
  // Google登录
  googleLogin: (idToken: string) => {
    return api.post('/api/auth/google', { idToken });
  },
  
  // 获取当前用户信息
  getCurrentUser: () => {
    return api.get('/api/auth/me');
  },
};

// 单词本API
export const wordbookAPI = {
  // 获取所有单词
  getWords: () => {
    return api.get('/api/wordbook');
  },
  
  // 添加单词
  addWord: (wordData: { word: string; kana: string; meaning: string }) => {
    return api.post('/api/wordbook/add', wordData);
  },
  
  // 更新单词
  updateWord: (wordId: string, wordData: { word?: string; kana?: string; meaning?: string }) => {
    return api.put(`/api/wordbook/${wordId}`, wordData);
  },
  
  // 删除单词
  deleteWord: (wordId: string) => {
    return api.delete(`/api/wordbook/${wordId}`);
  },
};

// AI语言处理相关API
export const aiAPI = {
  // 使用4o-mini模型进行日中互译
  translateJapaneseChinese: (word: string) => {
    return api.post('/api/ai/translate', {
      model: 'gpt-4o-mini',
      query: word,
      system_prompt: '你是一个专业的日中互译助手。请提供以下日语单词的详细信息，包括原始单词、假名(如果有)、中文意思和例句。请用JSON格式返回，格式为：{"word": "单词", "kana": "假名", "meaning": "中文意思", "example": "例句", "exampleMeaning": "例句翻译"}'
    });
  }
};

// 历史记录API
export const historyAPI = {
  // 获取所有历史记录
  getHistory: () => {
    return api.get('/api/history');
  },
  
  // 获取单条历史记录详情
  getHistoryItem: (historyId: string) => {
    return api.get(`/api/history/${historyId}`);
  },
  
  // 删除历史记录
  deleteHistoryItem: (historyId: string) => {
    return api.delete(`/api/history/${historyId}`);
  },
};

// 图片处理API
export const imageAPI = {
  // 分析图片
  analyzeImage: (formData: FormData) => {
    return api.post('/api/image/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// TTS API
export const ttsAPI = {
  // 获取文字语音
  speak: (text: string) => {
    return api.post('/api/tts/speak', { text }, { responseType: 'blob' });
  },
};

export default api;
