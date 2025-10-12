#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 检查并安装 pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[info] 未找到 pnpm，正在使用 npm 全局安装..."
  if ! command -v npm >/dev/null 2>&1; then
    echo "[error] 未找到 npm，请先安装 Node.js" >&2
    exit 1
  fi
  npm install -g pnpm
  echo "[info] pnpm 安装完成"
fi

echo "[info] 安装依赖..."
pnpm install --frozen-lockfile

echo "[info] 同步 Prisma Schema -> 数据库"
pnpm prisma:push

echo "[info] 生成 Prisma Client"
pnpm prisma:generate

echo "[info] 构建生产版本"
pnpm build

trap 'echo "\n[info] 关闭生产服务器"' EXIT

echo "[info] 启动 Next.js 生产服务器"
pnpm start
