#!/bin/bash

echo "🚀 每日生活应用自动部署脚本"
echo "================================"

# 检查当前目录
if [[ ! -f "index.html" ]]; then
    echo "❌ 错误：请在 daily-life-app 目录中运行此脚本"
    exit 1
fi

echo "✅ 项目目录确认正确"

# 检查Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装，正在安装..."
    npm i -g vercel
    if [ $? -eq 0 ]; then
        echo "✅ Vercel CLI安装成功"
    else
        echo "❌ Vercel CLI安装失败"
        exit 1
    fi
fi

echo "✅ Vercel CLI已就绪"

# 检查登录状态
echo "🔍 检查Vercel登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "⚠️  需要登录Vercel"
    echo ""
    echo "请手动执行以下命令："
    echo "1. vercel login"
    echo "2. 选择登录方式（推荐GitHub）"
    echo "3. 登录完成后，再次运行此脚本"
    echo ""

    # 尝试自动登录
    echo "🔄 尝试自动登录..."
    vercel login

    if ! vercel whoami &> /dev/null; then
        echo "❌ 自动登录失败，请手动登录"
        exit 1
    fi
fi

echo "✅ Vercel登录成功"

# 验证必要文件
echo "🔍 验证项目文件..."
required_files=("index.html" "manifest.json" "sw.js" "vercel.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done
echo "✅ 所有必要文件齐全"

# 显示部署信息
echo ""
echo "📋 部署信息："
echo "   项目名称: daily-life-app"
echo "   部署环境: production"
echo "   预计耗时: 2-5分钟"
echo ""

# 执行部署
echo "🚀 开始部署到Vercel..."
echo "   如果提示选择项目范围，请选择你的个人账号"
echo ""

# 尝试部署
if vercel --prod --yes; then
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📱 下一步操作："
    echo "1. 在手机浏览器中打开上方的URL"
    echo "2. 查找'添加到主屏幕'选项"
    echo "3. 确认安装应用到主屏幕"
    echo "4. 从主屏幕启动应用"
    echo ""
    echo "✨ 享受你的每日生活管理应用！"
else
    echo ""
    echo "❌ 部署失败"
    echo ""
    echo "🔧 故障排除建议："
    echo "1. 检查网络连接"
    echo "2. 重新登录: vercel logout && vercel login"
    echo "3. 查看详细错误信息"
    echo "4. 尝试手动部署到Vercel网站"
    echo ""
    echo "📖 详细指南请查看: MANUAL_DEPLOY.md"
    exit 1
fi