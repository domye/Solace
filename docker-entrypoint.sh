#!/bin/sh
# Docker entrypoint 脚本
# 在容器启动时将运行时环境变量注入到 index.html 中

# 设置默认值
VITE_API_BASE=${VITE_API_BASE:-/api/v1}

# 创建运行时配置脚本，插入到 index.html 的 head 中
RUNTIME_CONFIG="<script>window.__RUNTIME_CONFIG__={API_BASE:\"${VITE_API_BASE}\"};</script>"

# 在 </head> 前插入配置脚本
sed -i "s|</head>|${RUNTIME_CONFIG}</head>|" /usr/share/nginx/html/index.html

# 启动 Nginx
exec nginx -g 'daemon off;'