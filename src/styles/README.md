# CSS 样式架构规范

## 目录结构

```
src/styles/
├── index.css        # 入口文件 - 导入所有模块
├── variables.css    # CSS 变量定义
├── base.css         # 基础样式 (body, selection)
├── components.css   # 组件样式 (按钮、卡片、输入框等)
├── animations.css   # 动画效果
├── markdown.css     # Markdown 内容样式
├── scrollbar.css    # 滚动条样式
└── utilities.css    # 工具类 (时间线、滑块等)
```

## 导入顺序

**顺序很重要**，在 `index.css` 中按以下顺序导入：

1. `variables.css` - 变量必须最先加载
2. `base.css` - 基础样式
3. `components.css` - 组件依赖变量
4. `animations.css` - 动画
5. `markdown.css` - 内容样式
6. `scrollbar.css` - 滚动条
7. `utilities.css` - 工具类

## CSS 变量命名规范

### 命名格式

```css
--{类别}-{用途}[-状态]
```

### 类别前缀

| 前缀      | 说明      | 示例                                |
| --------- | --------- | ----------------------------------- |
| 无        | 主色/布局 | `--primary`, `--radius-large`       |
| `text-`   | 文字颜色  | `--text-90`, `--text-50`            |
| `btn-`    | 按钮相关  | `--btn-content`, `--btn-regular-bg` |
| `border-` | 边框      | `--border-light`, `--border-medium` |
| `line-`   | 线条      | `--line-divider`, `--line-color`    |
| `link-`   | 链接      | `--link-underline`, `--link-hover`  |
| `code-`   | 代码块    | `--codeblock-bg`                    |

### 文字透明度层级

```css
--text-90  /* 标题 - 90% 不透明度 */
--text-75  /* 正文 - 75% 不透明度 */
--text-50  /* 次要文字 - 50% 不透明度 */
--text-30  /* 辅助文字 - 30% 不透明度 */
```

### 按钮状态

```css
--btn-regular-bg        /* 默认 */
--btn-regular-bg-hover  /* 悬停 */
--btn-regular-bg-active /* 激活 */
```

## 组件类命名规范

### 命名格式

```css
.{类别}-{变体}[-状态]
```

### 按钮类

| 类名               | 用途                      |
| ------------------ | ------------------------- |
| `.btn-plain`       | 透明背景按钮              |
| `.btn-regular`     | 常规按钮                  |
| `.btn-card`        | 卡片按钮                  |
| `.scale-animation` | 缩放动画 (配合 btn-plain) |
| `.ripple`          | 水波纹效果                |

### 卡片类

| 类名           | 用途     |
| -------------- | -------- |
| `.card-base`   | 基础卡片 |
| `.card-shadow` | 卡片阴影 |
| `.float-panel` | 浮动面板 |

### 文字类

| 类名       | 用途     |
| ---------- | -------- |
| `.text-90` | 标题文字 |
| `.text-75` | 正文文字 |
| `.text-50` | 次要文字 |
| `.text-30` | 辅助文字 |

## 动画类命名

| 类名                | 用途              |
| ------------------- | ----------------- |
| `.onload-animation` | 页面加载动画      |
| `.fade-in-up`       | 淡入上移          |
| `.scale-animation`  | 缩放动画          |
| `.breathing`        | 呼吸动画          |
| `.expand-animation` | 展开动画 (Fuwari) |

## 深色模式

所有深色模式变量在 `.dark` 类下重新定义：

```css
:root {
	--primary: oklch(0.7 0.14 var(--hue));
}

.dark {
	--primary: oklch(0.75 0.14 var(--hue));
}
```

## 色调系统

使用 `oklch` 颜色空间，基于 `--hue` 变量动态调整：

```css
--hue: 250; /* 默认色调 */

/* 主色 */
--primary: oklch(0.7 0.14 var(--hue));

/* 调整色调只需修改 --hue 值 */
```

## 添加新样式指南

### 1. 新变量

添加到 `variables.css`，同时定义亮色和暗色模式：

```css
:root {
	--new-variable: value;
}

.dark {
	--new-variable: dark-value;
}
```

### 2. 新组件

添加到 `components.css`，使用 `@layer components`：

```css
@layer components {
	.new-component {
		/* 样式 */
	}
}
```

### 3. 新动画

添加到 `animations.css`：

```css
.new-animation {
	animation: newAnim 0.3s ease-out;
}

@keyframes newAnim {
	/* 关键帧 */
}
```

### 4. 新工具类

添加到 `utilities.css`，使用 `@layer utilities`：

```css
@layer utilities {
	.new-utility {
		/* 样式 */
	}
}
```
