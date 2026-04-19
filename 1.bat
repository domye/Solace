@echo off
chcp 65001 >nul
echo ==============================================
echo        Windows 并行构建 Docker 镜像
echo          前后端同时构建 + 同时推送
echo ==============================================
echo.

:: 定义镜像名称（你可以直接改这里）
set BACKEND_IMAGE=domye/blog-backend:latest
set FRONTEND_IMAGE=domye/blog-frontend:latest

:: ====================== 并行构建 ======================
echo [1/2] 开始 同时构建 前后端镜像...
echo 后端：docker build -t %BACKEND_IMAGE% ./blog-backend
echo 前端：docker build -t %FRONTEND_IMAGE% ./blog-frontend
echo.

:: 启动两个独立窗口同时构建（后台运行）
start /B docker build -t %BACKEND_IMAGE% ./blog-backend
start /B docker build -t %FRONTEND_IMAGE% ./blog-frontend

:: 等待两个构建全部完成
echo 等待构建完成...
:wait_build
tasklist | find /i "docker.exe" >nul
if not errorlevel 1 goto wait_build

echo.
echo ? 前后端镜像 同时构建完成！
echo.

:: ====================== 并行推送 ======================
echo [2/2] 开始 同时推送 前后端到 Docker Hub...
echo 推送后端：docker push docker.io/%BACKEND_IMAGE%
echo 推送前端：docker push docker.io/%FRONTEND_IMAGE%
echo.

:: 同时推送两个镜像
start /B docker push docker.io/%BACKEND_IMAGE%
start /B docker push docker.io/%FRONTEND_IMAGE%

:: 等待推送全部完成
echo 等待推送完成...
:wait_push
tasklist | find /i "docker.exe" >nul
if not errorlevel 1 goto wait_push

echo.
echo ==============================================
echo ? 所有任务完成！
echo 后端：docker.io/%BACKEND_IMAGE%
echo 前端：docker.io/%FRONTEND_IMAGE%
echo ==============================================
pause