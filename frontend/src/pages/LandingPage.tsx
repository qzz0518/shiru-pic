import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Space, 
  Divider, 
  Card, 
  message, 
  Spin 
} from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../firebase';

declare global {
  interface Window {
    google: any;
  }
}

const { Title, Paragraph } = Typography;

// 定义一个Logo图标组件
const LogoIcon = () => (
  <svg width="60" height="60" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.9)" />
    <path d="M60 100 L140 100 M100 60 L100 140" stroke="#4e7dd1" strokeWidth="12" strokeLinecap="round" />
    <circle cx="100" cy="100" r="25" fill="#4e7dd1" />
  </svg>
);

// 定义波浪背景组件
const WaveBackground = () => (
  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 0, overflow: 'hidden' }}>
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: '100%', height: '160px' }}>
      <path fill="rgba(255, 255, 255, 0.05)" fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,224C384,224,480,256,576,261.3C672,267,768,245,864,224C960,203,1056,181,1152,176C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: '100%', height: '120px', marginTop: '-90px' }}>
      <path fill="rgba(255, 255, 255, 0.08)" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,181.3C384,192,480,192,576,176C672,160,768,128,864,133.3C960,139,1056,181,1152,181.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
  </div>
);

const PageContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #4e7dd1 0%, #6f9de3 100%);
  color: white;
  box-sizing: border-box;
  overflow-x: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1%, transparent 8%),
                      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 1%, transparent 8%),
                      radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 1%, transparent 8%);
    background-size: 100px 100px, 120px 120px, 170px 170px;
    background-position: 0 0, 40px 60px, 130px 160px;
    opacity: 0.4;
    z-index: 0;
  }
`;

const LogoContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 0 0 30px 0;
  width: 100%;
  max-width: 350px;
  position: relative;
  z-index: 1;
`;

const Logo = styled(motion.div)`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 12px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
`;

const ContentCard = styled(motion(Card))`
  border-radius: 24px;
  margin-top: auto;
  margin-bottom: 40px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  border: none;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.98);
  
  .ant-card-body {
    padding: 30px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, rgba(78, 125, 209, 0.2), rgba(111, 157, 227, 0.1));
    border-radius: 50%;
    z-index: -1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 160px;
    height: 160px;
    background: linear-gradient(135deg, rgba(78, 125, 209, 0.1), rgba(111, 157, 227, 0.05));
    border-radius: 0 0 0 100%;
    z-index: -1;
  }
`;

const Feature = styled(motion.div)`
  margin-bottom: 28px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    left: -30px;
    top: 8px;
    width: 8px;
    height: 24px;
    background-color: rgba(78, 125, 209, 0.3);
    border-radius: 4px;
  }
`;

const FeatureTitle = styled(Title)`
  margin-bottom: 8px !important;
  font-size: 22px !important;
  color: #4e7dd1 !important;
  font-weight: 600 !important;
`;

const ButtonContainer = styled(motion.div)`
  margin-top: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  
  .ant-btn {
    width: 100%;
    margin-bottom: 16px;
    height: 48px !important;
    border-radius: 12px !important;
    font-size: 16px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
  }
  
  .ant-btn-primary {
    background: linear-gradient(90deg, #4e7dd1 0%, #6f9de3 100%);
    border: none;
  }
`;

interface LandingPageProps {
  installPrompt: any;
}

const LandingPage: React.FC<LandingPageProps> = ({ installPrompt }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // 处理Google登录
  const handleGoogleLogin = async () => {
    // 防止重复请求
    if (loading) return;
    
    try {
      setLoading(true);
      
      // 使用 Firebase 进行 Google 登录，获取 idToken
      const idToken = await signInWithGoogle();
      console.log('成功获取 Google idToken');
      
      // 直接调用AuthContext中的login方法，避免重复调用API
      try {
        await login(idToken); // 这个函数已经包含了API调用
        navigate('/app');
        message.success('登录成功！');
      } catch (error: any) {
        console.error('登录失败:', error);
        message.error(`登录失败: ${error.response?.data?.error || '请重试'}`);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Google登录错误:', error);
      message.error('登录失败，请重试');
      setLoading(false);
    }
  };
  
  // 初始化 Google 登录按钮
  const renderLoginUI = () => {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%' }}
        >
          <Button 
            type="primary" 
            size="large" 
            icon={<GoogleOutlined style={{ fontSize: '18px' }} />}
            onClick={handleGoogleLogin}
            loading={loading}
            style={{
              background: 'linear-gradient(90deg, #4763c1 0%, #4e7dd1 100%)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            使用Google账号登录
          </Button>
        </motion.div>
        
        {installPrompt && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%' }}
          >
            <Button 
              style={{ marginTop: 16, background: 'rgba(255,255,255,0.9)' }}
              onClick={handleInstallClick}
            >
              安装应用到主屏幕
            </Button>
          </motion.div>
        )}
      </Space>
    );
  };

  // 处理PWA安装
  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          message.success('感谢安装我们的应用！');
        }
      });
    }
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <WaveBackground />
      <LogoContainer
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <motion.div
          initial={{ rotateY: 90 }}
          animate={{ rotateY: 0 }}
          transition={{ delay: 0.2, duration: 1.2, type: "spring" }}
          style={{ marginBottom: 20 }}
        >
          <LogoIcon />
        </motion.div>
        <Logo
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
        >
          ShiruPic
        </Logo>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', margin: '0', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          知るピク - 通过图片学习日语
        </Paragraph>
      </LogoContainer>

      <ContentCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Feature
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <FeatureTitle level={3}>通过照片学习日语</FeatureTitle>
          <Paragraph style={{ fontSize: '15px', color: '#555', lineHeight: '1.6' }}>
            拍摄或上传图片，ShiruPic会自动识别图中物体，并标注对应的日语单词。
          </Paragraph>
        </Feature>

        <Feature
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <FeatureTitle level={3}>智能生成例句</FeatureTitle>
          <Paragraph style={{ fontSize: '15px', color: '#555', lineHeight: '1.6' }}>
            基于识别的单词，自动生成包含这些单词的地道日语例句，帮助您理解语境。
          </Paragraph>
        </Feature>

        <Feature
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <FeatureTitle level={3}>个人单词本</FeatureTitle>
          <Paragraph style={{ fontSize: '15px', color: '#555', lineHeight: '1.6' }}>
            保存您学习过的单词，随时回顾，支持发音和自定义编辑。
          </Paragraph>
        </Feature>

        <Divider style={{ margin: '20px 0', borderColor: '#eee' }} />

        <ButtonContainer
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          style={{ position: 'relative' }}
        >
          {loading ? (
            <Spin size="large" />
          ) : (
            renderLoginUI()
          )}
        </ButtonContainer>
      </ContentCard>
    </PageContainer>
  );
};

export default LandingPage;
