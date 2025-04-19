import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * 用于在单词本页面更新单词统计信息的hook
 * @param wordCount 当前单词数量
 */
export const useWordNotification = (wordCount: number) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || wordCount === undefined) return;

    // 保存当前单词数量
    localStorage.setItem(`current_word_count_${user.uid}`, wordCount.toString());

    // 如果是首次加载，也设置前一天的计数
    const prevCount = localStorage.getItem(`prev_word_count_${user.uid}`);
    if (!prevCount) {
      localStorage.setItem(`prev_word_count_${user.uid}`, wordCount.toString());
    }
  }, [user, wordCount]);
};
