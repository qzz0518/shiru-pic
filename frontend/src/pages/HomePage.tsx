import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Button, 
  Upload, 
  Card, 
  Typography, 
  List, 
  Spin, 
  message,
  Tag,
  Modal
} from 'antd';
import { 
  HistoryOutlined,
  SoundOutlined,
  PlusOutlined,
  CameraFilled,
  FileImageOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import IOSHeader from '../components/IOSHeader';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
// 导入API服务
import { imageAPI, ttsAPI, wordbookAPI } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const PageContainer = styled(motion.div)`
  padding: 16px;
  padding-top: 64px; /* 适应iOS顶栏高度 */
  padding-bottom: 80px;
  width: 100%;
  box-sizing: border-box;
  background-color: #fff;
  min-height: 100vh;
`;

// iOS风格上传按钮
// 移除未使用的上传按钮样式


const ImageContainer = styled(motion.div)`
  position: relative;
  margin-bottom: 24px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  width: 100%;
`;

const StyledImage = styled(motion.img)`
  width: 100%;
  border-radius: 16px;
  display: block;
`;

const WordMarker = styled(motion.div)<{ top: number; left: number }>`
  position: absolute;
  top: ${props => props.top}%;
  left: ${props => props.left}%;
  background-color: rgba(250, 204, 21, 0.9);
  color: black;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.9);
`;

const SentenceCard = styled(motion(Card))`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f7f7f7;
  overflow: hidden;
  transition: all 0.3s ease;
  
  .ant-card-head {
    background-color: #f7faff;
    border-bottom: 1px solid #eef2ff;
  }
  
  .ant-card-body {
    padding: 16px 20px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    border-color: #e6f0ff;
  }
`;

// 使用List<Word>确保类型安全
const WordList = styled(motion(List<Word>))`
  margin-top: 20px;
  
  .ant-list-item {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 12px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    border: 1px solid #f7f7f7;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      border-color: #e6f0ff;
    }
  }
  
  .ant-list-item-meta-title {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
  }
  
  .ant-list-item-meta-description {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
  }
  
  .ant-list-item-action {
    margin-top: 8px;
  }
`;

const WordText = styled(Text)`
  margin-right: 10px;
  font-weight: 600;
  font-size: 16px;
  color: #4e7dd1;
`;

const KanaText = styled(Text)`
  color: #666;
  margin-right: 10px;
  font-size: 14px;
`;

const ButtonsContainer = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  gap: 16px;
  flex-wrap: wrap;
  
  .ant-btn {
    flex: 1;
    min-width: 140px;
    height: 54px;
    border-radius: 12px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .anticon {
      font-size: 20px;
      margin-right: 8px;
    }
  }
`;

interface Word {
  id: string;
  word: string;
  kana: string;
  meaning: string;
  position: {
    x: number;
    y: number;
  };
}

interface AnalysisResult {
  imageUrl: string;
  historyId?: string;
  words: Word[];
  sentence: string;
  translatedSentence: string;
  sentence_japanese?: string;
  sentence_chinese?: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [loadingText, setLoadingText] = useState<string>('图片解析中...');
  const [addingWordIds, setAddingWordIds] = useState<string[]>([]);
  const [wordBookWords, setWordBookWords] = useState<string[]>([]);
  
  // 加载单词本数据，用于检查重复单词
  useEffect(() => {
    const loadWordBookData = async () => {
      try {
        const response = await wordbookAPI.getWords();
        if (response.data && Array.isArray(response.data)) {
          // 提取所有单词文本，用于重复检查
          const wordTexts = response.data.map((item: any) => item.word);
          setWordBookWords(wordTexts);
        }
      } catch (error) {
        console.error('获取单词本失败:', error);
      }
    };
    
    loadWordBookData();
  }, []);
  
  // 处理从历史记录页面传来的数据
  useEffect(() => {
    if (location.state && location.state.historyItem) {
      const historyItem = location.state.historyItem;
      
      try {
        // 根据 API 返回的字段名进行适配
        const adaptedWords = historyItem.words ? historyItem.words.map((word: any) => ({
          id: word.id,
          word: word.word,
          kana: word.kana,
          meaning: word.meaning,
          // 将 position_x 和 position_y 转换为 position 对象格式
          position: {
            x: word.position_x || (word.position ? word.position.x : null),
            y: word.position_y || (word.position ? word.position.y : null)
          }
        })) : [];
        
        // 适配数据格式，确保字段名一致
        const adaptedItem = {
          imageUrl: historyItem.image_url || historyItem.imageUrl,
          historyId: historyItem.id,
          sentence: historyItem.sentence_japanese || historyItem.sentence,
          sentence_japanese: historyItem.sentence_japanese || historyItem.sentence,
          sentence_chinese: historyItem.sentence_chinese || historyItem.translated_sentence || historyItem.translatedSentence,
          translatedSentence: historyItem.sentence_chinese || historyItem.translated_sentence || historyItem.translatedSentence,
          // 使用适配后的单词数组
          words: adaptedWords
        };
        
        setAnalysisResult(adaptedItem);
      } catch (error) {
        console.error('处理历史数据失败:', error);
        message.error({
          content: '处理历史数据失败',
          style: { marginTop: '20vh' }
        });
      }
    }
  }, [location.state]);

  // 隐藏文件输入
  const hiddenFileInput = (
    <input
      type="file"
      ref={fileInputRef}
      accept="image/*"
      style={{ display: 'none' }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
    />
  );

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setLoadingText('图片解析中...'); // 初始设置加载文字
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await imageAPI.analyzeImage(formData);
      console.log('图片分析结果:', response.data);
      
      // 转换旧格式为新格式 (兼容性处理)
      const result = {
        ...response.data,
        sentence_japanese: response.data.sentence_japanese || response.data.sentence,
        sentence_chinese: response.data.sentence_chinese || response.data.translatedSentence
      };

      setAnalysisResult(result);
      message.success('图片分析成功');
    } catch (error) {
      console.error('图片分析失败:', error);
      message.error('图片分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开相机
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 播放单词发音
  const playWordSound = async (word: string) => {
    try {
      // 调用TTS API获取音频
      const response = await ttsAPI.speak(word);
      
      // 创建音频对象并播放
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('播放发音失败:', error);
      message.error('播放发音失败');
    }
  };

  // 添加单词到单词本
  const addToWordbook = async (word: Word) => {
    // 确保有单词 ID
    const wordId = word.id || `temp-${Date.now()}`;
    
    // 检查是否已经在单词本中
    if (wordBookWords.includes(word.word)) {
      // 已存在，只显示动画反馈但不调用API
      setAddingWordIds(prev => [...prev, wordId]);
      
      // 显示提示信息
      message.info({
        content: `「${word.word}」已在单词本中`,
        duration: 1.5
      });
      
      // 1.5秒后移除ID，恢复按钮状态
      setTimeout(() => {
        setAddingWordIds(prev => prev.filter(id => id !== wordId));
      }, 1500);
      
      return;
    }
    
    try {
      // 先将ID添加到正在添加的列表中，显示动画
      setAddingWordIds(prev => [...prev, wordId]);
      
      // 调用API
      await wordbookAPI.addWord({
        word: word.word,
        kana: word.kana,
        meaning: word.meaning,
      });
      
      // 添加到本地缓存，避免重复添加
      setWordBookWords(prev => [...prev, word.word]);
      
      // 1.5秒后移除ID，恢复按钮状态
      setTimeout(() => {
        setAddingWordIds(prev => prev.filter(id => id !== wordId));
      }, 1500);
      
    } catch (error) {
      console.error('添加单词失败:', error);
      // 立即移除ID，恢复按钮状态
      setAddingWordIds(prev => prev.filter(id => id !== wordId));
      
      message.error({
        content: '添加失败，请重试',
        duration: 1.5
      });
    }
  };

  // 显示单词详情
  const showWordDetails = (word: Word) => {
    setSelectedWord(word);
  };

  // 关闭单词详情弹窗
  const closeWordDetails = () => {
    setSelectedWord(null);
  };

  // 定义动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.15,  // 减半
        staggerChildren: 0.1   // 减半
      }
    }
  };

  // const itemVariants = {
  //   hidden: { y: 20, opacity: 0 },
  //   visible: {
  //     y: 0,
  //     opacity: 1,
  //     transition: { type: 'spring', stiffness: 300, damping: 24 }
  //   }
  // };

  const fadeInUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring',
        stiffness: 400,  // 增加刚性
        damping: 18     // 减小阻尼
      }
    }
  };
  
  // 设置加载中的文字动画
  useEffect(() => {
    if (!loading) return;
    
    const loadingTexts = [
      '图片解析中...',
      '单词生成中...',
      '例句生成中...'
    ];
    
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[currentIndex]);
    }, 1200); // 每1.2秒切换一次文字
    
    return () => clearInterval(intervalId);
  }, [loading]);

  return (
    <PageContainer
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <IOSHeader
        title=""
        titleColor="#000"
        backgroundColor="rgba(255, 255, 255, 0.92)"
        leftContent={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/icons/icon-512x512.png" alt="ShiruPic Logo" style={{ height: 24, marginRight: 8 }} />
            <span style={{ fontSize: 17, fontWeight: 600 }}>ShiruPic</span>
          </div>
        }
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<HistoryOutlined/>}
              style={{
                padding: '0',
                height: 'auto',
                alignItems: 'center',
                color: '#4e7dd1',
                fontWeight: 500,
                fontSize: 14
              }}
              onClick={() => navigate('/app/history')}
            >
              历史记录
            </Button>
          </div>
        }
      />
      {hiddenFileInput}
      

      {loading ? (
        <motion.div 
          style={{ width: '100%', height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '24px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Spin size="large" />
          <motion.div
            key={loadingText} // 确保文字更新时触发动画
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Text style={{ fontSize: 16, color: '#4e7dd1', fontWeight: 500 }}>{loadingText}</Text>
          </motion.div>
        </motion.div>
      ) : analysisResult ? (
        <>
          <ImageContainer
            variants={fadeInUp}
          >
            <StyledImage 
              src={analysisResult.imageUrl} 
              alt="Analyzed" 
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* 渲染有效的单词标记 */}
            {analysisResult.words && analysisResult.words.length > 0 && analysisResult.words.map((word: Word, index) => {
              // 跳过没有有效位置信息的单词
              if (!word.position || typeof word.position.x !== 'number' || typeof word.position.y !== 'number') {
                console.info(`单词缺少有效位置信息:`, word);
                return null;
              }
              
              return (
                <WordMarker 
                  key={word.id || `word-${index}`}
                  top={word.position.y}
                  left={word.position.x}
                  onClick={() => showWordDetails(word)}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                  whileHover={{ scale: 1.1, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                >
                  {word.word}
                </WordMarker>
              );
            })}
          </ImageContainer>

          <Title level={5} style={{ margin: '24px 0 16px', color: '#333', fontWeight: 'bold' }}>句子</Title>
          <SentenceCard>
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#333', 
                  flexGrow: 1,
                  marginBottom: '8px',
                  lineHeight: '1.5'
                }}>
                  {analysisResult.sentence_japanese || analysisResult.sentence}
                </Text>
                <Button 
                  type="text" 
                  icon={<SoundOutlined style={{ fontSize: 18, color: '#4e7dd1' }} />} 
                  onClick={() => playWordSound(analysisResult.sentence_japanese || analysisResult.sentence)}
                  style={{ marginLeft: '8px', padding: '0 8px' }}
                />
              </div>
              <div style={{ 
                marginTop: '12px', 
                color: '#666', 
                fontSize: '14px',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '12px'
              }}>
                {analysisResult.sentence_chinese || analysisResult.translatedSentence}
              </div>
            </div>
          </SentenceCard>

          <Title level={5} style={{ margin: '24px 0 16px', color: '#333', fontWeight: 'bold' }}>单词 ({analysisResult.words.length})</Title>
          <WordList
            dataSource={analysisResult.words}
            variants={fadeInUp}
            renderItem={(word: Word, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                style={{ width: '100%' }}
              >
                <List.Item
                  actions={[
                    <Button 
                      key="sound" 
                      type="text" 
                      size="large"
                      icon={<SoundOutlined style={{ fontSize: 18, color: '#4e7dd1' }} />} 
                      onClick={() => playWordSound(word.word)}
                    />,
                    <Button 
                      key="add" 
                      type="text" 
                      size="large"
                      icon={
                        <div style={{ width: 18, height: 18, position: 'relative' }}>
                          {!addingWordIds.includes(word.id || '') && (
                            <motion.div 
                              initial={{ opacity: 1 }}
                              animate={{ opacity: addingWordIds.includes(word.id || '') ? 0 : 1 }}
                              transition={{ duration: 0.2 }}
                              style={{ position: 'absolute', top: 0, left: 0 }}
                            >
                              <PlusOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                            </motion.div>
                          )}
                          
                          {addingWordIds.includes(word.id || '') && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ 
                                type: 'spring',
                                stiffness: 500,
                                damping: 15,
                              }}
                              style={{ position: 'absolute', top: 0, left: 0 }}
                            >
                              <CheckOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                            </motion.div>
                          )}
                        </div>
                      }
                      onClick={() => addToWordbook(word)}
                      disabled={addingWordIds.includes(word.id || '')}
                    />
                  ]}
                >
                <List.Item.Meta
                  title={<>
                    <WordText>{word.word}</WordText>
                    <KanaText>{word.kana}</KanaText>
                  </>}
                  description={<span style={{ fontSize: 14 }}>{word.meaning}</span>}
                />
              </List.Item>
              </motion.div>
            )}
          />
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', marginTop: 60, textAlign: 'center' }}
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Title level={4} style={{ color: '#4e7dd1', marginBottom: 40 }}>
              点击下方按钮上传或拍摄图片
            </Title>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{ padding: '20px', marginBottom: '40px' }}
          >
            <InfoCircleOutlined style={{ fontSize: 80, color: '#e6f0ff', marginBottom: 20 }} />
            <Paragraph style={{ color: '#888', maxWidth: 400, margin: '0 auto 40px' }}>
              上传图片，ShiruPic 会自动识别物体和对应单词，帮助您快速学习
            </Paragraph>
          </motion.div>
          
          <motion.div 
            style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              type="primary" 
              icon={<CameraFilled />} 
              size="large"
              onClick={handleCameraClick}
              style={{ height: '54px', width: '160px', borderRadius: '12px', fontWeight: 500, fontSize: '16px' }}
            >
              拍照
            </Button>
            <Upload
              accept="image/*"
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button 
                icon={<FileImageOutlined />} 
                size="large" 
                style={{ height: '54px', width: '160px', borderRadius: '12px', fontWeight: 500, fontSize: '16px', borderColor: '#4e7dd1', color: '#4e7dd1' }}
              >
                上传图片
              </Button>
            </Upload>
          </motion.div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
        </motion.div>
      )}

      {analysisResult && (
        <ButtonsContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button
            type="default"
            icon={<FileImageOutlined />}
            style={{ borderColor: '#4e7dd1', color: '#4e7dd1' }}
            onClick={() => {
              setAnalysisResult(null);
            }}
          >
            重新拍照/上传
          </Button>
        </ButtonsContainer>
      )}

      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 600, color: '#4e7dd1' }}>{selectedWord?.word}</span>}
        open={!!selectedWord}
        onCancel={closeWordDetails}
        width={400}
        centered
        styles={{ 
          header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 },
          body: { padding: '24px 20px' },
          footer: { borderTop: '1px solid #f0f0f0', padding: '12px 20px' }
        }}
        footer={[
          <Button 
            key="sound" 
            icon={<SoundOutlined style={{ color: '#4e7dd1' }} />} 
            style={{ borderRadius: '8px' }}
            onClick={() => selectedWord && playWordSound(selectedWord.word)}
          >
            播放读音
          </Button>,
          <Button 
            key="add" 
            type="primary" 
            icon={<PlusOutlined />} 
            style={{ borderRadius: '8px', backgroundColor: '#4e7dd1' }}
            onClick={() => {
              if (selectedWord) {
                addToWordbook(selectedWord);
                closeWordDetails();
                message.success({
                  content: '已添加到单词本',
                  icon: <PlusOutlined style={{ color: '#52c41a' }} />,
                  style: {
                    marginTop: '20vh'
                  }
                });
              }
            }}
          >
            添加到单词本
          </Button>
        ]}
      >
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginBottom: 16 }}>
                <Tag color="blue" style={{ borderRadius: '4px', padding: '2px 8px', marginRight: 10 }}>假名</Tag> 
                <span style={{ fontSize: 16 }}>{selectedWord.kana}</span>
              </p>
              <p>
                <Tag color="green" style={{ borderRadius: '4px', padding: '2px 8px', marginRight: 10 }}>意思</Tag> 
                <span style={{ fontSize: 16 }}>{selectedWord.meaning}</span>
              </p>
            </div>
          </motion.div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default HomePage;
