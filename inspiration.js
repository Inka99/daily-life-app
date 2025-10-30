/**
 * 每日灵感管理模块
 * 负责灵感记录的增删改查、标签管理、搜索筛选等功能
 */

class InspirationManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentTag = 'all';
        this.searchQuery = '';
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.selectedTags = new Set();

        this.init();
    }

    /**
     * 初始化灵感管理器
     */
    init() {
        this.initEventListeners();
        this.initFilters();
        this.initForms();
        this.initTagInput();
        this.loadInspirations();
        this.updateStats();
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 快速添加
        const quickAddBtn = document.querySelector('.quick-add-button');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.quickAddInspiration());
        }

        // 搜索功能
        document.addEventListener('search', (e) => {
            if (e.detail.query !== undefined) {
                this.searchQuery = e.detail.query.toLowerCase();
                this.renderInspirations();
            }
        });

        // 筛选器
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.getAttribute('data-filter');
                this.renderInspirations();
            });
        });

        const tagFilters = document.querySelectorAll('.tag-filter');
        tagFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                tagFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.currentTag = filter.getAttribute('data-tag');
                this.renderInspirations();
            });
        });

        // 表单提交
        const addForm = document.getElementById('addInspirationForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddInspiration();
            });
        }

        // 搜索按钮
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.toggleSearch();
            });
        }

        // 标签输入
        const tagInput = document.getElementById('tagInput');
        if (tagInput) {
            tagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTagFromInput();
                }
            });
        }

        // 快速添加输入框
        const quickAddTextarea = document.getElementById('quickAddTextarea');
        if (quickAddTextarea) {
            quickAddTextarea.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.quickAddInspiration();
                }
            });
        }
    }

    /**
     * 初始化筛选器
     */
    initFilters() {
        // 这里可以添加更多筛选逻辑
    }

    /**
     * 初始化表单
     */
    initForms() {
        this.initPredefinedTags();
    }

    /**
     * 初始化预定义标签
     */
    initPredefinedTags() {
        const predefinedTags = document.querySelectorAll('.predefined-tag');
        predefinedTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const tagValue = tag.getAttribute('data-tag');
                this.addTag(tagValue);
            });
        });
    }

    /**
     * 初始化标签输入
     */
    initTagInput() {
        const modalTagInput = document.getElementById('modalTagInput');
        if (modalTagInput) {
            modalTagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addModalTag();
                }
            });
        }
    }

    /**
     * 加载灵感记录
     */
    loadInspirations() {
        this.inspirations = storage.getInspiration();
        this.renderInspirations();
    }

    /**
     * 渲染灵感列表
     */
    renderInspirations() {
        const container = document.getElementById('inspirationsContainer');
        if (!container) return;

        // 筛选灵感
        let filteredInspirations = this.filterInspirations();

        // 排序灵感
        filteredInspirations = this.sortInspirations(filteredInspirations);

        // 检查是否为空
        if (filteredInspirations.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        // 渲染灵感卡片
        const inspirationsHTML = filteredInspirations.map(inspiration =>
            this.renderInspirationCard(inspiration)
        ).join('');
        container.innerHTML = inspirationsHTML;

        // 添加事件监听
        this.attachInspirationCardEvents();
    }

    /**
     * 筛选灵感
     */
    filterInspirations() {
        let filtered = [...this.inspirations];

        // 按时间筛选
        const now = new Date();
        switch (this.currentFilter) {
            case 'today':
                const today = now.toDateString();
                filtered = filtered.filter(inspiration =>
                    new Date(inspiration.createdAt).toDateString() === today
                );
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(inspiration =>
                    new Date(inspiration.createdAt) >= weekAgo
                );
                break;
            case 'month':
                const thisMonth = now.getMonth();
                filtered = filtered.filter(inspiration =>
                    new Date(inspiration.createdAt).getMonth() === thisMonth
                );
                break;
        }

        // 按标签筛选
        if (this.currentTag !== 'all') {
            filtered = filtered.filter(inspiration =>
                inspiration.tags && inspiration.tags.includes(this.currentTag)
            );
        }

        // 搜索筛选
        if (this.searchQuery) {
            filtered = filtered.filter(inspiration =>
                inspiration.content.toLowerCase().includes(this.searchQuery) ||
                (inspiration.tags && inspiration.tags.some(tag =>
                    tag.toLowerCase().includes(this.searchQuery)
                ))
            );
        }

        return filtered;
    }

    /**
     * 排序灵感
     */
    sortInspirations(inspirations) {
        return inspirations.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // 处理日期类型
            if (this.sortBy === 'createdAt' || this.sortBy === 'updatedAt') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            let result = 0;
            if (aValue > bValue) result = 1;
            if (aValue < bValue) result = -1;

            return this.sortOrder === 'desc' ? -result : result;
        });
    }

    /**
     * 渲染灵感卡片
     */
    renderInspirationCard(inspiration) {
        const moodEmojis = {
            excited: '😄',
            calm: '😌',
            thoughtful: '🤔',
            inspired: '✨'
        };

        const moodNames = {
            excited: '兴奋',
            calm: '平静',
            thoughtful: '思考',
            inspired: '灵感'
        };

        return `
            <div class="inspiration-item" data-id="${inspiration.id}">
                <div class="inspiration-header">
                    <div class="inspiration-content">
                        <div class="inspiration-text">${this.escapeHtml(inspiration.content)}</div>
                        ${inspiration.tags && inspiration.tags.length > 0 ? `
                            <div class="inspiration-tags">
                                ${inspiration.tags.map(tag => `
                                    <span class="tag">#${this.escapeHtml(tag)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="inspiration-meta">
                            <div class="inspiration-date">
                                <svg class="icon icon-sm" viewBox="0 0 24 24">
                                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                                </svg>
                                <span>${this.formatDate(inspiration.createdAt)}</span>
                            </div>
                            ${inspiration.mood ? `
                                <div class="inspiration-mood">
                                    <span class="mood-emoji">${moodEmojis[inspiration.mood]}</span>
                                    <span class="mood-name">${moodNames[inspiration.mood]}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="inspiration-actions">
                        <button class="action-button" onclick="inspirationManager.editInspiration('${inspiration.id}')" title="编辑">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="inspirationManager.shareInspiration('${inspiration.id}')" title="分享">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="inspirationManager.deleteInspirationConfirm('${inspiration.id}')" title="删除">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染空状态
     */
    renderEmptyState(container) {
        let message = '还没有灵感记录';
        let subMessage = '开始记录你的灵感火花吧';

        if (this.currentFilter !== 'all' || this.currentTag !== 'all' || this.searchQuery) {
            message = '没有找到匹配的灵感记录';
            subMessage = '尝试调整筛选条件或搜索关键词';
        }

        container.innerHTML = `
            <div class="empty-state" id="emptyState">
                <svg class="empty-icon" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <p class="empty-text">${message}</p>
                <p class="empty-subtext">${subMessage}</p>
            </div>
        `;
    }

    /**
     * 添加灵感卡片事件监听
     */
    attachInspirationCardEvents() {
        // 可以添加更多的事件监听逻辑
    }

    /**
     * 快速添加灵感
     */
    quickAddInspiration() {
        const textarea = document.getElementById('quickAddTextarea');
        const tagInput = document.getElementById('tagInput');

        if (!textarea || !textarea.value.trim()) {
            this.showToast('请输入灵感内容', 'error');
            return;
        }

        const inspiration = {
            content: textarea.value.trim(),
            tags: this.getCurrentTags(),
            mood: null
        };

        storage.addInspiration(inspiration);
        this.loadInspirations();
        this.updateStats();

        // 清空输入
        textarea.value = '';
        this.clearCurrentTags();
        if (tagInput) tagInput.value = '';

        this.showToast('灵感已记录', 'success');
    }

    /**
     * 处理添加灵感
     */
    handleAddInspiration() {
        const content = document.getElementById('inspirationContent').value.trim();

        if (!content) {
            this.showToast('请输入灵感内容', 'error');
            return;
        }

        const inspiration = {
            content: content,
            tags: Array.from(this.selectedTags),
            mood: document.querySelector('input[name="mood"]:checked')?.value || null
        };

        storage.addInspiration(inspiration);
        this.loadInspirations();
        this.updateStats();

        this.closeModal('addInspirationModal');
        this.clearSelectedTags();
        this.showToast('灵感已记录', 'success');
    }

    /**
     * 编辑灵感
     */
    editInspiration(inspirationId) {
        const inspiration = this.inspirations.find(i => i.id === inspirationId);
        if (!inspiration) return;

        // 填充表单
        document.getElementById('inspirationContent').value = inspiration.content;

        // 设置心情
        if (inspiration.mood) {
            const moodRadio = document.querySelector(`input[name="mood"][value="${inspiration.mood}"]`);
            if (moodRadio) moodRadio.checked = true;
        }

        // 设置标签
        this.clearSelectedTags();
        if (inspiration.tags) {
            inspiration.tags.forEach(tag => {
                this.addTag(tag);
            });
        }

        this.openModal('addInspirationModal');
    }

    /**
     * 分享灵感
     */
    shareInspiration(inspirationId) {
        const inspiration = this.inspirations.find(i => i.id === inspirationId);
        if (!inspiration) return;

        const shareText = `✨ 灵感记录\n\n${inspiration.content}\n\n${this.formatDate(inspiration.createdAt)}`;

        if (navigator.share) {
            navigator.share({
                title: '灵感分享',
                text: shareText
            }).catch(err => console.log('分享失败:', err));
        } else {
            // 降级到复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('灵感已复制到剪贴板', 'success');
            }).catch(() => {
                this.showToast('分享失败', 'error');
            });
        }
    }

    /**
     * 确认删除灵感
     */
    deleteInspirationConfirm(inspirationId) {
        const inspiration = this.inspirations.find(i => i.id === inspirationId);
        if (!inspiration) return;

        const content = inspiration.content.length > 20
            ? inspiration.content.substring(0, 20) + '...'
            : inspiration.content;

        if (confirm(`确定要删除这条灵感记录"${content}"吗？`)) {
            this.deleteInspiration(inspirationId);
        }
    }

    /**
     * 删除灵感
     */
    deleteInspiration(inspirationId) {
        const success = storage.deleteInspiration(inspirationId);
        if (success) {
            this.loadInspirations();
            this.updateStats();
            this.showToast('灵感已删除', 'success');
        } else {
            this.showToast('删除失败', 'error');
        }
    }

    /**
     * 更新统计数据
     */
    updateStats() {
        const stats = this.calculateStats();

        // 更新统计显示
        const totalElement = document.getElementById('totalInspirations');
        const thisMonthElement = document.getElementById('thisMonth');
        const thisWeekElement = document.getElementById('thisWeek');
        const todayElement = document.getElementById('today');

        if (totalElement) totalElement.textContent = stats.total;
        if (thisMonthElement) thisMonthElement.textContent = stats.thisMonth;
        if (thisWeekElement) thisWeekElement.textContent = stats.thisWeek;
        if (todayElement) todayElement.textContent = stats.today;
    }

    /**
     * 计算统计数据
     */
    calculateStats() {
        const now = new Date();
        const today = now.toDateString();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = now.getMonth();

        return {
            total: this.inspirations.length,
            today: this.inspirations.filter(i =>
                new Date(i.createdAt).toDateString() === today
            ).length,
            thisWeek: this.inspirations.filter(i =>
                new Date(i.createdAt) >= weekAgo
            ).length,
            thisMonth: this.inspirations.filter(i =>
                new Date(i.createdAt).getMonth() === thisMonth
            ).length
        };
    }

    /**
     * 切换搜索
     */
    toggleSearch() {
        const searchSection = document.getElementById('searchSection');
        const searchInput = document.getElementById('searchInput');

        if (searchSection && searchInput) {
            const isHidden = searchSection.style.display === 'none';
            searchSection.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                searchInput.focus();
            }
        }
    }

    /**
     * 添加标签
     */
    addTag(tag) {
        if (!tag || !tag.trim()) return;

        const cleanTag = tag.trim().replace('#', '');
        if (!this.selectedTags.has(cleanTag)) {
            this.selectedTags.add(cleanTag);
            this.updateSelectedTagsDisplay();
        }
    }

    /**
     * 添加模态框标签
     */
    addModalTag() {
        const input = document.getElementById('modalTagInput');
        if (!input || !input.value.trim()) return;

        this.addTag(input.value.trim());
        input.value = '';
        input.focus();
    }

    /**
     * 从输入框添加标签
     */
    addTagFromInput() {
        const input = document.getElementById('tagInput');
        if (!input || !input.value.trim()) return;

        this.addTag(input.value.trim());
        input.value = '';
    }

    /**
     * 移除标签
     */
    removeTag(tag) {
        this.selectedTags.delete(tag);
        this.updateSelectedTagsDisplay();
    }

    /**
     * 更新选中标签显示
     */
    updateSelectedTagsDisplay() {
        const container = document.getElementById('selectedTags');
        if (!container) return;

        const tagsHTML = Array.from(this.selectedTags).map(tag => `
            <span class="selected-tag">
                #${this.escapeHtml(tag)}
                <button class="remove-tag" onclick="inspirationManager.removeTag('${this.escapeHtml(tag)}')">×</button>
            </span>
        `).join('');

        container.innerHTML = tagsHTML;
    }

    /**
     * 清空选中的标签
     */
    clearSelectedTags() {
        this.selectedTags.clear();
        this.updateSelectedTagsDisplay();
    }

    /**
     * 获取当前标签
     */
    getCurrentTags() {
        const tagsDisplay = document.getElementById('tagsDisplay');
        if (tagsDisplay) {
            const tagElements = tagsDisplay.querySelectorAll('.tag');
            return Array.from(tagElements).map(el => el.textContent.replace('#', '').trim());
        }
        return [];
    }

    /**
     * 清空当前标签
     */
    clearCurrentTags() {
        const tagsDisplay = document.getElementById('tagsDisplay');
        if (tagsDisplay) {
            tagsDisplay.innerHTML = '';
        }
    }

    /**
     * 打开模态框
     */
    openModal(modalId) {
        if (window.app && window.app.openModal) {
            window.app.openModal(modalId);
        }
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        if (window.app && window.app.closeModal) {
            window.app.closeModal(modalId);
        }
    }

    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        }
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 导出灵感
     */
    exportInspirations() {
        const data = {
            exportDate: new Date().toISOString(),
            inspirations: this.inspirations,
            stats: this.calculateStats()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inspirations-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('灵感记录已导出', 'success');
    }

    /**
     * 获取所有标签
     */
    getAllTags() {
        const tags = new Set();
        this.inspirations.forEach(inspiration => {
            if (inspiration.tags) {
                inspiration.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }

    /**
     * 获取热门标签
     */
    getPopularTags(limit = 10) {
        const tagCounts = {};
        this.inspirations.forEach(inspiration => {
            if (inspiration.tags) {
                inspiration.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }
}

// 初始化灵感管理器
let inspirationManager;
document.addEventListener('DOMContentLoaded', () => {
    // 确保在灵感页面才初始化
    if (document.getElementById('inspirationsContainer')) {
        inspirationManager = new InspirationManager();
        window.inspirationManager = inspirationManager;
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InspirationManager;
}