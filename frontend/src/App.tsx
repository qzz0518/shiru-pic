import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'

// 导入页面组件
import { HomePage, WordbookPage, SettingsPage, LandingPage, HistoryPage } from './pages'
import { Layout } from './components'

// 导入上下文
import { AuthProvider, useAuth } from './contexts'

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  
  // 在加载时显示加载指示器
  if (loading) {
    return <div>加载中...</div>
  }
  
  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

// 应用主题颜色
const theme = {
  token: {
    colorPrimary: '#4e7dd1',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }
}

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`

function App() {
  // 检查PWA安装状态
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    // 监听beforeinstallprompt事件，用于PWA安装
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        setInstallPrompt(e)
      })
    }
  }, [])

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <AuthProvider>
        <AppContainer>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage installPrompt={installPrompt} />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="wordbook" element={<WordbookPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="history" element={<HistoryPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppContainer>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
