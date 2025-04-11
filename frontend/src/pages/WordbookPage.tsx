import React, { useState, useEffect } from 'react';
import { 
  List, 
  Card, 
  Typography, 
  Button, 
  Input, 
  Space, 
  Empty, 
  Spin,
  Modal, 
  Form,
  message,
  Statistic,
  Tag,
  Divider
} from 'antd';
import { 
  EditOutlined,
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  SoundOutlined,
  BookOutlined,
  CalendarOutlined,
  TranslationOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import IOSHeader from '../components/IOSHeader';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
// 导入API服务
import { wordbookAPI, ttsAPI, aiAPI } from '../services/api';

const { Text, Paragraph } = Typography;
const { Search } = Input;

const PageContainer = styled(motion.div)`
  padding: 20px;
  padding-top: 64px; /* 适应iOS顶栏高度 */
  padding-bottom: 100px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
  background-color: #f8faff;
  min-height: 100vh;
  position: relative;
  z-index: 1;
`;

const StatsContainer = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 16px;
  position: relative;
  z-index: 1;
  
  .ant-card {
    flex: 1;
    min-width: 140px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: none;
    background: white;
  }
  
  .ant-statistic {
    .ant-statistic-title {
      color: #666;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .ant-statistic-content {
      color: #4e7dd1;
      font-size: 24px;
      font-weight: 600;
    }
  }
`;

const StyledCard = styled(motion(Card))`
  margin-bottom: 8px;
  border-radius: 10px;
  border: 1px solid rgba(78, 125, 209, 0.1);
  box-shadow: 0 2px 4px rgba(78, 125, 209, 0.03);
  overflow: hidden;
  background: white;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(78, 125, 209, 0.06);
  }
  
  .ant-card-body {
    padding: 10px !important;
  }
`;

const WordItem = styled(List.Item)`
  padding: 8px !important;
  
  .ant-list-item-meta-title {
    margin-bottom: 3px;
  }
  
  .ant-list-item-meta-description {
    font-size: 12px;
    color: #666;
    line-height: 1.3;
  }
  
  .ant-list-item-action {
    margin-top: 6px;
  }
  
  .ant-list-item-action > li {
    padding: 0 4px;
  }
`;

// iOS风格添加按钮
const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  box-shadow: none;
  color: #4e7dd1; /* 应用主题色 */
  font-size: 24px;
  padding: 0;
  height: auto;
  width: auto;
  
  &:hover, &:focus {
    color: #6f9de3;
    background: none;
  }
`;


const SearchContainer = styled(motion.div)`
  margin: 20px 0 28px;
  width: 100%;
  position: relative;
`;

const StyledSearchInput = styled(Search)`
  .ant-input-affix-wrapper {
    border: none;
    border-radius: 12px;
    background-color: #f5f7fb;
    padding: 10px 12px;
    box-shadow: none;
    height: 44px;
    transition: all 0.3s ease;
    
    &:hover, &:focus {
      background-color: #f0f4fb;
    }
    
    .ant-input {
      background-color: transparent;
      color: #555;
      font-size: 15px;
      &::placeholder {
        color: #aab3c3;
      }
    }
    
    .ant-input-suffix {
      .anticon {
        color: #a0a9bb;
        font-size: 16px;
      }
    }
  }
  
  .ant-input-group-addon {
    display: none;
  }
`;


interface Word {
  id: string;
  word: string;
  kana: string;
  meaning: string;
  createdAt: string;
}

interface TranslateResult {
  word: string;
  kana: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
}

const WordbookPage: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateResult, setTranslateResult] = useState<TranslateResult | null>(null);
  const [form] = Form.useForm();

  // 获取单词列表
  const fetchWords = async () => {
    setLoading(true);
    try {
      const response = await wordbookAPI.getWords();
      setWords(response.data);
      setFilteredWords(response.data);
    } catch (error) {
      console.error('获取单词列表失败:', error);
      message.error('获取单词列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // 搜索单词
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value) {
      setFilteredWords(words);
      return;
    }
    
    const filtered = words.filter(
      word => 
        word.word.toLowerCase().includes(value.toLowerCase()) || 
        word.kana.toLowerCase().includes(value.toLowerCase()) || 
        word.meaning.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredWords(filtered);
  };

  // 删除单词
  const handleDelete = async (id: string) => {
    try {
      await wordbookAPI.deleteWord(id);
      message.success('单词已删除');
      fetchWords();
    } catch (error) {
      console.error('删除单词失败:', error);
      message.error('删除单词失败');
    }
  };

  // 编辑单词
  const handleEdit = (word: Word) => {
    setCurrentWord(word);
    form.setFieldsValue({
      word: word.word,
      kana: word.kana,
      meaning: word.meaning,
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async (values: any) => {
    if (!currentWord) return;
    
    try {
      await wordbookAPI.updateWord(currentWord.id, values);
      message.success('单词已更新');
      setEditModalVisible(false);
      fetchWords();
    } catch (error) {
      console.error('更新单词失败:', error);
      message.error('更新单词失败');
    }
  };

  // 添加新单词
  const handleAddNew = () => {
    form.resetFields();
    setTranslateResult(null);
    setAddModalVisible(true);
  };

  // 翻译单词 - 使用AI接口翻译单词并自动填充表单
  const handleTranslate = async () => {
    const word = form.getFieldValue('word');
    if (!word) {
      message.warning('请先输入单词');
      return;
    }
    
    setTranslating(true);
    try {
      const response = await aiAPI.translateJapaneseChinese(word);
      const data = response.data;
      let result;
      
      // 处理不同的数据格式可能性
      if (typeof data === 'string') {
        // 尝试解析JSON字符串
        try {
          result = JSON.parse(data);
        } catch (e) {
          // 如果不是有效的JSON，查找JSON部分并解析
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          }
        }
      } else if (data.choices && data.choices[0]?.message?.content) {
        // OpenAI格式响应
        const content = data.choices[0].message.content;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('解析AI响应失败:', e);
        }
      } else if (typeof data === 'object') {
        // 直接是对象
        result = data;
      }
      
      if (result && result.word) {
        setTranslateResult(result);
        // 自动填充表单
        form.setFieldsValue({
          word: result.word,
          kana: result.kana || '',
          meaning: result.meaning || ''
        });
        message.success('翻译成功');
      } else {
        message.error('无法解析翻译结果');
      }
    } catch (error) {
      console.error('翻译失败:', error);
      message.error('翻译失败，请稍后再试');
    } finally {
      setTranslating(false);
    }
  };

  // 保存新单词
  const handleSaveNew = async (values: any) => {
    try {
      await wordbookAPI.addWord(values);
      message.success('单词已添加');
      setAddModalVisible(false);
      setTranslateResult(null);
      fetchWords();
    } catch (error) {
      console.error('添加单词失败:', error);
      message.error('添加单词失败');
    }
  };

  // 播放单词发音
  const playWordSound = async (word: string) => {
    try {
      const response = await ttsAPI.speak(word);
      
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('播放发音失败:', error);
      message.error('播放发音失败');
    }
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <IOSHeader
        title="单词本"
        titleColor="#000"
        backgroundColor="rgba(255, 255, 255, 0.92)"
        leftContent={<BookOutlined style={{ fontSize: 18, color: '#4e7dd1' }} />}
        rightContent={
          <AddButton
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
          />
        }
      />
      
      <StatsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25 }}
      >
        <Card>
          <Statistic title="已学单词" value={words.length} />
        </Card>
        <Card>
          <Statistic title="今日新增" value={words.filter(w => new Date(w.createdAt).toDateString() === new Date().toDateString()).length} prefix={<CalendarOutlined />} />
        </Card>
      </StatsContainer>
      
      <SearchContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
      >
        <StyledSearchInput
          placeholder="搜索单词、假名或意思"
          allowClear
          size="large"
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          value={searchText}
          prefix={<SearchOutlined style={{ marginRight: 8, color: '#a0a9bb' }} />}
        />
      </SearchContainer>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : filteredWords.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              <List
                dataSource={filteredWords}
                renderItem={(word, index) => (
                  <StyledCard 
                    key={word.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index, duration: 0.25, type: 'spring', stiffness: 400, damping: 18 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <WordItem>
                      <div style={{ width: '100%' }}>
                        {/* 头部: 日期和日语单词假名 */}
                        <div style={{position: 'relative', marginBottom: 6}}>
                          {/* 语音按钮放在右上角 */}
                          <div style={{ 
                            position: 'absolute',
                            top: '50%',
                            right: 0,
                            transform: 'translateY(-50%)',
                            zIndex: 1
                          }}>
                            <Button
                              type="primary"
                              shape="circle"
                              icon={<SoundOutlined />}
                              onClick={() => playWordSound(word.word)}
                              style={{ 
                                background: '#4e7dd1', 
                                borderColor: '#4e7dd1',
                                boxShadow: '0 1px 3px rgba(78, 125, 209, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                fontSize: '12px'
                              }}
                              size="small"
                            />
                          </div>
                          
                          {/* 日语单词和假名在同一行 */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            paddingRight: 42, // 为播放按钮腾出空间
                            marginBottom: 2,
                            marginTop: 2,
                            position: 'relative',
                            minHeight: 30
                          }}>
                            <Text strong style={{ 
                              fontSize: 18, 
                              color: '#4e7dd1',
                              fontWeight: 600,
                              marginRight: 8,
                              lineHeight: 1.3
                            }}>
                              {word.word}
                            </Text>
                            <Tag 
                              style={{ 
                                borderRadius: 4,
                                padding: '0px 6px',
                                background: 'rgba(78, 125, 209, 0.08)',
                                border: 'none',
                                color: '#4e7dd1',
                                fontSize: 12,
                                height: 20,
                                lineHeight: '20px'
                              }}
                            >
                              {word.kana}
                            </Tag>
                          </div>
                        </div>
                        
                        {/* 分隔线 */}
                        <Divider style={{ margin: '4px 0', background: 'rgba(78, 125, 209, 0.05)' }} />
                        
                        {/* 意思部分 */}
                        <Paragraph style={{ 
                          margin: '6px 0', 
                          color: '#333',
                          fontSize: 13,
                          lineHeight: 1.3
                        }}>
                          {word.meaning}
                        </Paragraph>
                        
                        {/* 操作按钮区 */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginTop: 6,
                          alignItems: 'center'
                        }}>
                          {/* 日期放在左侧 */}
                          <Text type="secondary" style={{ 
                            fontSize: 11,
                            color: '#999'
                          }}>
                            <CalendarOutlined style={{ marginRight: 3 }} />
                            {new Date(word.createdAt).toLocaleDateString()}
                          </Text>
                          
                          {/* 编辑和删除按钮放在右侧 */}
                          <div>
                            <Button 
                              type="text" 
                              icon={<EditOutlined />}
                              style={{ 
                                color: '#4e7dd1', 
                                padding: '4px 8px',
                                marginRight: 4,
                                height: 'auto'
                              }} 
                              onClick={() => handleEdit(word)}
                              size="small"
                            />
                            <Button 
                              type="text" 
                              danger
                              icon={<DeleteOutlined />}
                              style={{ 
                                padding: '4px 8px',
                                height: 'auto'
                              }}
                              onClick={() => handleDelete(word.id)}
                              size="small"
                            />
                          </div>
                        </div>
                      </div>
                    </WordItem>
                  </StyledCard>
                )}
              />
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60 }}
          >
            <Empty
              description={
                <Text style={{ fontSize: 16, color: '#666' }}>
                  {searchText 
                    ? "没有找到匹配的单词" 
                    : "你的单词本还是空的，开始添加一些单词吧！"}
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            {!searchText && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddNew}
                style={{ marginTop: 20, borderRadius: 8, height: 40 }}
              >
                添加第一个单词
              </Button>
            )}
          </motion.div>
        )}
      </Space>
      
      <motion.div 
        style={{ position: 'fixed', right: 20, bottom: 100, zIndex: 1000 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined style={{ fontSize: 24 }} />}
          size="large"
          onClick={handleAddNew}
          style={{ 
            boxShadow: '0 4px 12px rgba(78, 125, 209, 0.3)', 
            width: '60px', 
            height: '60px',
            background: 'linear-gradient(135deg, #4e7dd1 0%, #6f9de3 100%)',
            border: 'none'
          }}
        />
      </motion.div>
      
      {/* 编辑单词弹窗 */}
      <Modal
        title="编辑单词"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        centered
        width={400}
        styles={{ 
          header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 },
          body: { padding: '24px 20px' },
          footer: { borderTop: '1px solid #f0f0f0', padding: '16px 20px' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
        >
          <Form.Item
            name="word"
            label="单词"
            rules={[{ required: true, message: '请输入单词' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="kana"
            label="假名"
            rules={[{ required: true, message: '请输入假名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="meaning"
            label="意思"
            rules={[{ required: true, message: '请输入意思' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => setEditModalVisible(false)} style={{ borderRadius: 8 }}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{ borderRadius: 8, background: '#4e7dd1', borderColor: '#4e7dd1' }}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 添加单词弹窗 */}
      <Modal
        title="添加单词"
        open={addModalVisible}
        onCancel={() => { setAddModalVisible(false); setTranslateResult(null); }}
        footer={null}
        centered
        width={500}
        styles={{ 
          header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 },
          body: { padding: '24px 20px' },
          footer: { borderTop: '1px solid #f0f0f0', padding: '16px 20px' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveNew}
        >
          <div style={{ display: 'flex', marginBottom: 16 }}>
            <Form.Item
              name="word"
              label="单词"
              rules={[{ required: true, message: '请输入单词' }]}
              style={{ flex: 1, marginBottom: 0, marginRight: 8 }}
            >
              <Input placeholder="输入日语单词" />
            </Form.Item>
            <Button 
              onClick={handleTranslate} 
              icon={translating ? <LoadingOutlined /> : <TranslationOutlined />}
              style={{ marginTop: 29, height: 32, borderRadius: 6, background: '#4e7dd1', borderColor: '#4e7dd1', color: 'white' }}
              disabled={translating}
            >
              {translating ? '翻译中' : 'AI翻译'}
            </Button>
          </div>
          
          {translateResult && (
            <div style={{ background: '#f8f9fe', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Typography.Title level={5} style={{ margin: '0 0 12px 0', color: '#4e7dd1' }}>
                翻译结果
              </Typography.Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <Typography.Text strong>单词：</Typography.Text>
                  <Typography.Text>{translateResult.word}</Typography.Text>
                </div>
                <div>
                  <Typography.Text strong>假名：</Typography.Text>
                  <Typography.Text>{translateResult.kana}</Typography.Text>
                </div>
                <div>
                  <Typography.Text strong>含义：</Typography.Text>
                  <Typography.Text>{translateResult.meaning}</Typography.Text>
                </div>
                {translateResult.example && (
                  <div>
                    <Typography.Text strong>例句：</Typography.Text>
                    <Typography.Text>{translateResult.example}</Typography.Text>
                  </div>
                )}
                {translateResult.exampleMeaning && (
                  <div>
                    <Typography.Text strong>例句翻译：</Typography.Text>
                    <Typography.Text>{translateResult.exampleMeaning}</Typography.Text>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <Form.Item
            name="kana"
            label="假名"
            rules={[{ required: true, message: '请输入假名' }]}
          >
            <Input placeholder="单词的假名读音" />
          </Form.Item>
          <Form.Item
            name="meaning"
            label="意思"
            rules={[{ required: true, message: '请输入意思' }]}
          >
            <Input placeholder="单词的中文意思" />
          </Form.Item>
          <Divider style={{ margin: '4px 0 20px' }} />
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={() => { setAddModalVisible(false); setTranslateResult(null); }} style={{ borderRadius: 6 }}>
                取消
              </Button>
              <Button   
                type="primary" 
                htmlType="submit"
                style={{ borderRadius: 6, background: '#4e7dd1', borderColor: '#4e7dd1' }}
              >
                保存单词
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default WordbookPage;
