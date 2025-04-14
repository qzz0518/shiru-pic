import axios from 'axios';
import db from '../utils/db';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
  }
});

// 初始化全局token
let cachedToken: string | null = null;

// 初始加载令牌
db.getAuthToken().then(authData => {
  if (authData?.token) {
    cachedToken = authData.token;
    console.log('从 Dexie 数据库加载令牌成功');
  }
}).catch(err => {
  console.error('加载令牌失败:', err);
});

// 添加令牌清除事件监听器
window.addEventListener('auth-token-cleared', () => {
  console.log('收到清除令牌事件，清除缓存令牌');
  cachedToken = null;
  // 删除请求头中的认证信息
  delete api.defaults.headers.common['Authorization'];
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  async (config) => {
    try {
      // 如果没有缓存的令牌，尝试从数据库获取
      if (!cachedToken) {
        const authData = await db.getAuthToken();
        if (authData?.token) {
          cachedToken = authData.token;
        }
      }
      
      if (cachedToken) {
        config.headers['Authorization'] = `Bearer ${cachedToken}`;
      }
    } catch (err) {
      console.error('获取认证令牌失败:', err);
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
    // 提取详细错误信息的函数
    const extractErrorDetails = (error: any) => {
      if (!error.response) return '网络错误或服务器未响应';
      
      // 获取响应数据
      const { data, status } = error.response;
      
      // 尝试从不同的数据结构中提取错误信息
      let errorMessage = '';
      
      if (typeof data === 'string') {
        // 如果响应直接是字符串
        errorMessage = data;
      } else if (data?.error?.message) {
        // OpenAI 错误格式
        errorMessage = `错误: ${data.error.message}`;
      } else if (data?.message) {
        // 常见错误格式
        errorMessage = data.message;
      } else if (data?.error && typeof data.error === 'string') {
        // 简单错误格式
        errorMessage = data.error;
      } else if (data?.detail) {
        // FastAPI 错误格式
        errorMessage = data.detail;
      } else {
        // 默认错误信息
        errorMessage = `请求失败 (${status})`;
      }
      
      return errorMessage;
    };
    
    if (error.response) {
      // 401错误 - 未认证
      if (error.response.status === 401) {
        // 使用 Dexie 清除令牌
        try {
          // 清除缓存的令牌
          cachedToken = null;
          
          // 删除存储的令牌
          db.authData.delete('current').then(() => {
            console.log('令牌已从 Dexie 数据库中移除');
          });
        } catch (err) {
          console.error('移除令牌失败:', err);
        }
        
        // 触发重定向到登录页
        window.location.href = '/login';
      }
      
      // 提取并记录详细错误信息
      const errorMessage = extractErrorDetails(error);
      console.error('API错误:', errorMessage, error.response);
      
      // 修改错误对象，添加用户友好的错误信息
      error.userFriendlyMessage = errorMessage;
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('请求超时或网络错误:', error.request);
      error.userFriendlyMessage = '请求超时，请检查网络连接';
    } else {
      // 请求设置时发生错误
      console.error('请求配置错误:', error.message);
      error.userFriendlyMessage = '请求发送失败';
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
      model: 'gpt-4.1-mini',
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
