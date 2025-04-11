import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Tabs } from 'antd';
import { 
  HomeOutlined, 
  BookOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import styled from 'styled-components';

const { Content } = AntLayout;

const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
  background-color: #f5f5f5;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled(Content)`
  flex: 1;
  padding: 0;
  margin-bottom: 60px;
  overflow-x: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TabBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  height: 60px;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
  }
  .ant-tabs-nav-wrap {
    justify-content: center;
  }
  .ant-tabs-tab {
    padding: 12px 0;
    font-size: 16px;
  }
  .ant-tabs-ink-bar {
    height: 3px;
  }
`;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 根据当前路径确定激活的标签
  const getActiveKey = () => {
    const path = location.pathname.split('/').pop() || '';
    if (path === 'wordbook') return 'wordbook';
    if (path === 'settings') return 'settings';
    return 'home';
  };

  // 处理标签变化
  const handleTabChange = (key: string) => {
    if (key === 'home') {
      navigate('/app');
    } else {
      navigate(`/app/${key}`);
    }
  };

  return (
    <StyledLayout>
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
      
      <TabBar>
        <StyledTabs
          activeKey={getActiveKey()}
          onChange={handleTabChange}
          centered
          size="large"
          items={[
            {
              key: 'wordbook',
              label: (
                <span>
                  <BookOutlined />
                  单词本
                </span>
              )
            },
            {
              key: 'home',
              label: (
                <span>
                  <HomeOutlined />
                  主页
                </span>
              )
            },
            {
              key: 'settings',
              label: (
                <span>
                  <SettingOutlined />
                  设置
                </span>
              )
            }
          ]}
        />
      </TabBar>
    </StyledLayout>
  );
};

export default Layout;
