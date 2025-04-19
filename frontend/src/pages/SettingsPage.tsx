import React, { useState, useEffect } from 'react';
import { 
  List, 
  Switch, 
  Avatar, 
  Typography, 
  Button, 
  Divider, 
  Card,
  Badge
} from 'antd';
import { 
  LogoutOutlined, 
  QuestionCircleOutlined,
  BellOutlined,
  InfoCircleOutlined,
  GithubOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';
import IOSHeader from '../components/IOSHeader';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import toast from '../utils/toast';
import { useNetworkStore } from '../utils/network';
import { requestNotificationPermission } from '../utils/notificationService';

const { Title, Text } = Typography;

const PageContainer = styled.div`
  padding: 16px;
  padding-top: 64px; /* 适应iOS顶栏高度 */
  padding-bottom: 80px;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
  background-color: #fff;
  min-height: 100vh;
`;

const UserInfoSection = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #4e7dd1 0%, #6f9de3 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  width: 100%;
`;

const UserAvatar = styled(Avatar)`
  width: 90px;
  height: 90px;
  margin-bottom: 16px;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 36px;
  color: #4e7dd1;
`;

const SettingsSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.div`
  padding: 16px 20px;
  font-weight: 600;
  color: #4e7dd1;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

// 设置动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.15,  // 减半
      staggerChildren: 0.1  // 减半
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 22 }  // 增加刚性，减小阻尼
  }
};

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // 初始化时从本地存储获取通知设置
  useEffect(() => {
    if (user) {
      const savedSetting = localStorage.getItem(`notifications_enabled_${user.uid}`);
      setNotificationsEnabled(savedSetting === 'true');
    }
  }, [user]);

  // 处理登出
  const handleLogout = async () => {
    try {
      setLoading(true);
      // 调用 AuthContext 的 logout 函数
      await logout();
      
      // 手动清除所有缓存的令牌
      try {
        // 引入全局 API 实例中的缓存令牌 (cachedToken) 会被设置为 null
        // 这一步使用事件模式实现
        const clearedEvent = new CustomEvent('auth-token-cleared');
        window.dispatchEvent(clearedEvent);
      } catch (clearError) {
        console.error('清除令牌缓存错误:', clearError);
      }
      
      // 展示成功消息
      toast.success('您已成功退出登录');
      
      // 确保退出后重定向到登录页面
      // 增加延迟时间，确保数据库操作完成
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    } catch (error) {
      console.error('退出登录错误:', error);
      toast.error('退出登录时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前网络状态
  const isOnline = useNetworkStore(state => state.isOnline);
  
  // 处理通知开关切换
  const handleNotificationToggle = async (checked: boolean) => {
    if (!user) return;
    
    // 保存设置到本地存储
    localStorage.setItem(`notifications_enabled_${user.uid}`, String(checked));
    setNotificationsEnabled(checked);
    
    // 如果开启通知，请求浏览器通知权限
    if (checked) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.warning('需要允许通知权限才能接收学习提醒');
      } else {
        toast.success('已开启学习提醒，每天早上9点将提醒您复习单词');
      }
    } else {
      toast.success('已关闭学习提醒');
    }
  };

  // 应用设置数据
  const appSettings = [
    {
      title: '网络状态',
      description: '当前' + (isOnline ? '已连接网络，可使用全部功能' : '无网络连接，仅可使用缓存内容'),
      icon: isOnline ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <InfoCircleOutlined style={{ color: '#faad14' }} />,
      action: <Badge status={isOnline ? 'success' : 'warning'} text={isOnline ? '在线模式' : '离线模式'} />
    },
    {
      title: '启用推送通知',
      description: '接收学习提醒和新功能通知',
      icon: <BellOutlined />,
      action: <Switch checked={notificationsEnabled} onChange={handleNotificationToggle} />
    }
  ];

  // 关于我们信息
  const aboutItems = [
    {
      title: '关于 ShiruPic',
      description: '了解更多关于我们的信息',
      icon: <InfoCircleOutlined />,
      onClick: () => window.open('https://github.com/qzz0518/shiru-pic', '_blank')
    },
    {
      title: '联系我们',
      description: '有问题？联系我们获取帮助',
      icon: <QuestionCircleOutlined />,
      onClick: () => window.location.href = 'mailto:i@zerah.cc'
    },
    {
      title: 'GitHub 项目',
      description: '查看我们的开源代码',
      icon: <GithubOutlined />,
      onClick: () => window.open('https://github.com/qzz0518/shiru-pic', '_blank')
    }
  ];

  return (
    <PageContainer>
      <IOSHeader
        title="设置"
        titleColor="#000"
        backgroundColor="rgba(255, 255, 255, 0.92)"
        leftContent={<UserOutlined style={{ fontSize: 18, color: '#4e7dd1' }} />}
        rightContent={
          <div>
            <Button 
              type="text" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              size="small"
              style={{ padding: '0', height: 'auto', fontSize: 14 }}
              loading={loading}
            >
              退出
            </Button>
          </div>
        }
      />
      
      <UserInfoSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}  // 减半
      >
        <motion.div 
          initial={{ scale: 0.8 }} 
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}  // 减半延迟，增加刚性
        >
          <Badge
            count={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            offset={[-5, 5]}
          >
            <UserAvatar src={user?.photoURL || 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png'} size="large">
              {!user?.photoURL && user?.name?.charAt(0)}
            </UserAvatar>
          </Badge>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}  // 减半
        >
          <Title level={4} style={{ margin: '8px 0', color: 'white' }}>
            {user?.name || user?.displayName || '用户'}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.email || ''}</Text>
        </motion.div>
      </UserInfoSection>

      <SettingsSection
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <SectionTitle>
          <SettingOutlined />
          应用设置
        </SectionTitle>
        <List
          itemLayout="horizontal"
          dataSource={appSettings}
          renderItem={(item) => (
            <motion.div variants={itemVariants}>
              <List.Item
                actions={[item.action]}
                style={{ padding: '16px 20px' }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={item.icon} 
                      style={{ 
                        backgroundColor: 'rgba(78, 125, 209, 0.1)', 
                        color: '#4e7dd1',
                        fontSize: '18px' 
                      }} 
                    />
                  }
                  title={<span style={{ fontSize: '15px' }}>{item.title}</span>}
                  description={<span style={{ fontSize: '13px' }}>{item.description}</span>}
                />
              </List.Item>
            </motion.div>
          )}
        />
      </SettingsSection>

      <SettingsSection
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <SectionTitle>
          <InfoCircleOutlined />
          关于
        </SectionTitle>
        <List
          itemLayout="horizontal"
          dataSource={aboutItems}
          renderItem={(item) => (
            <motion.div variants={itemVariants}>
              <Card 
                hoverable 
                bodyStyle={{ padding: '16px 20px' }}
                onClick={item.onClick}
                style={{ border: 'none', borderRadius: 0, borderBottom: '1px solid #f0f0f0' }}
              >
                <List.Item style={{ padding: 0 }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.icon} 
                        style={{ 
                          backgroundColor: 'rgba(78, 125, 209, 0.1)', 
                          color: '#4e7dd1',
                          fontSize: '18px' 
                        }} 
                      />
                    }
                    title={<span style={{ fontSize: '15px' }}>{item.title}</span>}
                    description={<span style={{ fontSize: '13px' }}>{item.description}</span>}
                  />
                </List.Item>
              </Card>
            </motion.div>
          )}
        />
      </SettingsSection>

      <Divider />

      <motion.div 
        style={{ textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}  // 减半
      >
        <motion.div 
          style={{ marginTop: 12, fontSize: 12, color: '#999' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}  // 减半
        >
          ShiruPic 版本 1.0.0
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default SettingsPage;
