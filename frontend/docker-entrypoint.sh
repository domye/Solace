#!/bin/sh
# Docker entrypoint 脚本
# 在容器启动时将运行时环境变量注入到 index.html 中

# 设置默认值
VITE_API_BASE=${VITE_API_BASE:-/api/v1}
SITE_BASE_URL=${SITE_BASE_URL:-}
SITE_NAME=${SITE_NAME:-Domyeの小屋}
SITE_DESCRIPTION=${SITE_DESCRIPTION:-记录技术与生活的点点滴滴}

# 创建运行时配置脚本，插入到 index.html 的 head 中
IMGBED_BASE=${IMGBED_BASE:-}
IMGBED_UPLOAD_TOKEN=${IMGBED_UPLOAD_TOKEN:-}
IMGBED_UPLOAD_CHANNEL=${IMGBED_UPLOAD_CHANNEL:-cfr2}
IMGBED_UPLOAD_CHANNEL_NAME=${IMGBED_UPLOAD_CHANNEL_NAME:-}
IMGBED_UPLOAD_FIELD=${IMGBED_UPLOAD_FIELD:-file}
IMGBED_UPLOAD_FOLDER=${IMGBED_UPLOAD_FOLDER:-Blog}
IMGBED_CHUNK_THRESHOLD_MB=${IMGBED_CHUNK_THRESHOLD_MB:-20}
IMGBED_CHUNK_SIZE_MB=${IMGBED_CHUNK_SIZE_MB:-8}

RUNTIME_CONFIG="<script>window.__RUNTIME_CONFIG__={API_BASE:\"${VITE_API_BASE}\",SITE_BASE_URL:\"${SITE_BASE_URL}\",SITE_NAME:\"${SITE_NAME}\",SITE_DESCRIPTION:\"${SITE_DESCRIPTION}\",IMGBED_BASE:\"${IMGBED_BASE}\",IMGBED_UPLOAD_TOKEN:\"${IMGBED_UPLOAD_TOKEN}\",IMGBED_UPLOAD_CHANNEL:\"${IMGBED_UPLOAD_CHANNEL}\",IMGBED_UPLOAD_CHANNEL_NAME:\"${IMGBED_UPLOAD_CHANNEL_NAME}\",IMGBED_UPLOAD_FIELD:\"${IMGBED_UPLOAD_FIELD}\",IMGBED_UPLOAD_FOLDER:\"${IMGBED_UPLOAD_FOLDER}\",IMGBED_CHUNK_THRESHOLD_MB:\"${IMGBED_CHUNK_THRESHOLD_MB}\",IMGBED_CHUNK_SIZE_MB:\"${IMGBED_CHUNK_SIZE_MB}\"};</script>"

# 更新默认标题为站点名称
sed -i "s|<title>Blog</title>|<title>${SITE_NAME}</title>|" /usr/share/nginx/html/index.html

# 更新 meta description
if [ -n "$SITE_DESCRIPTION" ]; then
	sed -i "s|</title>|</title><meta name=\"description\" content=\"${SITE_DESCRIPTION}\" />|" /usr/share/nginx/html/index.html
fi

# 在 </head> 前插入配置脚本
sed -i "s|</head>|${RUNTIME_CONFIG}</head>|" /usr/share/nginx/html/index.html

# 启动 Nginx
exec nginx -g 'daemon off;'
