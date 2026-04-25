# 用 Solace 搭建个人博客

这份说明是给当前工作区准备的个人部署路径，和仓库原来的 `docker-compose.yml` 分开使用。

## 先说结论

仓库原本自带的 `docker-compose.yml` 更偏向作者自己的服务器环境：

- 它依赖外部 `1panel-network`
- 它使用的是作者发布好的镜像，而不是你本地改过的代码
- 它没有自带 PostgreSQL 服务

所以如果你想把它作为自己的博客来搭，建议优先使用这次新增的这几份文件：

- `docker-compose.personal.yml`
- `.env.personal.example`
- `config.personal.toml.example`

## 这个项目最关键的 3 个认知

1. 管理员账号不在数据库里，而是在 `config.toml` 里定义。
2. 文章、分类、标签、页面等内容在 PostgreSQL 里。
3. 生产环境对外暴露前端即可，前端会把 `/api` 反向代理到后端。

## 第一步：准备个人配置

在仓库根目录执行以下动作：

```powershell
Copy-Item .env.personal.example .env.personal
Copy-Item config.personal.toml.example config.personal.toml
```

然后重点修改两个文件。

### 修改 `.env.personal`

至少改这些值：

- `POSTGRES_PASSWORD`
- `SITE_BASE_URL`
- `SITE_NAME`
- `SITE_DESCRIPTION`

### 修改 `config.personal.toml`

至少改这些值：

- `[database]` 里的用户名、密码、数据库名
- `[jwt].secret`
- `[admin]` 里的邮箱、密码、昵称、简介、GitHub
- `[site].base_url`
- `[server].allowed_origins`

注意：

- `config.personal.toml` 里的数据库配置要和 `.env.personal` 保持一致
- 管理员登录邮箱和密码以后就是后台登录凭据

## 第二步：本地启动 Docker 版本

```powershell
docker compose --env-file .env.personal -f docker-compose.personal.yml up --build -d
```

启动后默认地址：

- 前端首页：`http://localhost:8088`
- 后端 API：`http://localhost:8080/api/v1`
- Swagger：`http://localhost:8080/swagger/index.html`

## 第三步：验证是否启动成功

你可以优先检查这几个点：

1. 打开首页是否能看到站点。
2. 打开 `http://localhost:8080/api/v1/health` 是否返回健康检查结果。
3. 用你在 `config.personal.toml` 里填写的管理员邮箱和密码登录后台。

## 第四步：开始做你的个人化内容

建议第一轮先改这些内容：

1. 站点名称和描述
2. 站长昵称、头像、简介、GitHub 链接
3. 第一篇自我介绍文章
4. 关于页
5. 导航页

## 第五步：部署到你的服务器

推荐的上线结构：

1. 服务器上运行这套 `docker-compose.personal.yml`
2. 只把前端端口暴露给公网
3. 用 Nginx、Caddy 或 1Panel 反向代理你的域名到前端端口
4. 给域名加 HTTPS

推荐映射关系：

- 域名 `blog.example.com` -> 服务器 `FRONTEND_PORT`
- 后端 `8080` 只保留本机访问
- PostgreSQL 不对公网开放

## 第六步：后面值得继续做的优化

等你第一版跑起来后，我们可以继续一起做：

1. 改默认视觉风格，做成更像你自己的博客
2. 增加文章封面、友链、项目页
3. 补服务器备份和数据库备份
4. 把部署流程整理成一键更新脚本
5. 加监控和日志轮转

## 我对你这条路线的建议

如果目标是“尽快上线自己的博客”，最稳的顺序是：

1. 先用 Docker 在本地跑起来
2. 确认后台能登录、文章能发布
3. 再改视觉和内容
4. 最后迁到服务器和域名

不要一开始就把本地调试、主题改造、服务器部署、HTTPS、SEO 一起做，不然很容易同时卡在多处。
