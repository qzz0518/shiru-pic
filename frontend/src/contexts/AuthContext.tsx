import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 头像缓存键
const AVATAR_CACHE_KEY = 'cached_user_avatar_data';

// 配置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
axios.defaults.baseURL = API_BASE_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

// 下载头像并转换为Base64
async function fetchAndCacheAvatar(url: string): Promise<string | null> {
  try {
    // 检查是否已经是Base64格式
    if (url.startsWith('data:image')) {
      return url;
    }
    
    // 使用Fetch API下载图片
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`下载头像失败: ${response.status}`);
    }
    
    // 将图片转换为Blob
    const blob = await response.blob();
    
    // 转换Blob为Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('处理头像失败:', error);
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 自定义Hook，用于访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 认证提供器组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 检查用户是否已经认证
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 从本地存储中获取token
        const token = localStorage.getItem('auth_token');
        if (token) {
          // 设置axios默认headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 调用API验证token
          const response = await axios.get('/api/auth/verify');
          const userData = response.data.user;
          
          // 检查是否有缓存的头像
          const cachedAvatarData = localStorage.getItem(AVATAR_CACHE_KEY);
          if (cachedAvatarData && userData) {
            // 直接使用Base64数据替换URL
            userData.photoURL = cachedAvatarData;
          } else if (userData && userData.photoURL) {
            // 如果没有缓存但有URL，尝试下载并缓存
            fetchAndCacheAvatar(userData.photoURL).then(base64Data => {
              if (base64Data) {
                userData.photoURL = base64Data;
                setUser({...userData});
              }
            }).catch(err => console.error('缓存头像失败:', err));
          }
          
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token验证失败，清除本地存储
        console.error('验证失败:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 登录函数
  const login = async (idToken: string) => {
    try {
      // 调用后端API进行认证 - 使用idToken作为参数名
      const response = await axios.post('/api/auth/google', { idToken });
      const { token, user } = response.data;
      
      // 存储token和设置用户信息
      localStorage.setItem('auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 缓存用户头像 - 下载并转换为Base64
      if (user.photoURL) {
        // 下载头像并缓存
        fetchAndCacheAvatar(user.photoURL).then(base64Data => {
          if (base64Data) {
            // 直接替换用户对象中的URL为Base64数据
            user.photoURL = base64Data;
            setUser({...user});
          }
        }).catch(err => console.error('缓存头像失败:', err));
      }
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  // 登出函数
  const logout = () => {
    // 清除本地存储和状态
    localStorage.removeItem('auth_token');
    // 不删除头像缓存，保留以便下次登录时使用
    // localStorage.removeItem(AVATAR_CACHE_KEY);
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
