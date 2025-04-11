FROM python:3.11-slim

WORKDIR /app

# 复制项目文件
COPY requirements.txt .
COPY firebase-key.json .
COPY .env .
COPY app/ app/
COPY run.py .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 暴露端口
EXPOSE 5001

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["python", "run.py"]