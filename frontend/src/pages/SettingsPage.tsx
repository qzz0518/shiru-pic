import React, { useState } from 'react';
import { 
  List, 
  Switch, 
  Avatar, 
  Typography, 
  Button, 
  Divider, 
  message, 
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

  // 处理登出
  const handleLogout = async () => {
    try {
      setLoading(true);
      // 清除Firebase会话
      logout();
      
      // 确保退出后重定向到登录页面
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      message.success('您已成功退出登录');
    } catch (error) {
      console.error('退出登录错误:', error);
      message.error('退出登录时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 应用设置数据
  const appSettings = [
    {
      title: '启用推送通知',
      description: '接收学习提醒和新功能通知',
      icon: <BellOutlined />,
      action: <Switch defaultChecked />
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
