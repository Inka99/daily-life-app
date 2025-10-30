#!/bin/bash

# 每日生活应用 - Vercel部署脚本

echo "🚀 开始部署每日生活应用到Vercel..."

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装，请先安装："
    echo "npm i -g vercel"
    exit 1
fi

# 检查是否已登录Vercel
if ! vercel whoami &> /dev/null; then
    echo "📝 请先登录Vercel："
    vercel login
fi

# 检查必要文件是否存在
required_files=("index.html" "manifest.json" "sw.js" "vercel.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    fi
done

echo "✅ 所有检查通过，开始部署..."

# 部署到Vercel
vercel --prod

echo "🎉 部署完成！"
echo ""
echo "📱 使用说明："
echo "1. 在手机浏览器中打开部署后的URL"
echo "2. 点击浏览器菜单中的'添加到主屏幕'"
echo "3. 确认安装应用"
echo "4. 从主屏幕启动应用即可使用"