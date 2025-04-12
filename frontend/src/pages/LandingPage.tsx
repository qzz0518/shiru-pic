import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Typography, 
  Space, 
  Divider, 
  Card, 
  Spin 
} from 'antd';
import { GoogleOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../firebase';
import db from '../utils/db';
import toast from '../utils/toast';

declare global {
  interface Window {
    google: any;
    MSStream?: any; // IE浏览器检测用
  }
  
  interface Navigator {
    standalone?: boolean; // iOS Safari检测用
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

// 定义beforeinstallprompt事件类型
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

const LandingPage: React.FC<LandingPageProps> = ({ installPrompt: initialInstallPrompt }) => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(initialInstallPrompt || null);
  const [isInstallable, setIsInstallable] = useState(!!initialInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // 监听 beforeinstallprompt 事件
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // 防止移动设备上显示迷你信息栏
      e.preventDefault();
      // 保存事件，以便稍后触发
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      
      console.log('应用可安装，触发 beforeinstallprompt 事件');
    };
    
    // 实用标准
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // 检测应用是否已经安装
    const handleAppInstalled = () => {
      // 隐藏安装按钮
      setIsInstalled(true);
      setIsInstallable(false);
      // 清除deferredPrompt，以便进行垃圾回收
      setDeferredPrompt(null);
      
      console.log('PWA已成功安装！');
      toast.success('应用已成功安装到您的设备！');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // 清除事件监听器
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // 自动登录 - 检查IndexedDB中是否有认证数据
  useEffect(() => {
    // 避免已经登录的情况下或者已经尝试过自动登录的情况下重复执行
    if (isAuthenticated || autoLoginAttempted) {
      return;
    }
    
    const attemptAutoLogin = async () => {
      try {
        // 检查数据库中是否有登录信息
        const authData = await db.getAuthToken();
        
        if (authData && authData.token) {
          console.log('发现保存的认证数据，正在尝试自动登录...');
          setLoading(true);
          setTimeout(() => {
            navigate('/app');
            setLoading(false);
          }, 100); // 添加短暂延迟，提供更好的视觉反馈
        }
      } catch (error) {
        console.error('自动登录失败:', error);
        // 失败不显示错误，静默失败
      } finally {
        // 标记已尝试自动登录
        setAutoLoginAttempted(true);
      }
    };
    
    // 执行自动登录
    attemptAutoLogin();
  }, [navigate, isAuthenticated, autoLoginAttempted]);

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
        toast.success('登录成功！');
      } catch (error: any) {
        console.error('登录失败:', error);
        toast.error(`登录失败: ${error.response?.data?.error || '请重试'}`);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Google登录错误:', error);
      toast.error('登录失败，请重试');
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
        
        {/* 添加到主屏幕按钮 - 当应用可安装且未安装时显示 */}
        {!isInstalled && (isInstallable || !isStandalone) && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%' }}
          >
            <Button 
              style={{ 
                marginTop: 16, 
                background: 'rgba(255,255,255,0.9)',
                color: '#4e7dd1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              icon={<AppstoreAddOutlined style={{ fontSize: '16px' }} />}
              onClick={handleInstallClick}
            >
              添加到主屏幕
            </Button>
          </motion.div>
        )}
      </Space>
    );
  };

  // 判断设备类型和浏览器
  // 使用类型断言避免TypeScript错误
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // 判断是否已经安装为PWA
  const isPWAInstalled = isStandalone || 
                         navigator.standalone || 
                         document.referrer.includes('android-app://');
  
  // 获取安装指南文本
  const getInstallInstructions = () => {
    if (isIOS && isSafari) {
      return '点击 Safari 底部的分享按钮，然后选择“添加到主屏幕”';
    } else if (/Android/.test(navigator.userAgent)) {
      return '打开菜单，然后点击“添加到主屏幕”';
    } else {
      return '点击浏览器地址栏中的安装图标';
    }
  };
  
  // 处理PWA安装 - 遵循 web.dev 最佳实践
  const handleInstallClick = async () => {
    // 如果有deferredPrompt，则使用原生安装提示
    if (deferredPrompt) {
      try {
        // 显示安装提示
        deferredPrompt.prompt();
        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;
        
        // 记录用户选择
        if (outcome === 'accepted') {
          toast.success('感谢安装我们的应用！');
          console.log('用户接受了安装');
          setIsInstalled(true);
        } else {
          console.log('用户拒绝了安装');
        }
        
        // 使用后无法再次使用提示，需要丢弃它
        setDeferredPrompt(null);
      } catch (error) {
        console.error('安装提示错误:', error);
        toast.error('安装过程中出现错误');
      }
    } else {
      // 如果没有deferredPrompt，则显示适用于当前设备的安装指南
      toast.info(getInstallInstructions(), {
        duration: 5000,
        icon: 'ℹ️'
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
