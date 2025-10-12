# Dockerfile
FROM node:22-alpine

WORKDIR /app

# 设置 pnpm 国内镜像（先换源再安装）
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/ && \
    npm install -g pnpm && \
    pnpm config set registry https://mirrors.cloud.tencent.com/npm/

# 复制包文件（先复制 package.json 利用 Docker 缓存）
COPY package.json pnpm-lock.yaml* ./

# 安装 sharp（使用预编译版本，跳过系统依赖）
RUN pnpm install sharp --ignore-scripts

# 安装其他依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 复制环境变量文件
COPY .env .env

# 生成 Prisma Client
RUN pnpm prisma:generate

# 构建生产版本
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]