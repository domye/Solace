#!/bin/bash
# Docker 镜像构建脚本
# 用于构建前后端镜像并推送到 Docker Hub

set -e

# 配置
IMAGE_PREFIX="domye"
FRONTEND_IMAGE="blog-frontend"
BACKEND_IMAGE="blog-backend"
VERSION="${1:-latest}"

echo "=== 博客系统 Docker 构建 ==="
echo "版本: $VERSION"
echo ""

# 构建前端
echo ">>> 构建前端镜像..."
cd frontend
docker build \
    --build-arg VITE_API_BASE=/api/v1 \
    -t ${IMAGE_PREFIX}/${FRONTEND_IMAGE}:${VERSION} \
    -t ${IMAGE_PREFIX}/${FRONTEND_IMAGE}:latest \
    .
cd ..

echo ""

# 构建后端
echo ">>> 构建后端镜像..."
cd backend
docker build \
    -t ${IMAGE_PREFIX}/${BACKEND_IMAGE}:${VERSION} \
    -t ${IMAGE_PREFIX}/${BACKEND_IMAGE}:latest \
    .
cd ..

echo ""
echo "=== 构建完成 ==="
echo "前端: ${IMAGE_PREFIX}/${FRONTEND_IMAGE}:${VERSION}"
echo "后端: ${IMAGE_PREFIX}/${BACKEND_IMAGE}:${VERSION}"
echo ""

# 可选：推送镜像
if [ "$2" = "push" ]; then
    echo ">>> 推送镜像到 Docker Hub..."
    docker push ${IMAGE_PREFIX}/${FRONTEND_IMAGE}:${VERSION}
    docker push ${IMAGE_PREFIX}/${FRONTEND_IMAGE}:latest
    docker push ${IMAGE_PREFIX}/${BACKEND_IMAGE}:${VERSION}
    docker push ${IMAGE_PREFIX}/${BACKEND_IMAGE}:latest
    echo ">>> 推送完成"
fi

echo ""
echo "=== 部署命令 ==="
echo "docker-compose pull && docker-compose up -d"