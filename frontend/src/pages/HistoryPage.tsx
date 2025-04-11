import React, { useState, useEffect } from 'react';
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
// 导入API服务
import { historyAPI } from '../services/api';

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
}

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取历史记录
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await historyAPI.getHistory();
      // 数据适配，匹配字段名称
      const adaptedItems = response.data.map((item: any) => ({
        id: item.id,
        imageUrl: item.image_url || item.imageUrl,
        sentence: item.sentence_japanese || item.sentence,
        translatedSentence: item.sentence_chinese || item.translated_sentence || item.translatedSentence,
        createdAt: item.created_at || item.createdAt,
        wordCount: item.word_count || item.wordCount || 0
      }));
      setHistoryItems(adaptedItems);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      message.error('获取历史记录失败');
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
      await historyAPI.deleteHistoryItem(id);
      message.success('记录已删除');
      setHistoryItems(historyItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('删除记录失败:', error);
      message.error('删除记录失败');
    }
  };

  // 查看历史记录详情
  const handleViewDetails = async (item: HistoryItem) => {
    try {
      setLoading(true);
      // 获取详细历史记录
      const response = await historyAPI.getHistoryItem(item.id);
      // 导航到首页并携带历史数据
      navigate('/app', { 
        state: { 
          historyItem: response.data,
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
                    src={item.imageUrl}
                    alt="历史图片"
                    preview={false}
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
