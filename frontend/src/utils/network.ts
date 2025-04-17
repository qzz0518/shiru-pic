// 网络状态检测工具
import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setOnline: (status: boolean) => void;
}

// 创建全局网络状态存储
export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: navigator.onLine,  // 初始化为当前网络状态
  setOnline: (status: boolean) => set({ isOnline: status }),
}));

// 检测网络状态变化
export const initNetworkDetection = () => {
  const { setOnline } = useNetworkStore.getState();
  
  // 初始化网络状态
  setOnline(navigator.onLine);
  
  // 添加网络状态变化事件监听
  window.addEventListener('online', () => {
    console.log('网络已连接');
    setOnline(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('网络已断开');
    setOnline(false);
  });
};

// 检查当前是否在线
export const isOnline = (): boolean => {
  return useNetworkStore.getState().isOnline && navigator.onLine;
};

// 工具方法：获取网络状态并在离线时显示提示
export const checkNetworkStatus = (): boolean => {
  const online = isOnline();
  return online;
};
