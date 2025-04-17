import Dexie from 'dexie';

// 定义数据库架构版本和表结构
export class ShiruPicDB extends Dexie {
  authData: Dexie.Table<IAuthData, string>;
  avatarCache: Dexie.Table<IAvatarCache, string>;
  imageCache: Dexie.Table<IImageCache, string>;
  wordBook: Dexie.Table<IWordItem, string>;
  history: Dexie.Table<IHistoryItem, string>;
  audioCache: Dexie.Table<IAudioCache, string>;
  offlineSettings: Dexie.Table<IOfflineSettings, string>;
  
  constructor() {
    super('ShiruPicDatabase');
    
    // 定义数据库架构
    this.version(3).stores({
      authData: 'id,token,timestamp',
      avatarCache: 'id,data,timestamp',
      imageCache: 'url,data,timestamp',
      wordBook: 'id,word,kana,meaning,timestamp',
      history: 'id,imageUrl,sentence,translatedSentence,timestamp',
      audioCache: 'text,data,timestamp',
      offlineSettings: 'id,isOfflineMode'
    });
    
    // 定义类型
    this.authData = this.table('authData');
    this.avatarCache = this.table('avatarCache');
    this.imageCache = this.table('imageCache');
    this.wordBook = this.table('wordBook');
    this.history = this.table('history');
    this.audioCache = this.table('audioCache');
    this.offlineSettings = this.table('offlineSettings');
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

export interface IImageCache {
  url: string;       // 图片URL作为主键
  data: string;      // base64格式的图片数据
  timestamp: number;  // 缓存时间戳
}

export interface IWordItem {
  id: string;        // 单词ID
  word: string;      // 日语单词
  kana: string;      // 假名
  meaning: string;   // 中文含义
  timestamp: number; // 创建或更新时间戳
}

export interface IHistoryItem {
  id: string;               // 历史记录ID
  imageUrl: string;        // 图片URL
  imageData?: string;      // 图片数据(base64格式)
  sentence: string;        // 原始日语句子
  translatedSentence: string; // 翻译后的中文句子
  wordCount?: number;      // 单词数量
  timestamp: number;       // 创建时间戳
  words?: any[];           // 单词数组，包含标注信息
  createdAt?: string;      // ISO格式的创建时间字符串
  created_at?: string;     // API返回的创建时间字段（兼容性）
}

export interface IAudioCache {
  text: string;       // 要发音的文本
  data: string;      // 音频数据(base64格式)
  timestamp: number; // 缓存时间戳
}

export interface IOfflineSettings {
  id: string;          // 设置ID，固定为'settings'
  isOfflineMode?: boolean; // 是否启用离线模式(已不再使用，保留为兼容旧数据)
  lastSyncTime?: number; // 上次同步时间
}

// 缓存图片
export async function cacheImage(url: string, base64Data: string): Promise<void> {
  try {
    await db.imageCache.put({
      url,
      data: base64Data,
      timestamp: Date.now()
    });
    console.log('图片已缓存:', url);
  } catch (error) {
    console.error('缓存图片错误:', error);
  }
}

// 获取缓存图片
export async function getCachedImage(url: string): Promise<string | null> {
  try {
    const cachedImage = await db.imageCache.get(url);
    if (cachedImage) {
      return cachedImage.data;
    }
    return null;
  } catch (error) {
    console.error('获取缓存图片错误:', error);
    return null;
  }
}

// 离线模式相关方法
import { isOnline } from './network';

// 获取当前是否处于离线模式
export async function getOfflineMode(): Promise<boolean> {
  // 直接使用网络状态检测结果，返回反值（即离线状态）
  return !isOnline();
}

// 记录最后同步时间
export async function updateLastSyncTime(): Promise<void> {
  try {
    await db.offlineSettings.put({
      id: 'settings',
      lastSyncTime: Date.now()
    });
  } catch (error) {
    console.error('更新最后同步时间失败:', error);
  }
}

// 获取最后同步时间
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const settings = await db.offlineSettings.get('settings');
    return settings?.lastSyncTime || null;
  } catch (error) {
    console.error('获取最后同步时间失败:', error);
    return null;
  }
}

// 单词本离线数据管理
export async function saveWordToLocal(word: IWordItem): Promise<string> {
  try {
    if (!word.id) {
      word.id = Date.now().toString();
    }
    
    // 确保单词有一个有效的时间戳
    if (!word.timestamp) {
      word.timestamp = Date.now();
    }
    
    await db.wordBook.put(word);
    console.log('单词已保存到本地数据库:', word.word);
    return word.id;
  } catch (error) {
    console.error('保存单词到本地失败:', error);
    throw error;
  }
}

export async function getLocalWords(): Promise<IWordItem[]> {
  try {
    // 按时间戳倒序排列，确保最新添加的单词在前面
    return await db.wordBook.toArray()
      .then(words => words.sort((a, b) => {
        // 使用 timestamp 进行排序，如果不存在则使用 0
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA; // 倒序排列，最新的在前面
      }));
  } catch (error) {
    console.error('获取本地单词失败:', error);
    return [];
  }
}

export async function deleteLocalWord(id: string): Promise<void> {
  try {
    await db.wordBook.delete(id);
    console.log('本地单词已删除:', id);
  } catch (error) {
    console.error('删除本地单词失败:', error);
    throw error;
  }
}

// 历史记录离线数据管理
export async function saveHistoryToLocal(history: IHistoryItem): Promise<string> {
  try {
    if (!history.id) {
      history.id = Date.now().toString();
    }
    
    // 如果没有时间戳，尝试从 createdAt 或 created_at 提取
    if (!history.timestamp) {
      if (history.createdAt) {
        // 如果提供了 ISO 格式的字符串时间
        history.timestamp = new Date(history.createdAt).getTime();
      } else if (history.created_at) {
        // 兼容不同的字段名
        history.timestamp = new Date(history.created_at).getTime();
      } else {
        // 如果都没有提供，才使用当前时间
        history.timestamp = Date.now();
      }
    }
    
    await db.history.put(history);
    console.log('历史记录已保存到本地数据库');
    return history.id;
  } catch (error) {
    console.error('保存历史记录到本地失败:', error);
    throw error;
  }
}

export async function getLocalHistory(): Promise<IHistoryItem[]> {
  try {
    // 获取历史记录并按时间戳倒序排列，最新的在前面
    return await db.history.toArray()
      .then(items => items.sort((a, b) => {
        // 使用 timestamp 进行排序
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA; // 倒序排列
      }));
  } catch (error) {
    console.error('获取本地历史记录失败:', error);
    return [];
  }
}

export async function deleteLocalHistory(id: string): Promise<void> {
  try {
    await db.history.delete(id);
    console.log('本地历史记录已删除:', id);
  } catch (error) {
    console.error('删除本地历史记录失败:', error);
    throw error;
  }
}

// 音频缓存相关方法
export async function cacheAudio(text: string, audioData: string): Promise<void> {
  try {
    await db.audioCache.put({
      text,
      data: audioData,
      timestamp: Date.now()
    });
    console.log('音频已缓存:', text);
  } catch (error) {
    console.error('缓存音频失败:', error);
  }
}

export async function getCachedAudio(text: string): Promise<string | null> {
  try {
    const cachedAudio = await db.audioCache.get(text);
    if (cachedAudio) {
      return cachedAudio.data;
    }
    return null;
  } catch (error) {
    console.error('获取缓存音频失败:', error);
    return null;
  }
}

// 创建单例数据库实例
const db = new ShiruPicDB();
export default db;
