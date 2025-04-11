# ShiruPic - 图片识别日语学习应用
ShiruPic是一款基于图像识别的日语学习应用，通过拍照或上传图片，自动识别图中物体并标注日语单词，帮助用户在真实场景中高效学习日语词汇。应用支持PWA（Progressive Web App）模式，可以安装到手机或桌面设备上，支持离线使用和本地存储。

[ShiruPic](https://shiru-pic.com)

## 功能特点

### 1. 图像识别与标注
- 📸 拍照或上传图片自动识别图中物体
- 🔤 智能标注日语单词、假名读音和中文翻译
- 🔠 在图片上直观显示单词位置标记
- 📢 支持各种图片格式（PNG、JPG、GIF、WebP）

### 2. 单词本管理
- 📚 自动保存识别的单词到个人单词本
- 🔍 快速搜索已保存的单词
- ✏️ 编辑、删除单词信息

### 3. 语音朗读
- 🔊 日语单词和句子发音朗读
- 👂 帮助掌握正确的发音

### 4. AI辅助学习
- 🤖 AI自动生成包含识别单词的日语例句
- 🔄 日语-中文互译功能
- 📝 详细的单词解释和例句

### 5. 历史记录
- 📅 浏览和回顾历史学习内容
- 🔁 可重新访问之前的学习内容

### 6. PWA 支持
- 📱 可安装到手机或桌面设备上
- 👌 支持离线模式使用
- 📲 多端同步体验
- 📦 本地数据存储

## 技术栈

### 前端
- **React** + **TypeScript**: 构建用户界面
- **Vite**: 前端构建工具
- **Ant Design**: UI组件库
- **Framer Motion**: 动画效果
- **Styled Components**: 样式管理
- **React Router**: 路由管理
- **Axios**: HTTP请求
- **Firebase SDK**: 用户认证
- **Dexie.js**: IndexedDB封装库，用于本地存储
- **PWA (vite-plugin-pwa)**: 渲染移动原生应用体验

### 后端
- **Flask**: Web框架
- **Firebase**: 云数据库和存储
  - Firestore: 数据存储
  - Storage: 图片存储
  - Authentication: 用户认证
- **OpenAI**: AI图像分析和文本处理
  - GPT-4o-mini: 图像分析和文本生成
  - TTS: 语音合成
- **Python 3.8+**: 编程语言

## 安装和部署

### 前提条件
- Node.js 16+
- Python 3.8+
- Firebase项目（包含Firestore、Storage和Authentication服务）
- OpenAI API密钥

### 前端部署

1. 进入前端目录
   ```bash
   cd frontend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   ```bash
   cp .env.example .env
   ```
   编辑.env文件，设置必要的配置项

4. 开发模式运行
   ```bash
   npm run dev
   ```

5. 构建生产版本
   ```bash
   npm run build
   ```

### 后端部署

1. 进入后端目录
   ```bash
   cd backend
   ```

2. 创建并激活虚拟环境
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/MacOS
   venv\Scripts\activate  # Windows
   ```

3. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量
   ```bash
   cp .env.example .env
   ```
   编辑.env文件，设置必要的配置

5. 放置Firebase密钥文件
   将Firebase服务账号密钥文件（firebase-key.json）放在后端根目录

6. 启动服务器
   ```bash
   python run.py
   ```
   服务器将在`http://localhost:5001`上运行

## 项目结构

```
shiru-pic/
├── frontend/           # 前端React应用
│   ├── src/            # 源代码
│   │   ├── components/ # 组件
│   │   ├── pages/      # 页面
│   │   ├── services/   # API服务
│   │   ├── contexts/   # 上下文
│   │   ├── hooks/      # 自定义钩子
│   │   └── utils/      # 工具函数和数据库
│   ├── public/         # 静态资源
│   └── ...            # 其他配置文件
├── backend/            # 后端Flask应用
│   ├── app/            # 应用源码
│   │   ├── api/        # API端点
│   │   └── utils/      # 工具函数
│   ├── firebase-key.json  # Firebase密钥（需自行添加）
│   └── ...            # 其他配置文件
└── doc/               # 项目文档和资源
```

## 使用指南

1. **注册/登录**：通过Google账号登录应用

2. **图片识别**：
   - 点击主页上的拍照或上传图片按钮
   - 应用会自动分析图片并标注识别到的日语单词
   - 点击单词标签可查看详细信息和听取发音

3. **单词本**：
   - 在单词本页面查看所有保存的单词
   - 搜索、编辑或删除单词
   - 点击发音按钮听取单词读音

4. **历史记录**：
   - 查看之前分析过的图片和对应单词
   - 点击图片可重新访问之前的分析结果

5. **PWA安装**：
   - 使用Chrome或兼容浏览器时，可点击地址栏中的安装图标
   - iOS用户可使用Safari浏览器，点击分享按钮，选择“添加到主屏幕”
   - 安装后可离线使用，保持登录状态

6. **设置**：个性化应用配置