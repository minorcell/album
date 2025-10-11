# Simple development Dockerfile for Studio Album
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "dev"]
