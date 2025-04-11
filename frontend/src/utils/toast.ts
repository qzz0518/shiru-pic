import toast, { ToastOptions } from 'react-hot-toast';

// 统一的Toast配置选项
const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-center',
  style: {
    background: '#fff',
    color: 'rgba(0, 0, 0, 0.85)',
    fontWeight: 500,
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)'
  }
};

// 成功提示
export const showSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#f6ffed', // 淡绿色背景
      border: '1px solid #b7eb8f',
    },
    ...options
  });
};

// 错误提示
export const showError = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultOptions,
    duration: 4000, // 错误提示显示时间更长
    style: {
      ...defaultOptions.style,
      background: '#fff2f0', // 淡红色背景
      border: '1px solid #ffccc7',
    },
    ...options
  });
};

// 普通信息提示
export const showInfo = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#e6f7ff', // 淡蓝色背景
      border: '1px solid #91d5ff',
    },
    ...options
  });
};

// 警告提示
export const showWarning = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultOptions,
    style: {
      ...defaultOptions.style,
      background: '#fffbe6', // 淡黄色背景
      border: '1px solid #ffe58f',
      color: '#ad8b00'
    },
    icon: '⚠️',
    ...options
  });
};

// 加载提示
export const showLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    ...defaultOptions,
    duration: Infinity, // 加载提示默认不会自动消失
    ...options
  });
};

// 关闭指定ID的提示
export const dismiss = (toastId: string) => {
  toast.dismiss(toastId);
};

// 关闭所有提示
export const dismissAll = () => {
  toast.dismiss();
};

// 默认导出
const toastService = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  dismiss,
  dismissAll
};

export default toastService;
