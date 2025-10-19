# Studio Album

基于 Next.js + Prisma + MySQL 的内部相册与证书管理系统。支持图片上传、分类浏览、权限控制和分享访问。

## 功能

- 分类管理：私有、内部、公开三种可见性
- 图片上传：支持 JPG/PNG，生成缩略图并存储至 TOS
- 用户与权限：注册/登录，管理员/成员角色；成员仅能管理自己上传内容
- 分享访问：可配置密码与过期时间的分享链接
- 批量下载：选择图片后打包为 ZIP
- 管理后台与响应式界面

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- MySQL >= 8

### 安装与配置

- 安装依赖：`pnpm install`
- 复制环境变量模板：`cp .env.example .env`

### 启动开发

- 运行：`pnpm dev`
- 访问：`http://localhost:3000`
- 首次注册的账户自动成为管理员，后续用户为成员角色。

## Docker（可选）

- 开发环境：`docker compose up -d` / 查看日志：`docker compose logs -f studio-album` / 停止：`docker compose down`
- 生产构建与运行：`pnpm build`，`pnpm start` 或 `pm2 start npm --name "studio-album" -- start`

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
