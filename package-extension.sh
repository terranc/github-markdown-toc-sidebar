#!/bin/bash

# GitHub Markdown TOC 扩展打包脚本
# 用法: ./package-extension.sh [版本号]
# 示例: ./package-extension.sh 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取版本号
if [ -z "$1" ]; then
    VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
    echo -e "${YELLOW}未提供版本号，使用 manifest.json 中的版本: ${VERSION}${NC}"
else
    VERSION=$1
    echo -e "${BLUE}使用指定版本号: ${VERSION}${NC}"
fi

# 项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${PROJECT_DIR}/build"
DIST_DIR="${PROJECT_DIR}/dist"

# 清理旧构建
echo -e "${BLUE}清理旧构建文件...${NC}"
rm -rf "${BUILD_DIR}" "${DIST_DIR}"
mkdir -p "${BUILD_DIR}" "${DIST_DIR}"

# 需要包含的文件列表
FILES=(
    "manifest.json"
    "content.js"
    "content.css"
    "options.html"
    "options.js"
    "options.css"
    "LICENSE"
    "README.md"
    "README-zh.md"
)

# 需要包含的目录
DIRS=(
    "icons"
    "_locales"
)

# 复制文件
echo -e "${BLUE}复制文件到构建目录...${NC}"
for file in "${FILES[@]}"; do
    if [ -f "${PROJECT_DIR}/${file}" ]; then
        cp "${PROJECT_DIR}/${file}" "${BUILD_DIR}/"
        echo -e "  ${GREEN}✓${NC} ${file}"
    else
        echo -e "  ${YELLOW}⚠${NC} ${file} 不存在，跳过"
    fi
done

# 复制目录
for dir in "${DIRS[@]}"; do
    if [ -d "${PROJECT_DIR}/${dir}" ]; then
        cp -r "${PROJECT_DIR}/${dir}" "${BUILD_DIR}/"
        echo -e "  ${GREEN}✓${NC} ${dir}/"
    else
        echo -e "  ${YELLOW}⚠${NC} ${dir}/ 不存在，跳过"
    fi
done

# 验证 manifest.json
echo -e "${BLUE}验证 manifest.json...${NC}"
if [ ! -f "${BUILD_DIR}/manifest.json" ]; then
    echo -e "${RED}错误: manifest.json 不存在${NC}"
    exit 1
fi

# 检查必要字段
echo -e "${BLUE}检查必要字段...${NC}"
REQUIRED_FIELDS=("manifest_version" "name" "version")
for field in "${REQUIRED_FIELDS[@]}"; do
    if grep -q "\"${field}\"" "${BUILD_DIR}/manifest.json"; then
        echo -e "  ${GREEN}✓${NC} ${field}"
    else
        echo -e "  ${RED}✗${NC} ${field} 缺失"
        exit 1
    fi
done

# 检查图标文件
echo -e "${BLUE}检查图标文件...${NC}"
ICON_SIZES=(16 48 128)
for size in "${ICON_SIZES[@]}"; do
    if [ -f "${BUILD_DIR}/icons/icon${size}.png" ]; then
        echo -e "  ${GREEN}✓${NC} icons/icon${size}.png"
    else
        echo -e "  ${YELLOW}⚠${NC} icons/icon${size}.png 缺失"
    fi
done

# 创建 ZIP 文件
ZIP_NAME="github-markdown-toc-v${VERSION}.zip"
echo -e "${BLUE}创建 ZIP 文件: ${ZIP_NAME}${NC}"

cd "${BUILD_DIR}"
zip -r "${DIST_DIR}/${ZIP_NAME}" .
cd "${PROJECT_DIR}"

if [ -f "${DIST_DIR}/${ZIP_NAME}" ]; then
    FILE_SIZE=$(du -h "${DIST_DIR}/${ZIP_NAME}" | cut -f1)
    echo -e "  ${GREEN}✓${NC} ZIP 文件已创建: ${FILE_SIZE}"
else
    echo -e "  ${RED}✗${NC} ZIP 文件创建失败"
    exit 1
fi

# 生成校验和
echo -e "${BLUE}生成校验和...${NC}"
cd "${DIST_DIR}"
shasum -a 256 "${ZIP_NAME}" > "${ZIP_NAME}.sha256"
cd "${PROJECT_DIR}"
echo -e "  ${GREEN}✓${NC} SHA256 校验和已保存"

# 汇总信息
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}版本号:${NC} ${VERSION}"
echo -e "${BLUE}ZIP 文件:${NC} ${DIST_DIR}/${ZIP_NAME}"
echo -e "${BLUE}文件大小:${NC} $(du -h "${DIST_DIR}/${ZIP_NAME}" | cut -f1)"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 检查 ZIP 文件内容是否正确"
echo "  2. 在 Chrome 开发者模式下加载测试"
echo "  3. 上传到 Chrome Web Store 或 Edge Add-ons"
echo ""
