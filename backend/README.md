# ShiruPic 后端

这是ShiruPic应用的后端服务器，提供图像处理、用户认证、单词本管理、文本到语音转换、历史记录管理以及AI互动功能的API接口。

## 技术栈

- **Flask**: Web框架
- **Firebase**: 作为数据库和存储解决方案
  - Firestore: 数据库
  - Firebase Storage: 图片存储
  - Firebase Authentication: 用户认证
- **OpenAI**: AI功能支持
- **Python 3.8+**: 编程语言

## 安装和设置

### 前提条件

- 安装Python 3.8或更高版本
- 一个有效的Firebase项目，并具有以下服务：
  - Firestore
  - Storage
  - Authentication
- OpenAI API密钥(如果使用AI功能)

### 安装步骤

1. 克隆代码库
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. 创建虚拟环境
   ```bash
   python -m venv venv
   ```

3. 激活虚拟环境
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - MacOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

5. 配置环境变量
   - 复制.env.example为.env
     ```bash
     cp .env.example .env
     ```
   - 编辑.env文件，填入必要的凭证和配置

6. 确保Firebase服务账号密钥(firebase-key.json)放置在项目根目录

### 运行服务器

```bash
python run.py
```

服务器将在`http://0.0.0.0:5001`上启动，可以通过访问`http://localhost:5001`进行测试。

### Docker部署

项目包含 Docker 配置文件，可以使用 Docker 进行快速部署。

#### 前提条件

- 安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)
- 准备好 Firebase 密钥文件(`firebase-key.json`)和环境变量文件(`.env`)

#### 构建和启动

1. 在后端项目根目录下执行：
   ```bash
   docker-compose up -d
   ```
   该命令会构建项目镜像并在后台启动容器。

2. 查看容器日志：
   ```bash
   docker-compose logs -f
   ```

3. 停止容器：
   ```bash
   docker-compose down
   ```

4. 重新构建和启动（当代码有变更时）：
   ```bash
   docker-compose up -d --build
   ```

#### Docker文件说明

- `Dockerfile`：定义了项目的构建步骤，包括使用Python 3.11基础镜像、安装依赖和设置运行环境。

- `docker-compose.yml`：配置了容器的运行环境，包括端口映射、挂载目录和环境变量等。

#### 注意事项

- 使用Docker部署时，确保`firebase-key.json`和`.env`文件已经正确配置。
- 容器会将API服务暴露在宿主机的5001端口。
- 如果需要更改端口或其他配置，请修改`docker-compose.yml`文件。

## 环境变量配置

在`.env`文件中设置以下环境变量：

- `SECRET_KEY`: 应用密钥，用于会话管理
- `FIREBASE_CREDENTIALS`: Firebase服务账号凭证的路径(默认为'firebase-key.json')
- `FIREBASE_STORAGE_BUCKET`: Firebase存储桶名称
- `OPENAI_API_KEY`: OpenAI API密钥(用于AI功能)

## API端点

### 认证 (`/api/auth`)
- `POST /api/auth/google`: Google/Firebase登录
- `GET /api/auth/verify`: 验证JWT令牌

### 单词本 (`/api/wordbook`)
- `GET /api/wordbook`: 获取用户的单词列表
- `POST /api/wordbook/add`: 添加新单词
- `PUT /api/wordbook/<word_id>`: 更新单词
- `DELETE /api/wordbook/<word_id>`: 删除单词

### 图像处理 (`/api/image`)
- `POST /api/image/analyze`: 分析图片内容

### 文本到语音 (`/api/tts`)
- `POST /api/tts/speak`: 文本转语音

### 历史记录 (`/api/history`)
- `GET /api/history`: 获取用户的历史记录列表
- `GET /api/history/<history_id>`: 获取单条历史记录详情
- `DELETE /api/history/<history_id>`: 删除历史记录

### AI功能 (`/api/ai`)
- `POST /api/ai/translate`: 使用AI进行日中互译

### 系统状态
- `GET /api/ping`: 检查API服务状态
- `GET /`: 检查服务器状态

## 开发指南

### 项目结构
```
backend/
├── app/                    # 主应用包
│   ├── __init__.py         # 应用初始化
│   ├── api/                # API模块
│   │   ├── auth.py         # 认证API
│   │   ├── wordbook.py     # 单词本API
│   │   ├── image.py        # 图像处理API
│   │   ├── tts.py          # 文本到语音API
│   │   ├── history.py      # 历史记录API
│   │   └── ai.py           # AI功能API
│   └── utils/              # 工具函数
├── firebase-key.json       # Firebase凭证(需自行添加)
├── .env                    # 环境变量(从.env.example复制)
├── .env.example            # 环境变量示例
├── requirements.txt        # 项目依赖
├── run.py                  # 应用入口点
└── README.md               # 本文档
```

### 添加新功能
1. 在`app/api/`中创建新的API模块
2. 在`app/__init__.py`中注册新的蓝图
3. 更新依赖(如需)
4. 更新文档