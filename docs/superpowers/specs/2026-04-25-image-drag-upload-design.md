# 图片拖拽上传设计文档

## 功能目标

为管理端文章编辑页新增“本地图片拖拽上传”能力，覆盖两个区域：

1. **Markdown 编辑区**
   - 支持把本地图片拖入编辑器区域
   - 上传后按现有粘贴逻辑，在当前光标位置插入 Markdown 图片链接
   - 支持一次拖入多张图片

2. **封面图片输入区**
   - 支持把本地图片拖入封面输入区域
   - 上传后将返回的图片 URL 直接写入封面输入框
   - 一次拖入多张时只取第一张，其余忽略

## 设计方案

采用方案 B：抽一个通用 `useImageDropUpload` hook，统一处理拖拽态、文件过滤、上传调用和错误状态；Markdown 编辑器与封面区分别接入它，只负责定义“上传成功后怎么落地”。

## 结构设计

### 1. 通用 hook

新增：
- `frontend/src/hooks/useImageDropUpload.ts`

职责：
- 维护拖拽高亮状态：`isDragActive`
- 维护上传状态：`isUploading`、`uploadingCount`
- 维护错误状态：`error`
- 暴露拖拽事件绑定：
  - `onDragEnter`
  - `onDragOver`
  - `onDragLeave`
  - `onDrop`
- 过滤文件：仅接收 `image/*`
- 根据配置决定多图策略：
  - `multiple`
  - `maxFiles`
- 统一调用上传 API：`frontend/src/api/index.ts:177`

建议输入参数：
- `multiple?: boolean`
- `maxFiles?: number`
- `onUploadSuccess: (files: File[], urls: string[]) => Promise<void> | void`
- `onUploadError?: (error: Error) => void`

hook 负责“怎么接拖拽、怎么上传、状态是什么”，调用方只负责“上传成功后怎么处理结果”。

### 2. Markdown 编辑器

目标文件：
- `frontend/src/components/admin/MarkdownEditor.tsx`

保留并复用现有逻辑：
- `uploadImageAsMarkdown(...)` at `frontend/src/components/admin/MarkdownEditor.tsx:93`
- `insertMarkdown(...)` at `frontend/src/components/admin/MarkdownEditor.tsx:107`
- `handlePaste(...)` at `frontend/src/components/admin/MarkdownEditor.tsx:137`

设计：
- 接入 `useImageDropUpload`
- 配置为支持多图
- drop 成功后，将返回 URL 列表转换成和粘贴上传一致的 Markdown：
  - alt 文本来自文件名去扩展名
  - 若开启 `appendWidthToPastedImages`，继续附加默认宽度参数
- 将生成的 Markdown 批量传给 `insertMarkdown(...)`
- 粘贴上传与拖拽上传尽量共用同一套“文件 -> URL -> Markdown -> 插入”流程，避免逻辑分叉

预期行为：
- 用户把图片拖进编辑区
- 出现轻量高亮和“松手上传”提示
- 松手后上传
- 上传完成后在当前光标位置插入 Markdown 图片链接
- 多张图片按现有粘贴风格以空行分隔插入
- 出错时复用现有错误提示区

### 3. 封面图片输入区

目标文件：
- `frontend/src/pages/admin/ArticleEditorPage.tsx`

当前封面字段位于：
- `frontend/src/pages/admin/ArticleEditorPage.tsx:169`

设计：
- 在现有封面 `InputField` 外包一层轻量 drop 容器
- 接入 `useImageDropUpload`
- 配置为 `maxFiles: 1`
- 即使实际拖入多张，也只消费第一张图片
- 上传成功后直接调用 `setCoverImage(url)`
- 不改 `InputField` 组件本身的通用职责，避免把拖拽上传能力耦合进所有输入框

预期行为：
- 用户把图片拖到封面区域
- 出现轻量高亮和“松手上传”提示
- 松手后上传第一张图片
- 上传成功后把 URL 自动填入封面输入框
- 上传失败时显示错误提示，但不清空或覆盖已有值
- 用户仍然可以继续手动编辑 URL

## 数据流

### Markdown 编辑区

1. 用户拖入 1 张或多张本地图片
2. hook 过滤出 `image/*`
3. hook 进入上传中状态并上传图片
4. `MarkdownEditor` 在成功回调里把 URL 转成 Markdown
5. 使用现有 `insertMarkdown(...)` 插入到当前光标位置
6. 失败时显示现有错误提示

### 封面区

1. 用户拖入 1 张或多张本地图片
2. hook 只取第一张图片
3. 上传成功后把 URL 传给 `setCoverImage`
4. 输入框立即显示该 URL
5. 失败时在封面区域显示错误提示

## 交互与视觉反馈

两处都采用轻量方案：

- 拖拽进入时：
  - 边框高亮
  - 背景轻微强调
  - 提示文案：`松手上传`
- 上传中时：
  - 编辑器继续使用现有上传中浮层
  - 封面区显示轻量上传中提示
- 拖入非图片文件时：
  - 不接收
  - 不做复杂弹窗，直接忽略或维持默认状态

## 边界与约束

- 仅支持本地文件拖拽
- 不处理网页图片 URL 拖入
- 编辑区支持多图
- 封面区多图时只取第一张
- 上传 API 继续统一走 `frontend/src/api/index.ts:177`
- 不修改后端接口形状
- 不改动 `InputField` 的通用抽象边界
- 不额外引入新上传库

## 测试方案

### 1. hook 单测
- 单张图片拖入时触发上传
- 多张图片时 obey `maxFiles`
- 非图片文件不会上传
- 上传失败时返回错误状态

### 2. MarkdownEditor 测试
- drop 单张图片后，`onChange` 收到正确 Markdown
- drop 多张图片后，按空行分隔插入多段 Markdown
- 宽度参数开启时，生成 URL 包含默认宽度参数
- 上传失败时显示错误提示

### 3. ArticleEditorPage / 封面区测试
- drop 单张图片后，`coverImage` 更新为返回 URL
- drop 多张图片时只取第一张
- 上传失败时显示错误且不覆盖原值

### 4. 浏览器验证
- 管理端文章编辑页实际测试：
  - 拖入编辑区
  - 拖入封面框
  - 多图拖入
  - 上传失败提示
  - 拖拽高亮态
  - 上传中状态

## 预计修改文件

- 新增：`frontend/src/hooks/useImageDropUpload.ts`
- 修改：`frontend/src/components/admin/MarkdownEditor.tsx`
- 修改：`frontend/src/pages/admin/ArticleEditorPage.tsx`
- 可能新增测试文件：
  - `frontend/src/hooks/useImageDropUpload.test.ts`
  - `frontend/src/components/admin/MarkdownEditor.test.tsx`
  - `frontend/src/pages/admin/ArticleEditorPage.test.tsx`

## 非目标

本次不包含：
- 外部图片 URL 拖拽解析
- 拖拽到精确落点位置插入
- 封面图预览弹窗/裁剪
- 通用 `ImageDropZone` 组件抽象
- 项目封面、头像等其他页面同步接入
