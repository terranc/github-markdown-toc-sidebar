# GitHub Markdown 目录侧边栏

[English](README.md) | [中文](README-zh.md)

一个 Chrome 浏览器扩展，为 GitHub Markdown 页面添加浮动目录侧边栏，让长文档导航更加便捷。

![演示](https://user-images.githubusercontent.com/your-username/your-screenshot.png)

## 功能特性

- **自动生成目录**：自动从任何 GitHub Markdown 页面提取标题（H1-H4）并生成目录
- **智能定位**：自动在 Markdown 内容旁边定位，避免 CSS 溢出裁剪问题
- **滚动追踪**：在滚动浏览文档时高亮当前可见的章节
- **响应式设计**：根据可用空间自适应三种模式：
  - 完整侧边栏（宽度 ≥260px）
  - 紧凑模式（宽度 160-259px）
  - 迷你悬浮按钮模式（宽度 <160px）- 点击打开模态框
- **可自定义**：配置侧边栏位置（左/右）和显示的最大标题层级（H1-H4）
- **SPA 支持**：适配 GitHub 的 Turbo 导航，实现无缝浏览

## 安装

### 从 Chrome 应用商店安装（即将上线）

1. 访问 [Chrome 应用商店页面]()
2. 点击"添加至 Chrome"
3. 授予必要的权限

### 手动安装（开发者模式）

1. 下载或克隆本仓库：
   ```bash
   git clone https://github.com/your-username/github-markdown-toc-sidebar.git
   ```

2. 打开 Chrome 浏览器，访问 `chrome://extensions/`

3. 在右上角启用"开发者模式"

4. 点击"加载已解压的扩展程序"并选择仓库文件夹

5. 扩展图标应该会出现在 Chrome 工具栏中

## 使用方法

1. 导航到任意 GitHub 仓库的 Markdown 文件（README、wiki 等）
2. 目录侧边栏会自动出现在内容右侧
3. 点击目录中的任意标题即可跳转到对应章节
4. 使用标题栏按钮可以：
   - 切换侧边栏位置（左/右）
   - 折叠/展开侧边栏
5. 在迷你悬浮按钮模式下（窄视图），点击按钮可在模态框中打开完整目录

## 配置选项

点击 Chrome 工具栏中的扩展图标打开选项页面：

- **侧边栏位置**：选择内容左侧或右侧
- **标题层级**：选择在目录中包含哪些标题层级（H1-H4）

您的设置会自动保存，如果您已登录 Chrome，还会在所有设备间同步。

## 浏览器兼容性

- Chrome 88+（Manifest V3）
- Edge 88+（基于 Chromium）
- 其他支持 Manifest V3 的 Chromium 浏览器

## 开发

本扩展没有构建步骤。要修改代码：

1. 直接编辑源文件
2. 在 `chrome://extensions/` 中刷新扩展
3. 重新加载任意 GitHub 页面查看更改

### 文件概述

- `manifest.json` - 扩展配置和权限
- `content.js` - 目录提取和侧边栏渲染的主逻辑
- `content.css` - 侧边栏样式和响应式行为
- `options.html/js/css` - 扩展设置页面
- `icons/` - 各种尺寸的扩展图标

## 贡献

欢迎贡献！请随时提交 Pull Request。对于重大更改，请先打开 Issue 讨论您想要更改的内容。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- 灵感来源于在 GitHub 长文档中导航的需求
- 图标使用 GitHub 的 Primer 设计系统
- 感谢所有本扩展的贡献者和用户
