#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[error] 未找到 pnpm，请先安装 pnpm" >&2
  exit 1
fi

echo "[info] 安装依赖..."
pnpm install --frozen-lockfile

if command -v docker >/dev/null 2>&1 && command -v docker compose >/dev/null 2>&1; then
  echo "[info] 启动 MySQL (docker compose)..."
  docker compose up -d mysql

  echo "[info] 等待 MySQL 就绪..."
  until docker compose exec -T mysql mysqladmin ping -h "localhost" --silent >/dev/null 2>&1; do
    sleep 2
  done
else
  echo "[warn] 未检测到 docker compose，请确保 MySQL 已手动启动并与 .env 配置一致"
fi

echo "[info] 同步 Prisma Schema -> 数据库"
pnpm prisma:push

echo "[info] 生成 Prisma Client"
pnpm prisma:generate

trap 'echo "\n[info] 关闭开发服务器"' EXIT

echo "[info] 启动 Next.js 开发服务器"
pnpm dev
