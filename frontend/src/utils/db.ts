import Dexie from 'dexie';

// 定义数据库架构版本和表结构
export class ShiruPicDB extends Dexie {
  authData: Dexie.Table<IAuthData, string>;
  avatarCache: Dexie.Table<IAvatarCache, string>;
  
  constructor() {
    super('ShiruPicDatabase');
    
    // 定义数据库架构
    this.version(1).stores({
      authData: 'id,token,timestamp',
      avatarCache: 'id,data,timestamp'
    });
    
    // 定义类型
    this.authData = this.table('authData');
    this.avatarCache = this.table('avatarCache');
  }
  
  // 保存认证Token
  async saveAuthToken(token: string, userData: any): Promise<void> {
    try {
      await this.authData.put({
        id: 'current',
        token,
        userData,
        timestamp: Date.now()
      });
      console.log('认证令牌已保存到 Dexie 数据库');
    } catch (error) {
      console.error('Dexie 保存认证令牌错误:', error);
      throw error;
    }
  }
  
  // 获取认证Token
  async getAuthToken(): Promise<{ token: string; userData: any } | null> {
    try {
      const authData = await this.authData.get('current');
      
      if (!authData) {
        return null;
      }
      
      // 检查令牌是否过期（7天）
      const now = Date.now();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      
      if (now - authData.timestamp > SEVEN_DAYS) {
        console.log('令牌已过期，需要重新登录');
        await this.authData.delete('current');
        return null;
      }
      
      return {
        token: authData.token,
        userData: authData.userData
      };
    } catch (error) {
      console.error('Dexie 获取认证令牌错误:', error);
      return null;
    }
  }
  
  // 清除认证数据
  async clearAuth(): Promise<void> {
    try {
      await this.authData.delete('current');
      console.log('认证数据已从 Dexie 清除');
    } catch (error) {
      console.error('Dexie 清除认证数据错误:', error);
    }
  }
  
  // 缓存头像数据
  async cacheAvatar(base64Data: string): Promise<void> {
    try {
      await this.avatarCache.put({
        id: 'userAvatar',
        data: base64Data,
        timestamp: Date.now()
      });
      console.log('头像数据已缓存到 Dexie 数据库');
    } catch (error) {
      console.error('Dexie 缓存头像错误:', error);
    }
  }
  
  // 获取缓存的头像
  async getCachedAvatar(): Promise<string | null> {
    try {
      const avatarData = await this.avatarCache.get('userAvatar');
      
      if (!avatarData) {
        return null;
      }
      
      return avatarData.data;
    } catch (error) {
      console.error('Dexie 获取缓存头像错误:', error);
      return null;
    }
  }
}

// 接口定义
export interface IAuthData {
  id: string;
  token: string;
  userData: any;
  timestamp: number;
}

export interface IAvatarCache {
  id: string;
  data: string;
  timestamp: number;
}

// 创建单例数据库实例
const db = new ShiruPicDB();
export default db;
