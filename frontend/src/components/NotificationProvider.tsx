import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkAndSendWordLearningNotification, isTimeToNotify } from '../utils/notificationService';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  // 检查是否需要发送通知
  const checkNotifications = async () => {
    if (!user || checked) return;
    
    // 检查当前时间是否为早上9点附近
    if (!isTimeToNotify()) return;

    try {
      // 获取昨天学习的单词数量
      const lastWordCount = parseInt(localStorage.getItem(`prev_word_count_${user.uid}`) || '0');
      const currentWordCount = parseInt(localStorage.getItem(`current_word_count_${user.uid}`) || '0');
      
      // 计算昨天学习的单词数量
      const wordsLearned = currentWordCount - lastWordCount;
      
      // 发送通知
      await checkAndSendWordLearningNotification(user.uid, wordsLearned);
      
      // 更新上次检查的单词数量
      localStorage.setItem(`prev_word_count_${user.uid}`, currentWordCount.toString());
      
      // 标记为已检查，避免重复检查
      setChecked(true);
    } catch (error) {
      console.error('检查通知失败:', error);
    }
  };

  // 定期检查通知
  useEffect(() => {
    if (!user) return;
    
    // 立即检查一次
    checkNotifications();
    
    // 每30分钟检查一次，以确保在9点时能发送通知
    const intervalId = setInterval(checkNotifications, 30 * 60 * 1000);
    
    // 清理函数
    return () => clearInterval(intervalId);
  }, [user, checked]);

  // 每天重置检查状态
  useEffect(() => {
    if (!user) return;
    
    // 在午夜重置检查状态
    const resetCheckedStatus = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        setChecked(false);
      }
    };
    
    const intervalId = setInterval(resetCheckedStatus, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  return <>{children}</>;
};

export default NotificationProvider;
