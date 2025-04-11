import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const { Title } = Typography;

const HeaderWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  user-select: none;
`;

// iOS风格状态栏
const StatusBar = styled.div`
  height: 44px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

// iOS风格标题
const IOSTitle = styled(Title)`
  margin: 0 !important;
  font-size: 17px !important;
  font-weight: 600 !important;
  color: #000 !important;
  text-align: center;
`;

// 底部分隔线
const HeaderDivider = styled.div`
  height: 0.5px;
  width: 100%;
  background-color: rgba(60, 60, 67, 0.29); // iOS标准分隔线颜色
`;

// 左侧按钮区域
const LeftArea = styled.div`
  position: absolute;
  left: 16px;
  height: 100%;
  display: flex;
  align-items: center;
`;

// 右侧按钮区域
const RightArea = styled.div`
  position: absolute;
  right: 16px;
  height: 100%;
  display: flex;
  align-items: center;
`;

interface IOSHeaderProps {
  title: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  titleColor?: string;
  backgroundColor?: string;
}

const IOSHeader: React.FC<IOSHeaderProps> = ({ 
  title, 
  leftContent, 
  rightContent, 
  titleColor = '#000',
  backgroundColor = 'rgba(255, 255, 255, 0.92)'
}) => {
  return (
    <HeaderWrapper>
      <StatusBar style={{ backgroundColor }}>
        {leftContent && <LeftArea>{leftContent}</LeftArea>}
        <IOSTitle level={5} style={{ color: titleColor }}>{title}</IOSTitle>
        {rightContent && <RightArea>{rightContent}</RightArea>}
      </StatusBar>
      <HeaderDivider />
    </HeaderWrapper>
  );
};

export default IOSHeader;
