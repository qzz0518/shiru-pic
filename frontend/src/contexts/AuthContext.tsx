import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import db from '../utils/db'; // 引入Dexie数据库模块

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
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        // 将头像数据保存到Dexie数据库
        db.cacheAvatar(base64Data).catch(err => 
          console.error('将头像保存到Dexie失败:', err)
        );
        resolve(base64Data);
      };
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
        // 从Dexie数据库中获取认证信息
        const authData = await db.getAuthToken();
        
        if (authData && authData.token) {
          // 设置axios默认headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;
          
          try {
            // 调用API验证token
            const response = await axios.get('/api/auth/verify');
            const userData = response.data.user;
            
            // 检查是否有缓存的头像
            const cachedAvatarData = await db.getCachedAvatar();
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
            
            // 更新认证数据 - 这会刷新时间戳
            db.saveAuthToken(authData.token, userData);
            
            setUser(userData);
            setIsAuthenticated(true);
          } catch (apiError) {
            console.error('API验证失败:', apiError);
            
            // 如果API验证失败，尝试使用存储的用户数据
            if (authData.userData) {
              setUser(authData.userData);
              setIsAuthenticated(true);
              console.log('使用缓存的用户数据，API连接失败');
            } else {
              // 如果没有用户数据，清除认证信息
              await db.clearAuth();
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          // 兼容旧版本 - 从 localStorage 获取 token （迁移过渡用）
          const legacyToken = localStorage.getItem('auth_token');
          if (legacyToken) {
            console.log('从 localStorage 迁移数据到 Dexie');
            axios.defaults.headers.common['Authorization'] = `Bearer ${legacyToken}`;
            try {
              const response = await axios.get('/api/auth/verify');
              if (response.data.user) {
                // 将数据存入 Dexie
                await db.saveAuthToken(legacyToken, response.data.user);
                setUser(response.data.user);
                setIsAuthenticated(true);
                // 迁移完成后删除旧存储
                localStorage.removeItem('auth_token');
              }
            } catch (legacyError) {
              console.error('验证旧令牌失败:', legacyError);
              localStorage.removeItem('auth_token');
            }
          }
        }
      } catch (error) {
        // 数据库错误或其他异常
        console.error('认证检查错误:', error);
        await db.clearAuth();
        localStorage.removeItem('auth_token'); // 清除旧存储
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
      
      // 将认证信息存入Dexie数据库
      await db.saveAuthToken(token, user);
      
      // 设置axios认证头
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
      
      // 处理旧版本兼容性 - 删除localStorage中的数据
      localStorage.removeItem('auth_token');
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      // 清除Dexie数据库中的认证数据
      await db.clearAuth();
      
      // 用于兼容旧版本
      localStorage.removeItem('auth_token');
      
      // 头像数据保留，方便下次登录
      // 不需要特意清除，因为头像数据缓存会被覆盖
      
      // 清除认证头
      delete axios.defaults.headers.common['Authorization'];
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('登出操作错误:', error);
      // 即使出错也要确保前端状态已清除
      setUser(null);
      setIsAuthenticated(false);
    }
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
