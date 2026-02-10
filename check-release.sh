#!/bin/bash

# GitHub Markdown TOC 扩展发布检查脚本
# 检查所有必要的文件和内容是否齐全

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GitHub Markdown TOC 扩展发布检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0
WARNINGS=0

# 检查函数
check_file() {
    local file="$1"
    local required="$2"
    local filepath="${PROJECT_DIR}/${file}"

    if [ -f "$filepath" ]; then
        echo -e "  ${GREEN}✓${NC} ${file}"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "  ${RED}✗${NC} ${file} ${RED}(必需)${NC}"
            ((ERRORS++))
            return 1
        else
            echo -e "  ${YELLOW}⚠${NC} ${file} ${YELLOW}(可选)${NC}"
            ((WARNINGS++))
            return 1
        fi
    fi
}

check_dir() {
    local dir="$1"
    local dirpath="${PROJECT_DIR}/${dir}"

    if [ -d "$dirpath" ]; then
        echo -e "  ${GREEN}✓${NC} ${dir}/"
        return 0
    else
        echo -e "  ${RED}✗${NC} ${dir}/ ${RED}(必需)${NC}"
        ((ERRORS++))
        return 1
    fi
}

# 1. 检查核心文件
echo -e "${BLUE}检查核心文件...${NC}"
check_file "manifest.json" "required"
check_file "content.js" "required"
check_file "content.css" "required"
check_file "options.html" "required"
check_file "options.js" "required"
check_file "options.css" "required"
echo ""

# 2. 检查图标文件
echo -e "${BLUE}检查图标文件...${NC}"
check_file "icons/icon16.png" "required"
check_file "icons/icon48.png" "required"
check_file "icons/icon128.png" "required"
echo ""

# 3. 检查本地化文件
echo -e "${BLUE}检查本地化文件...${NC}"
check_dir "_locales"
if [ -d "${PROJECT_DIR}/_locales" ]; then
    check_dir "_locales/en"
    check_file "_locales/en/messages.json" "required"
fi
echo ""

# 4. 检查文档文件
echo -e "${BLUE}检查文档文件...${NC}"
check_file "README.md" "optional"
check_file "README-zh.md" "optional"
check_file "LICENSE" "optional"
echo ""

# 5. 验证 manifest.json
echo -e "${BLUE}验证 manifest.json...${NC}"
if [ -f "${PROJECT_DIR}/manifest.json" ]; then
    # 检查 JSON 格式
    if python3 -c "import json; json.load(open('${PROJECT_DIR}/manifest.json'))" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} JSON 格式正确"

        # 检查必需字段
        MANIFEST=$(cat "${PROJECT_DIR}/manifest.json")

        if echo "$MANIFEST" | grep -q '"manifest_version"'; then
            VERSION=$(echo "$MANIFEST" | grep '"manifest_version"' | sed 's/.*"manifest_version": \([0-9]*\).*/\1/')
            echo -e "  ${GREEN}✓${NC} Manifest 版本: ${VERSION}"
        else
            echo -e "  ${RED}✗${NC} manifest_version 缺失"
            ((ERRORS++))
        fi

        if echo "$MANIFEST" | grep -q '"version"'; then
            EXT_VERSION=$(echo "$MANIFEST" | grep '"version"' | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
            echo -e "  ${GREEN}✓${NC} 扩展版本: ${EXT_VERSION}"
        else
            echo -e "  ${RED}✗${NC} version 缺失"
            ((ERRORS++))
        fi

        if echo "$MANIFEST" | grep -q '"name"'; then
            echo -e "  ${GREEN}✓${NC} name 字段存在"
        else
            echo -e "  ${RED}✗${NC} name 缺失"
            ((ERRORS++))
        fi

    else
        echo -e "  ${RED}✗${NC} JSON 格式错误"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}✗${NC} manifest.json 不存在"
    ((ERRORS++))
fi
echo ""

# 6. 检查文件大小
echo -e "${BLUE}检查文件大小...${NC}"
if [ -d "${PROJECT_DIR}/icons" ]; then
    for icon in "${PROJECT_DIR}/icons/"*.png; do
        if [ -f "$icon" ]; then
            SIZE=$(stat -f%z "$icon" 2>/dev/null || stat -c%s "$icon" 2>/dev/null)
            NAME=$(basename "$icon")
            if [ $SIZE -lt 100 ]; then
                echo -e "  ${YELLOW}⚠${NC} ${NAME} (${SIZE} bytes) - 可能太小"
                ((WARNINGS++))
            elif [ $SIZE -gt 1048576 ]; then
                echo -e "  ${YELLOW}⚠${NC} ${NAME} ($(($SIZE / 1024)) KB) - 可能太大"
                ((WARNINGS++))
            else
                echo -e "  ${GREEN}✓${NC} ${NAME} (${SIZE} bytes)"
            fi
        fi
    done
fi
echo ""

# 汇总结果
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  检查结果汇总${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "  ${GREEN}✓ 所有检查通过！可以发布。${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  准备发布${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "下一步:"
    echo "  1. 运行 ./package-extension.sh 打包扩展"
    echo "  2. 按照 PUBLISHING.md 中的步骤发布到商店"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "  ${YELLOW}⚠ 发现 ${WARNINGS} 个警告，但没有错误。${NC}"
    echo -e "  ${YELLOW}建议处理警告后再发布。${NC}"
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  发布前建议处理警告${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    exit 0
else
    echo -e "  ${RED}✗ 发现 ${ERRORS} 个错误，${WARNINGS} 个警告。${NC}"
    echo -e "  ${RED}请先修复错误后再发布。${NC}"
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  请先修复错误${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    exit 1
fi
