/**
 * 通知服务
 * 处理桌面通知的权限申请与发送
 */

// 检查浏览器是否支持通知
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// 请求通知权限
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('当前浏览器不支持通知功能');
    return false;
  }

  // 检查当前权限状态
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('用户已拒绝通知权限');
    return false;
  }

  // 请求权限
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('请求通知权限失败:', error);
    return false;
  }
};

// 发送通知
export const sendNotification = (
  title: string, 
  options: NotificationOptions = {}
): Notification | null => {
  if (!isNotificationSupported()) {
    console.warn('当前浏览器不支持通知功能');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('没有通知权限，无法发送通知');
    return null;
  }

  try {
    // 合并默认设置和传入的选项
    const defaultOptions: NotificationOptions = {
      icon: '/logo192.png', // 默认图标
      badge: '/badge.png'   // 默认徽章
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // 创建并返回通知实例
    const notification = new Notification(title, mergedOptions);
    
    // 添加点击事件
    if (options.data && options.data.url) {
      notification.onclick = () => {
        notification.close();
        window.focus();
        window.location.href = options.data.url;
      };
    }
    
    return notification;
  } catch (error) {
    console.error('发送通知失败:', error);
    return null;
  }
};

// 检查是否有单词学习记录并发送通知
export const checkAndSendWordLearningNotification = async (
  userId: string,
  wordsLearned: number
): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  
  const notificationsEnabled = localStorage.getItem(`notifications_enabled_${userId}`) === 'true';
  if (!notificationsEnabled) {
    return false;
  }
  
  // 检查上次通知时间
  const now = new Date();
  const lastNotificationTime = localStorage.getItem(`last_notification_time_${userId}`);
  
  // 如果今天已经发送过通知，则不再发送
  if (lastNotificationTime) {
    const lastTime = new Date(lastNotificationTime);
    if (
      lastTime.getDate() === now.getDate() && 
      lastTime.getMonth() === now.getMonth() && 
      lastTime.getFullYear() === now.getFullYear()
    ) {
      return false;
    }
  }
  
  // 只有当有学习记录时才发送通知
  if (wordsLearned > 0) {
    sendNotification('学习提醒', {
      body: `昨天您学习了${wordsLearned}个单词，快来复习一下吧！`,
      data: { url: '/wordbook' } // 点击通知跳转到单词本页面
    });
    
    // 记录通知时间
    localStorage.setItem(`last_notification_time_${userId}`, now.toISOString());
    return true;
  }
  
  return false;
};

// 检查当前时间是否在早上9点到12点之间
export const isTimeToNotify = (): boolean => {
  const now = new Date();
  return now.getHours() >= 9 && now.getHours() < 12;
};
