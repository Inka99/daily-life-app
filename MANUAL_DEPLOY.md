# 🚀 手动部署指南

## 情况说明
由于Vercel CLI需要交互式登录，我无法直接执行部署。请按照以下步骤手动完成部署。

## 方法一：使用Vercel CLI（推荐）

### 1. 确保在正确的目录
```bash
cd /Users/InkaTC/daily-life-app
```

### 2. 登录Vercel
```bash
vercel login
```
选择登录方式（推荐GitHub）

### 3. 执行部署
```bash
vercel --prod
```

### 4. 确认部署
- 选择项目范围（推荐链接到你的账号）
- 确认项目设置
- 等待部署完成

## 方法二：使用Vercel网站（最简单）

### 1. 压缩项目文件
```bash
# 在 daily-life-app 文件夹上右键压缩为 zip 文件
```

### 2. 访问Vercel
- 打开 https://vercel.com
- 使用你的GitHub账号登录

### 3. 部署项目
- 点击 "New Project"
- 拖拽 zip 文件到部署区域
- 等待部署完成

## 方法三：GitHub集成（推荐长期使用）

### 1. 初始化Git仓库
```bash
cd /Users/InkaTC/daily-life-app
git init
git add .
git commit -m "Initial commit: Daily Life App"
```

### 2. 推送到GitHub
```bash
# 创建GitHub仓库后
git remote add origin https://github.com/你的用户名/daily-life-app.git
git branch -M main
git push -u origin main
```

### 3. 在Vercel中导入
- 访问 https://vercel.com
- 点击 "New Project"
- 选择你的GitHub仓库
- 点击 "Deploy"

## 部署完成后

### ✅ 验证功能
- 在浏览器中打开部署后的URL
- 测试所有功能模块
- 确认PWA功能正常

### 📱 安装到手机
1. 在手机浏览器中打开URL
2. 查找"添加到主屏幕"选项
3. 确认安装应用
4. 从主屏幕启动使用

## 预期结果

部署成功后你将获得：
- 🌐 一个在线URL (如 `https://daily-life-app-xxx.vercel.app`)
- 📱 可安装的PWA应用
- 📴 离线使用支持
- ⚡ 全球CDN加速

## 故障排除

如果遇到问题：
1. 确保所有文件都在 `daily-life-app` 文件夹中
2. 检查网络连接
3. 尝试清理Vercel缓存：`vercel logout && vercel login`
4. 查看Vercel部署日志获取详细错误信息