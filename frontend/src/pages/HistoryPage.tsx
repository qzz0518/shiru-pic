import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  Typography, 
  Button, 
  Empty, 
  Spin,
  message,
  Tooltip
} from 'antd';
import IOSHeader from '../components/IOSHeader';
import Masonry from 'react-masonry-css';
import { 
  ArrowLeftOutlined, 
  DeleteOutlined,
  TranslationOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
// 导入API服务和数据库工具
import { historyAPI } from '../services/api';
import { cacheImage, getCachedImage, getLocalHistory, saveHistoryToLocal, deleteLocalHistory } from '../utils/db';
import { isOnline } from '../utils/network';

const { Text, Paragraph } = Typography;

const PageContainer = styled.div`
  padding: 16px;
  padding-top: 64px; /* 适应iOS顶栏高度 */
  padding-bottom: 80px;
  background-color: #f9fafc;
  min-height: 100vh;
  
  .masonry-grid {
    display: flex;
    width: auto;
    margin-left: -16px; /* 补偿列间距的负边距技巧 */
  }
  
  .masonry-grid_column {
    padding-left: 16px; /* 列间距 */
    background-clip: padding-box;
  }
`;

// 移除未使用的Header和BackButton组件

const ImageCard = styled(motion.div)`
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: transparent;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  }
`;

const CardContent = styled.div`
  padding: 12px;
  background-color: white;
  border-radius: 0 0 12px 12px;
`;

const StyledImage = styled(Image)`
  width: 100%;
  object-fit: cover;
  display: block;
  border-radius: 12px 12px 0 0;
`;

// 将图片URL转换为base64
const convertImageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous'; // 解决跨域问题
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg');
      resolve(dataURL);
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败: ' + url));
    };
    
    img.src = url;
  });
};

const WordCountBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(78, 125, 209, 0.9);
  color: white;
  border-radius: 16px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(2px);
`;

// 移除未使用的DeleteButton组件，因为我们直接在行内样式中定义了按钮样式

interface HistoryItem {
  id: string;
  imageUrl: string;
  image_url?: string;
  sentence: string;
  sentence_japanese?: string;
  translated_sentence?: string;
  translatedSentence?: string;
  sentence_chinese?: string;
  createdAt: string;
  created_at?: string;
  wordCount?: number;
  word_count?: number;
  imageData?: string;  // 用于离线模式下存储图片数据
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cachedUrls = useRef<Map<string, string>>(new Map()); // 存储URL到缓存图片的映射

  // 获取历史记录
  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 检查网络状态
      const networkOffline = !isOnline();
      
      let adaptedItems = [];
      
      if (networkOffline) {
        // 离线模式：从本地数据库获取历史记录
        const localHistory = await getLocalHistory();
        adaptedItems = localHistory.map((item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          sentence: item.sentence,
          translatedSentence: item.translatedSentence,
          createdAt: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
          wordCount: item.wordCount || 0,
          imageData: item.imageData // 离线模式下可能直接包含图片数据
        }));
        console.log('离线模式：已加载本地历史记录数据', adaptedItems.length);
      } else {
        // 在线模式：从服务器获取历史记录
        const response = await historyAPI.getHistory();
        // 数据适配，匹配字段名称
        adaptedItems = response.data.map((item: any) => ({
          id: item.id,
          imageUrl: item.image_url || item.imageUrl,
          sentence: item.sentence_japanese || item.sentence,
          translatedSentence: item.sentence_chinese || item.translated_sentence || item.translatedSentence,
          createdAt: item.created_at || item.createdAt,
          wordCount: item.word_count || item.wordCount || 0
        }));
        
        // 将在线数据保存到本地供离线使用
        try {
          for (const item of adaptedItems) {
            // 尝试获取图片缓存，如果已有则保存到本地历史记录
            let imageData = null;
            if (item.imageUrl) {
              imageData = await getCachedImage(item.imageUrl);
            }
            
            // 根据原始创建时间解析时间戳
            let timestamp;
            if (item.createdAt) {
              timestamp = new Date(item.createdAt).getTime();
            } else if (item.created_at) {
              timestamp = new Date(item.created_at).getTime();
            } else {
              // 如果没有时间信息，才使用当前时间
              timestamp = Date.now();
            }
            
            // 保存到本地历史记录
            await saveHistoryToLocal({
              id: item.id,
              imageUrl: item.imageUrl,
              imageData: imageData || undefined, // 如果有缓存则保存图片数据
              sentence: item.sentence,
              translatedSentence: item.translatedSentence,
              wordCount: item.wordCount,
              timestamp: timestamp,
              // 只保存一个创建时间字段，统一使用 createdAt
              createdAt: item.createdAt || item.created_at
            });
          }
          console.log('历史记录已同步到本地数据库');
        } catch (e) {
          console.error('保存历史记录到本地失败:', e);
        }
      }
      
      // 检查每个图片是否有缓存
      for (const item of adaptedItems) {
        // 如果离线模式下直接有图片数据，则使用该数据
        if (item.imageData) {
          cachedUrls.current.set(item.imageUrl, item.imageData);
          console.log('使用离线存储的图片数据:', item.imageUrl);
          continue;
        }
        
        // 否则检查缓存
        if (item.imageUrl) {
          const cachedData = await getCachedImage(item.imageUrl);
          if (cachedData) {
            cachedUrls.current.set(item.imageUrl, cachedData);
            console.log('使用缓存图片:', item.imageUrl);
          }
        }
      }
      
      setHistoryItems(adaptedItems);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      message.error('获取历史记录失败');
      
      // 尝试从本地加载作为备份方案
      try {
        const localHistory = await getLocalHistory();
        if (localHistory.length > 0) {
          const adaptedItems = localHistory.map((item) => {
            // 优先使用原始保存的创建时间，避免所有记录显示相同时间
            let itemCreatedAt;
            if (item.createdAt) {
              // 如果有原始保存的 createdAt，直接使用
              itemCreatedAt = item.createdAt;
            } else if (item.created_at) {
              // 如果有原始保存的 created_at，直接使用
              itemCreatedAt = item.created_at;
            } else if (item.timestamp) {
              // 如果有时间戳，转换为 ISO 字符串
              itemCreatedAt = new Date(item.timestamp).toISOString();
            } else {
              // 最后才使用当前时间
              itemCreatedAt = new Date().toISOString();
            }
            
            return {
              id: item.id,
              imageUrl: item.imageUrl,
              sentence: item.sentence,
              translatedSentence: item.translatedSentence,
              createdAt: itemCreatedAt,
              wordCount: item.wordCount || 0,
              imageData: item.imageData,
              words: item.words || [] // 确保单词数组也被加载
            };
          });
          
          // 处理图片缓存
          for (const item of adaptedItems) {
            if (item.imageData) {
              cachedUrls.current.set(item.imageUrl, item.imageData);
            }
          }
          
          setHistoryItems(adaptedItems);
          message.info('已从本地数据加载历史记录');
        }
      } catch (e) {
        console.error('从本地数据库加载历史记录失败:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 删除历史记录
  const handleDelete = async (id: string) => {
    try {
      // 检查网络状态
      const networkOffline = !isOnline();
      
      if (networkOffline) {
        // 离线模式：仅从本地数据库删除
        await deleteLocalHistory(id);
        message.success('记录已从本地移除');
        setHistoryItems(historyItems.filter(item => item.id !== id));
      } else {
        // 在线模式：从服务器和本地都删除
        await historyAPI.deleteHistoryItem(id);
        // 同时从本地数据库删除
        try {
          await deleteLocalHistory(id);
        } catch (e) {
          console.error('从本地数据库删除历史记录失败:', e);
        }
        message.success('记录已删除');
        setHistoryItems(historyItems.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      message.error('删除记录失败');
      
      // 如果在线删除失败，尝试从本地删除
      try {
        await deleteLocalHistory(id);
        message.warning('已从本地移除记录，但服务器同步失败');
        setHistoryItems(historyItems.filter(item => item.id !== id));
      } catch (e) {
        console.error('备用方案从本地删除失败:', e);
      }
    }
  };

  // 查看历史记录详情
  const handleViewDetails = async (item: HistoryItem) => {
    try {
      setLoading(true);
      
      // 检查网络状态
      const networkOffline = !isOnline();
      let detailData: any = null;
      
      if (networkOffline) {
        // 离线模式：从本地数据获取详细信息
        console.log('离线模式：从本地获取历史记录详情');
        
        // 从本地历史记录获取数据
        try {
          const localHistory = await getLocalHistory();
          const localItem = localHistory.find(h => h.id === item.id);
          
          if (localItem) {
            detailData = {
              id: localItem.id,
              image_url: localItem.imageUrl,
              sentence_japanese: localItem.sentence,
              sentence_chinese: localItem.translatedSentence,
              word_count: localItem.wordCount,
              // 使用已存储的图片数据
              cachedImageData: localItem.imageData,
              // 单词数组及标注
              words: localItem.words || []
            };
          } else {
            // 如果本地没有找到，则使用当前条目数据
            detailData = {
              id: item.id,
              image_url: item.imageUrl,
              sentence_japanese: item.sentence,
              sentence_chinese: item.translatedSentence,
              word_count: item.wordCount,
              words: [] // 空单词数组，因为当前项没有单词标注数据
            };
            
            // 如果有图片缓存，添加缓存的图片数据
            if (item.imageUrl && cachedUrls.current.has(item.imageUrl)) {
              detailData.cachedImageData = cachedUrls.current.get(item.imageUrl);
            } else if (item.imageData) {
              detailData.cachedImageData = item.imageData;
            }
          }
          
          if (!detailData.cachedImageData) {
            // 如果未找到缓存图片，尝试从缓存URL列表中查找
            const imageUrl = detailData.image_url;
            if (imageUrl && cachedUrls.current.has(imageUrl)) {
              detailData.cachedImageData = cachedUrls.current.get(imageUrl);
              console.log('离线模式：使用缓存图片数据');
            }
          }
        } catch (e) {
          console.error('获取本地历史记录详情失败:', e);
          message.warning('离线模式下无法获取完整详情');
          
          // 使用当前条目作为备用
          detailData = {
            id: item.id,
            image_url: item.imageUrl,
            sentence_japanese: item.sentence,
            sentence_chinese: item.translatedSentence,
            word_count: item.wordCount,
            words: [] // 空单词数组，备用方案
          };
          
          // 如果有图片缓存，使用缓存的图片
          if (item.imageUrl && cachedUrls.current.has(item.imageUrl)) {
            detailData.cachedImageData = cachedUrls.current.get(item.imageUrl);
          }
        }
      } else {
        // 在线模式：从服务器获取详细历史记录
        try {
          const response = await historyAPI.getHistoryItem(item.id);
          detailData = response.data;
          
          // 检查是否有缓存的图片
          const imageUrl = detailData.image_url || detailData.imageUrl;
          if (imageUrl && cachedUrls.current.has(imageUrl)) {
            // 如果有缓存图片，使用缓存的base64数据
            console.log('详情页使用缓存图片:', imageUrl);
            // 添加缓存的图片数据到详情数据中
            detailData.cachedImageData = cachedUrls.current.get(imageUrl);
          }
          
          // 将详情数据保存到本地，以便离线时使用
          try {
            await saveHistoryToLocal({
              id: detailData.id,
              imageUrl: detailData.image_url || detailData.imageUrl,
              imageData: detailData.cachedImageData || undefined,
              sentence: detailData.sentence_japanese || detailData.sentence,
              translatedSentence: detailData.sentence_chinese || detailData.translatedSentence,
              wordCount: detailData.word_count || detailData.wordCount || 0,
              timestamp: Date.now(),
              // 保存单词数组数据，使离线模式下也能显示标注
              words: detailData.words || []
            });
          } catch (e) {
            console.error('将历史记录详情保存到本地失败:', e);
          }
        } catch (e) {
          console.error('从服务器获取历史记录详情失败:', e);
          message.error('无法获取详情数据');
          setLoading(false);
          return; // 失败则退出
        }
      }
      
      // 导航到首页并携带历史数据
      navigate('/app', { 
        state: { 
          historyItem: detailData,
          from: 'history'
        } 
      });
    } catch (error) {
      console.error('加载历史记录详情失败:', error);
      message.error('加载历史记录详情失败');
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <PageContainer>
      <IOSHeader
        title=""
        titleColor="#000"
        backgroundColor="rgba(255, 255, 255, 0.92)"
        leftContent={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
              style={{ marginRight: 8, padding: 0 }}
              onClick={() => navigate('/app')}
            />
            <span style={{ fontSize: 17, fontWeight: 600 }}>历史记录</span>
          </div>
        }
      />
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : historyItems.length > 0 ? (
        <Masonry
          breakpointCols={{
            default: 4,
            1200: 3,
            992: 3,
            768: 2,
            576: 2
          }}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
          style={{ marginTop: 16 }}
        >
          {historyItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ImageCard onClick={() => handleViewDetails(item)}>
                  <StyledImage
                    src={cachedUrls.current.get(item.imageUrl) || item.imageUrl}
                    alt="历史图片"
                    preview={false}
                    onLoad={() => {
                      // 如果这个图片URL还没有缓存，就缓存它
                      if (item.imageUrl && !cachedUrls.current.has(item.imageUrl)) {
                        // 使用URL转换为base64
                        convertImageToBase64(item.imageUrl)
                          .then(base64Data => {
                            // 存入缓存
                            cacheImage(item.imageUrl, base64Data);
                            // 更新当前的缓存映射
                            cachedUrls.current.set(item.imageUrl, base64Data);
                          })
                          .catch(err => console.error('缓存图片失败:', err));
                      }
                    }}
                  />
                  
                  <WordCountBadge>
                    <TranslationOutlined />
                    {item.wordCount || 0}个单词
                  </WordCountBadge>
                  
                  <CardContent>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>
                      {item.sentence}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </CardContent>
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 2
                  }}>
                    <Tooltip title="删除记录">
                      <Button
                        type="text"
                        danger
                        size="small"
                        shape="circle"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        style={{
                          opacity: 0.7,
                          transition: 'opacity 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                      />
                    </Tooltip>
                  </div>
                </ImageCard>
            </motion.div>
          ))}
        </Masonry>
      ) : (
        <Empty
          description="暂无历史记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '40px 0' }}
        />
      )}
    </PageContainer>
  );
};

export default HistoryPage;
