<div align="center">

# Solace

**一个现代化的全栈博客系统**

[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go)](https://golang.org/)
[![React Version](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [架构设计](#-架构设计) • [API 文档](#-api-文档)

English | [**简体中文**](./README_CN.md)

![](./banner.jpg)

</div>

---

## 项目简介

**Solace** 是一个生产就绪的**全栈博客系统**，采用 **Go (Golang)**、**React**、**TypeScript** 和 **PostgreSQL** 构建。后端基于 Go 语言的高性能 **Clean Architecture（整洁架构）**，前端采用响应式 React 设计，提供卓越的开发体验。

非常适合作为**个人博客**、**技术博客**、**开发者博客**、**个人网站**使用。也是学习**全栈开发**、**整洁架构**、**REST API 设计**、**Docker 部署**的理想项目。

系统支持 **Markdown 文章管理**、**分类标签组织**、**相册展示**、**访客足迹可视化**、**SEO 优化**以及**深色模式**等功能。

## ✨ 功能特性

### 内容管理

- 📝 **Markdown 编辑器** - 完整的 Markdown 支持，代码语法高亮
- 🏷️ **分类与标签** - 灵活的内容组织系统
- 🖼️ **相册展示** - 图片懒加载与灯箱查看器
- 🔍 **全文搜索** - 快速文章搜索功能

### 用户体验

- 📊 **访客足迹** - 基于 ECharts 的世界地图可视化
- 🌙 **深色模式** - 自动跟随系统偏好
- 📱 **响应式设计** - 移动优先，适配所有设备
- ⚡ **性能优化** - 代码分割、懒加载、CDN 就绪

### 技术亮点

- 🔐 **JWT 认证** - 安全的用户身份验证
- 📖 **自动 API 文档** - Swagger/OpenAPI 文档自动生成
- 🐳 **Docker 就绪** - 容器化部署
- 🔄 **热重载** - 快速开发迭代

## 🛠 技术栈

### 后端

| 类别     | 技术             |
| -------- | ---------------- |
| 语言     | Go 1.25+         |
| 框架     | Gin              |
| ORM      | GORM             |
| 数据库   | PostgreSQL       |
| 认证     | JWT (golang-jwt) |
| 日志     | zerolog          |
| API 文档 | Swagger (swaggo) |
| 配置     | TOML             |

### 前端

| 类别       | 技术                  |
| ---------- | --------------------- |
| 框架       | React 18              |
| 语言       | TypeScript 5.6        |
| 构建工具   | Vite 6                |
| 样式       | Tailwind CSS 3        |
| 服务端状态 | TanStack Query        |
| 客户端状态 | Zustand               |
| 路由       | React Router 7        |
| 表单       | React Hook Form + Zod |
| 图表       | ECharts               |
| 图标       | Iconify               |

## 📦 项目结构

```
.
├── backend/                    # Go 后端服务
│   ├── cmd/                    # 应用程序入口
│   │   └── server/main.go      # 服务启动入口
│   ├── internal/               # 私有应用代码
│   │   ├── handler/            # HTTP 处理器（控制器）
│   │   ├── service/            # 业务逻辑层
│   │   ├── repository/         # 数据访问层
│   │   ├── model/              # 领域实体
│   │   ├── middleware/         # HTTP 中间件
│   │   └── docs/               # Swagger 文档
│   ├── migrations/             # 数据库迁移
│   ├── config.toml.example     # 配置模板
│   ├── Dockerfile              # 后端容器
│   └── Makefile                # 构建自动化
│
├── frontend/                   # React 前端应用
│   ├── src/
│   │   ├── components/         # 可复用 UI 组件
│   │   │   ├── ui/             # 基础 UI 原语
│   │   │   └── layout/         # 布局组件
│   │   ├── features/           # 功能模块
│   │   │   ├── articles/       # 文章功能
│   │   │   ├── auth/           # 认证功能
│   │   │   ├── gallery/        # 相册功能
│   │   │   └── admin/          # 管理后台
│   │   ├── hooks/              # 自定义 React Hooks
│   │   ├── api/                # API 客户端与类型
│   │   ├── stores/             # Zustand 状态存储
│   │   ├── utils/              # 工具函数
│   │   └── types/              # TypeScript 类型定义
│   ├── public/                 # 静态资源
│   ├── Dockerfile              # 前端容器
│   └── nginx.conf              # Nginx 配置
│
├── docker-compose.yml          # Docker Compose 编排
├── build-docker.sh             # Docker 构建脚本
└── README.md                   # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- **Go** 1.25 或更高版本
- **Node.js** 18 或更高版本
- **PostgreSQL** 15 或更高版本
- **Docker**（可选，用于容器化部署）

### 方式一：本地开发

#### 1. 克隆仓库

```bash
git clone https://github.com/domye/Solace.git
cd Solace
```

#### 2. 后端设置

```bash
cd backend

# 复制并配置环境变量
cp config.toml.example config.toml
# 编辑 config.toml 填写数据库连接信息

# 安装依赖并运行
go mod download
go run cmd/server/main.go
```

后端服务运行于 `http://localhost:8080`

#### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用运行于 `http://localhost:5173`

### 方式二：Docker 部署

```bash
# 创建配置目录
mkdir -p config
cp backend/config.toml.example config/config.toml

# 编辑配置文件
# vim config/config.toml

# 启动所有服务
docker-compose up -d
```

服务地址：

- 前端：`http://localhost:8088`
- 后端 API：`http://localhost:8080`
- API 文档：`http://localhost:8080/swagger/index.html`

## 🏗 架构设计

### 后端架构（Clean Architecture）

```
┌─────────────────────────────────────────────────────────────┐
│                        Handler 层                            │
│                  （HTTP 请求/响应处理）                       │
├─────────────────────────────────────────────────────────────┤
│                        Service 层                            │
│                   （业务逻辑与编排）                          │
├─────────────────────────────────────────────────────────────┤
│                       Repository 层                          │
│                    （数据访问与查询）                         │
├─────────────────────────────────────────────────────────────┤
│                        Model 层                              │
│                      （领域实体）                             │
└─────────────────────────────────────────────────────────────┘
```

### 前端架构

```
┌─────────────────────────────────────────────────────────────┐
│                          Pages                               │
│                   （React Router 路由页面）                   │
├─────────────────────────────────────────────────────────────┤
│                        Features                              │
│             （功能模块化组织）                                │
├─────────────────────────────────────────────────────────────┤
│                       Components                             │
│                 （可复用 UI 组件）                            │
├─────────────────────────────────────────────────────────────┤
│                         Hooks                                │
│           （数据与行为的自定义 Hooks）                        │
├─────────────────────────────────────────────────────────────┤
│                 API Client & Stores                          │
│      （TanStack Query + Zustand 状态管理）                   │
└─────────────────────────────────────────────────────────────┘
```

## 📖 API 文档

启动后端后，访问 Swagger 文档：

```
http://localhost:8080/swagger/index.html
```

### API 端点概览

| 方法     | 端点                     | 描述               |
| -------- | ------------------------ | ------------------ |
| `GET`    | `/api/v1/articles`       | 获取文章列表       |
| `GET`    | `/api/v1/articles/:slug` | 根据 slug 获取文章 |
| `POST`   | `/api/v1/articles`       | 创建文章（需认证） |
| `PUT`    | `/api/v1/articles/:id`   | 更新文章（需认证） |
| `DELETE` | `/api/v1/articles/:id`   | 删除文章（需认证） |
| `GET`    | `/api/v1/categories`     | 获取分类列表       |
| `GET`    | `/api/v1/tags`           | 获取标签列表       |
| `GET`    | `/api/v1/albums`         | 获取相册列表       |
| `POST`   | `/api/v1/auth/login`     | 用户登录           |
| `POST`   | `/api/v1/auth/register`  | 用户注册           |

## 📝 可用脚本

### 后端

```bash
# 开发模式
go run cmd/server/main.go

# 构建
go build -o bin/server cmd/server/main.go

# 测试
go test ./... -cover

# 代码检查
golangci-lint run

# 生成 Swagger 文档
swag init -g cmd/server/main.go -o internal/docs
```

### 前端

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

## 🔧 配置说明

### 后端配置（config.toml）

```toml
[server]
port = 8080
mode = "debug"  # debug, release, test

[database]
host = "localhost"
port = 5432
name = "blog"
user = "postgres"
password = "your_password"

[jwt]
secret = "your_jwt_secret"
expire = 24  # hours
```

### 前端环境变量

| 变量               | 描述          | 默认值    |
| ------------------ | ------------- | --------- |
| `VITE_API_BASE`    | 后端 API 地址 | `/api/v1` |
| `SITE_BASE_URL`    | 站点基础 URL  | -         |
| `SITE_NAME`        | 站点名称      | `Solace`  |
| `SITE_DESCRIPTION` | 站点描述      | -         |

## 🤝 参与贡献

欢迎参与贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Gin](https://github.com/gin-gonic/gin) - HTTP Web 框架
- [GORM](https://gorm.io/) - ORM 库
- [React](https://react.dev/) - UI 库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [TanStack Query](https://tanstack.com/query) - 数据请求库

---

<div align="center">

**[⬆ 返回顶部](#solace)**

由 [domye](https://github.com/domye) 用 ❤️ 构建

</div>

---

<!-- SEO 关键词用于搜索引擎发现 -->

<!--
关键词: 博客, 博客系统, 博客平台, 个人博客, 博客引擎, 开源博客, 博客搭建, 博客建站, 博客程序, 博客模板, 博客脚手架, 博客框架, 自建博客, 个人博客搭建, 程序员博客, 技术博客, 开发者博客, 代码博客, 编程博客, 作品集博客, Go博客, React博客, TypeScript博客, Gin博客, GORM博客, PostgreSQL博客, 全栈博客, 前后端分离博客, 现代博客, Markdown博客, Markdown编辑器, 深色模式博客, SEO博客, SEO优化, 响应式博客, 移动端博客, Vite博客, Tailwind CSS博客, React 18博客, Go语言博客, Gin框架, GORM, TanStack Query, Zustand, React Router, JWT认证, JWT登录, Docker博客, Docker部署, 容器化博客, 整洁架构, Clean Architecture, DDD, 领域驱动设计, 自托管博客, 个人网站, 作品集, 内容管理系统, CMS, 相册, 图库, 分类标签, 访客统计, ECharts可视化, 地图可视化, 访客足迹, 语法高亮, 代码高亮, 懒加载, 性能优化, 高速博客, 安全博客, REST API, RESTful API, Swagger API, OpenAPI, API文档, PostgreSQL数据库, React前端, Go后端, TypeScript开发, Vite构建, Tailwind样式, Zustand状态管理, React Query, React Hook Form, Zod验证, ECharts图表, Iconify图标, Nginx服务器, JWT令牌, zerolog日志, TOML配置, GitHub开源, 免费博客, MIT许可证, 博客教程, 如何搭建博客, 博客搭建教程, 用Go搭建博客, 用React搭建博客, 全栈开发, 网站开发, 前端开发, 后端开发, 数据库设计, 软件架构, 最佳实践, 生产就绪, 可扩展博客, 可维护代码, 可测试代码, 持续集成, CI/CD, GitHub Actions, 自动化部署, 云部署, 服务器部署, Linux部署, Windows部署, macOS部署, 跨平台, 移动端友好, 渐进式网页应用, PWA, 服务端渲染, SSR, 客户端渲染, CSR, 单页应用, SPA, 多页应用, MPA, SEO友好, 搜索引擎优化, 谷歌SEO, 百度SEO, 必应SEO, 站点地图, sitemap, robots.txt, 元标签, Open Graph, Twitter Cards, 结构化数据, JSON-LD, RSS订阅, Atom订阅, 网页性能, Core Web Vitals, LCP, FID, CLS, 页面速度, 加载时间, 打包体积, Tree Shaking, 代码分割, 动态导入, 图片优化, 压缩, 混淆压缩, 缓存, CDN, 内容分发网络, 安全头, HTTPS, SSL, TLS, 加密, 密码哈希, bcrypt, SQL注入防护, XSS防护, CSRF防护, 限流, 输入验证, 错误处理, 日志, 监控, 告警, 备份, 恢复, 数据迁移, 版本控制, Git, 分支策略, 代码审查, Pull Request, 问题追踪, 项目管理, 文档, README, CHANGELOG, CONTRIBUTING, LICENSE, 社区, 支持, 贡献, 赞助, 捐赠, Star, Fork, Watch, 关注, 分享, 点赞, 评论, 反馈, 功能请求, Bug报告, 改进, 更新, 升级, 更新日志, 发布说明, 版本历史, 路线图, 未来计划, 开发状态, 维护, 积极开发, 稳定版本, 最新版本, 下载, 安装, 设置, 配置, 自定义, 主题, 插件, 扩展, 集成, 第三方, 分析, Google Analytics, 百度统计, 多语言, i18n, 国际化, 本地化, 翻译, 可访问性, a11y, WCAG, ADA合规, 屏幕阅读器, 键盘导航, ARIA, 语义化HTML, 网页标准, W3C, HTML5, CSS3, ES6, ES2023, JavaScript, JS, TS, Node.js, npm, yarn, pnpm, 包管理器, 依赖管理, 版本锁定, 安全审计, 漏洞扫描, Dependabot, 自动更新, 破坏性变更, 废弃, 旧版支持, 浏览器支持, 兼容性, 后备方案, 优雅降级, 渐进增强, 特性检测, 设备检测, 响应式图片, WebP, AVIF, 图片格式, 矢量图形, SVG, Canvas, WebGL, 动画, 过渡, 变换, CSS Grid, Flexbox, 布局, 排版, 字体, Google Fonts, 自定义字体, 图标字体, SVG图标, 网站图标, favicon, 清单文件, Service Worker, 离线支持, 推送通知, 消息推送, 实时, WebSocket, SSE, Server-Sent Events, 轮询, 长轮询, 流式传输, 文件上传, 文件下载, 拖拽, 复制粘贴, 快捷键, 右键菜单, 模态框, 提示框, 弹出框, 下拉菜单, 自动完成, 搜索, 筛选, 排序, 分页, 无限滚动, 虚拟滚动, 表格, 数据网格, 表单, 验证, 提交, 成功消息, 错误消息, 加载状态, 骨架屏, 占位符, 空状态, 404页面, 错误页面, 维护模式, 即将推出, 建设中

相关项目: Hexo博客, Hugo博客, Jekyll博客, WordPress博客, Ghost博客, Gatsby博客, Next.js博客, Nuxt.js博客, Astro博客, VuePress博客, VitePress博客, Docusaurus博客, Notion博客, Medium替代, WordPress替代, Ghost替代, 博客替代方案

编程语言: Go语言, Golang, React框架, TypeScript语言, JavaScript语言, SQL语言, HTML语言, CSS语言, Markdown语言

框架工具: Gin框架, GORM框架, React框架, Vite构建工具, Tailwind CSS框架, TanStack Query, Zustand状态管理, React Router路由, React Hook Form表单, Zod验证, ECharts图表, Swagger文档, OpenAPI规范

数据库: PostgreSQL数据库, MySQL数据库, SQLite数据库, MongoDB数据库, Redis数据库, 数据库管理

部署运维: Docker容器, Docker Compose编排, Kubernetes容器编排, K8s集群, Nginx服务器, Caddy服务器, Apache服务器, IIS服务器, 反向代理, 负载均衡, 云服务, AWS云, Azure云, GCP云, 阿里云, 腾讯云, 华为云, VPS服务器, 独立服务器

开发工具: VS Code编辑器, GoLand编辑器, WebStorm编辑器, IntelliJ IDEA编辑器, Git版本控制, GitHub代码托管, GitLab代码托管, Bitbucket代码托管, CI/CD持续集成, Jenkins持续集成, CircleCI持续集成, Travis CI持续集成, GitHub Actions自动化

学习资源: 教程, 文档, 指南, 示例, 演示, 示例代码, 最佳实践, 设计模式, 架构模式, 编码规范, 代码风格

行业领域: 网站开发, 软件工程, IT技术, 互联网, 创业公司, 企业应用, 个人项目, 副业项目, 作品集, 简历, 职业, 工作, 自由职业, 远程工作

搜索词: 如何创建博客, 如何搭建博客, 最佳博客平台, 最佳开源博客, 免费博客软件, 自托管博客, 个人博客示例, 开发者博客示例, 技术博客示例, 博客与网站区别, 博客与CMS区别, 博客与社交媒体区别, 博客搭建教程, 博客建站指南, 博客程序推荐, 开源博客推荐, 免费博客系统, 自建博客教程, 个人博客搭建指南, 程序员博客搭建, 技术博客搭建教程, 博客系统对比, 博客平台对比, 博客软件对比, 博客建设, 博客运营, 博客推广, 博客变现, 博客SEO, 博客优化
-->
