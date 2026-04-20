# Build stage - 使用 Node 20 Alpine
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
RUN apk add --no-cache libc6-compat

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 terser 用于极限压缩）
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# 复制源代码
COPY . .

# 构建参数：用于构建时的默认值
ARG VITE_API_BASE=/api/v1
ENV VITE_API_BASE=$VITE_API_BASE

# 生产环境构建（启用极限压缩）
ENV NODE_ENV=production
RUN npm run build

# Runtime stage: 使用 Alpine + 最小化 nginx
FROM alpine:3.20

# 只安装 nginx 和必要依赖
RUN apk add --no-cache nginx tzdata && \
    rm -rf /var/cache/apk/* /tmp/*

# 创建必要的目录
RUN mkdir -p /run/nginx /usr/share/nginx/html

# 设置时区
ENV TZ=Asia/Shanghai

# 复制自定义 nginx 配置（极限 gzip 压缩）
COPY nginx.conf /etc/nginx/http.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 entrypoint 脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80

# 使用自定义 entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
