/**
 * 每日感恩管理模块
 * 负责感恩记录的增删改查、分类管理、连续天数统计等功能
 */

class GratitudeManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.todayGratitudes = [];

        this.init();
    }

    /**
     * 初始化感恩管理器
     */
    init() {
        this.initEventListeners();
        this.initFilters();
        this.initForms();
        this.initReminder();
        this.loadGratitudes();
        this.updateStats();
        this.loadTodayGratitudes();
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 今日感恩快速添加
        const addGratitudeBtn = document.querySelector('.add-gratitude-btn');
        if (addGratitudeBtn) {
            addGratitudeBtn.addEventListener('click', () => this.addTodayGratitude());
        }

        // 今日感恩输入框
        const gratitudeTextarea = document.getElementById('gratitudeTextarea');
        if (gratitudeTextarea) {
            gratitudeTextarea.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.addTodayGratitude();
                }
            });
        }

        // 搜索功能
        document.addEventListener('search', (e) => {
            if (e.detail.query !== undefined) {
                this.searchQuery = e.detail.query.toLowerCase();
                this.renderGratitudes();
            }
        });

        // 筛选器
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.getAttribute('data-filter');
                this.renderGratitudes();
            });
        });

        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.currentCategory = filter.getAttribute('data-category');
                this.renderGratitudes();
            });
        });

        // 表单提交
        const addForm = document.getElementById('addGratitudeForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddGratitude();
            });
        }

        // 日历按钮
        const calendarButton = document.getElementById('calendarButton');
        if (calendarButton) {
            calendarButton.addEventListener('click', () => {
                this.showCalendar();
            });
        }

        // 感恩提醒开关
        const reminderToggle = document.getElementById('reminderToggle');
        if (reminderToggle) {
            reminderToggle.addEventListener('click', () => {
                this.toggleReminder();
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
        // 初始化分类选择
        this.initCategoryOptions();
    }

    /**
     * 初始化分类选项
     */
    initCategoryOptions() {
        const categoryOptions = document.querySelectorAll('.category-option');
        categoryOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 视觉反馈已通过CSS处理
            });
        });
    }

    /**
     * 初始化提醒
     */
    initReminder() {
        const settings = storage.getSettings();
        const reminderToggle = document.getElementById('reminderToggle');
        const reminderTime = document.querySelector('.reminder-time');

        if (reminderToggle && reminderTime) {
            const isEnabled = settings.notifications?.gratitude?.enabled;
            const time = settings.notifications?.gratitude?.time || '20:00';

            reminderToggle.classList.toggle('active', isEnabled);
            reminderTime.textContent = `每天 ${time}`;
        }
    }

    /**
     * 加载感恩记录
     */
    loadGratitudes() {
        this.gratitudes = storage.getGratitude();
        this.renderGratitudes();
    }

    /**
     * 加载今日感恩
     */
    loadTodayGratitudes() {
        const today = new Date().toDateString();
        this.todayGratitudes = this.gratitudes.filter(gratitude =>
            new Date(gratitude.createdAt).toDateString() === today
        );
        this.renderTodayGratitudes();
    }

    /**
     * 渲染感恩历史
     */
    renderGratitudes() {
        const container = document.getElementById('gratitudeTimeline');
        if (!container) return;

        // 筛选感恩记录
        let filteredGratitudes = this.filterGratitudes();

        // 排序感恩记录
        filteredGratitudes = this.sortGratitudes(filteredGratitudes);

        // 检查是否为空
        if (filteredGratitudes.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        // 按日期分组
        const groupedGratitudes = this.groupByDate(filteredGratitudes);

        // 渲染时间线
        const timelineHTML = Object.entries(groupedGratitudes)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, gratitudes]) => this.renderDateGroup(date, gratitudes))
            .join('');

        container.innerHTML = timelineHTML;

        // 添加事件监听
        this.attachGratitudeItemEvents();
    }

    /**
     * 渲染今日感恩
     */
    renderTodayGratitudes() {
        const container = document.getElementById('todayGratitudeList');
        if (!container) return;

        if (this.todayGratitudes.length === 0) {
            container.innerHTML = `
                <div class="empty-today">
                    <p class="empty-text">今天还没有记录感恩</p>
                </div>
            `;
            return;
        }

        const gratitudesHTML = this.todayGratitudes.map(gratitude =>
            this.renderTodayGratitudeItem(gratitude)
        ).join('');

        container.innerHTML = gratitudesHTML;
    }

    /**
     * 渲染日期分组
     */
    renderDateGroup(date, gratitudes) {
        const dateObj = new Date(date);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        let dateLabel;
        if (date === today) {
            dateLabel = '今天';
        } else if (date === yesterday) {
            dateLabel = '昨天';
        } else {
            dateLabel = dateObj.toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }

        return `
            <div class="date-group">
                <div class="date-header">
                    <h4 class="date-title">${dateLabel}</h4>
                    <span class="gratitude-count">${gratitudes.length} 条感恩</span>
                </div>
                <div class="gratitude-items">
                    ${gratitudes.map(gratitude => this.renderGratitudeItem(gratitude)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染感恩项
     */
    renderGratitudeItem(gratitude) {
        const categoryIcons = {
            family: '👨‍👩‍👧‍👦',
            friends: '👥',
            work: '💼',
            health: '❤️',
            life: '🌟',
            nature: '🌿',
            other: '📝'
        };

        const categoryNames = {
            family: '家人',
            friends: '朋友',
            work: '工作',
            health: '健康',
            life: '生活',
            nature: '自然',
            other: '其他'
        };

        const levelEmojis = {
            1: '🙂',
            2: '😊',
            3: '😄',
            4: '🥰',
            5: '🙏'
        };

        return `
            <div class="gratitude-item" data-id="${gratitude.id}">
                <div class="gratitude-header">
                    <div class="gratitude-content">
                        <div class="gratitude-text">${this.escapeHtml(gratitude.content)}</div>
                        <div class="gratitude-meta">
                            <div class="gratitude-category">
                                <span class="category-icon">${categoryIcons[gratitude.category] || '📝'}</span>
                                <span class="category-name">${categoryNames[gratitude.category] || gratitude.category}</span>
                            </div>
                            <div class="gratitude-level">
                                <span class="level-emoji">${levelEmojis[gratitude.level] || '🙏'}</span>
                            </div>
                            <div class="gratitude-time">
                                ${new Date(gratitude.createdAt).toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                    <div class="gratitude-actions">
                        <button class="action-button" onclick="gratitudeManager.editGratitude('${gratitude.id}')" title="编辑">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="gratitudeManager.shareGratitude('${gratitude.id}')" title="分享">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="gratitudeManager.deleteGratitudeConfirm('${gratitude.id}')" title="删除">
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
     * 渲染今日感恩项
     */
    renderTodayGratitudeItem(gratitude) {
        const levelEmojis = {
            1: '🙂',
            2: '😊',
            3: '😄',
            4: '🥰',
            5: '🙏'
        };

        return `
            <div class="today-gratitude-item" data-id="${gratitude.id}">
                <div class="today-gratitude-content">
                    <span class="gratitude-emoji">${levelEmojis[gratitude.level] || '🙏'}</span>
                    <span class="gratitude-text">${this.escapeHtml(gratitude.content)}</span>
                </div>
                <button class="remove-gratitude-btn" onclick="gratitudeManager.removeTodayGratitude('${gratitude.id}')" title="移除">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * 渲染空状态
     */
    renderEmptyState(container) {
        let message = '还没有感恩记录';
        let subMessage = '开始记录生活中值得感恩的事物吧';

        if (this.currentFilter !== 'all' || this.currentCategory !== 'all' || this.searchQuery) {
            message = '没有找到匹配的感恩记录';
            subMessage = '尝试调整筛选条件或搜索关键词';
        }

        container.innerHTML = `
            <div class="empty-state" id="emptyState">
                <svg class="empty-icon" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <p class="empty-text">${message}</p>
                <p class="empty-subtext">${subMessage}</p>
            </div>
        `;
    }

    /**
     * 添加感恩项事件监听
     */
    attachGratitudeItemEvents() {
        // 可以添加更多的事件监听逻辑
    }

    /**
     * 筛选感恩记录
     */
    filterGratitudes() {
        let filtered = [...this.gratitudes];

        // 按时间筛选
        const now = new Date();
        switch (this.currentFilter) {
            case 'today':
                const today = now.toDateString();
                filtered = filtered.filter(gratitude =>
                    new Date(gratitude.createdAt).toDateString() === today
                );
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(gratitude =>
                    new Date(gratitude.createdAt) >= weekAgo
                );
                break;
            case 'month':
                const thisMonth = now.getMonth();
                filtered = filtered.filter(gratitude =>
                    new Date(gratitude.createdAt).getMonth() === thisMonth
                );
                break;
        }

        // 按分类筛选
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(gratitude => gratitude.category === this.currentCategory);
        }

        // 搜索筛选
        if (this.searchQuery) {
            filtered = filtered.filter(gratitude =>
                gratitude.content.toLowerCase().includes(this.searchQuery)
            );
        }

        return filtered;
    }

    /**
     * 排序感恩记录
     */
    sortGratitudes(gratitudes) {
        return gratitudes.sort((a, b) => {
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
     * 按日期分组
     */
    groupByDate(gratitudes) {
        return gratitudes.reduce((groups, gratitude) => {
            const date = new Date(gratitude.createdAt).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(gratitude);
            return groups;
        }, {});
    }

    /**
     * 添加今日感恩
     */
    addTodayGratitude() {
        const textarea = document.getElementById('gratitudeTextarea');
        const categorySelect = document.getElementById('gratitudeCategory');

        if (!textarea || !textarea.value.trim()) {
            this.showToast('请输入感恩内容', 'error');
            return;
        }

        const gratitude = {
            content: textarea.value.trim(),
            category: categorySelect?.value || 'life',
            level: 5 // 默认感恩程度
        };

        storage.addGratitude(gratitude);
        this.loadGratitudes();
        this.loadTodayGratitudes();
        this.updateStats();

        // 清空输入
        textarea.value = '';
        if (categorySelect) categorySelect.value = '';

        this.showToast('感恩已记录', 'success');
    }

    /**
     * 移除今日感恩
     */
    removeTodayGratitude(gratitudeId) {
        if (confirm('确定要移除这条感恩记录吗？')) {
            this.deleteGratitude(gratitudeId);
        }
    }

    /**
     * 处理添加感恩
     */
    handleAddGratitude() {
        const content = document.getElementById('gratitudeContent').value.trim();
        const category = document.querySelector('input[name="category"]:checked')?.value;
        const level = document.querySelector('input[name="level"]:checked')?.value;

        if (!content) {
            this.showToast('请输入感恩内容', 'error');
            return;
        }

        const gratitude = {
            content: content,
            category: category || 'life',
            level: parseInt(level) || 5
        };

        storage.addGratitude(gratitude);
        this.loadGratitudes();
        this.loadTodayGratitudes();
        this.updateStats();

        this.closeModal('addGratitudeModal');
        this.showToast('感恩已记录', 'success');
    }

    /**
     * 编辑感恩
     */
    editGratitude(gratitudeId) {
        const gratitude = this.gratitudes.find(g => g.id === gratitudeId);
        if (!gratitude) return;

        // 填充表单
        document.getElementById('gratitudeContent').value = gratitude.content;

        // 设置分类
        const categoryRadio = document.querySelector(`input[name="category"][value="${gratitude.category}"]`);
        if (categoryRadio) categoryRadio.checked = true;

        // 设置感恩程度
        const levelRadio = document.querySelector(`input[name="level"][value="${gratitude.level}"]`);
        if (levelRadio) levelRadio.checked = true;

        this.openModal('addGratitudeModal');
    }

    /**
     * 分享感恩
     */
    shareGratitude(gratitudeId) {
        const gratitude = this.gratitudes.find(g => g.id === gratitudeId);
        if (!gratitude) return;

        const levelEmojis = {
            1: '🙂',
            2: '😊',
            3: '😄',
            4: '🥰',
            5: '🙏'
        };

        const shareText = `🙏 每日感恩\n\n${levelEmojis[gratitude.level]} ${gratitude.content}\n\n${this.formatDate(gratitude.createdAt)}`;

        if (navigator.share) {
            navigator.share({
                title: '感恩分享',
                text: shareText
            }).catch(err => console.log('分享失败:', err));
        } else {
            // 降级到复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('感恩已复制到剪贴板', 'success');
            }).catch(() => {
                this.showToast('分享失败', 'error');
            });
        }
    }

    /**
     * 确认删除感恩
     */
    deleteGratitudeConfirm(gratitudeId) {
        const gratitude = this.gratitudes.find(g => g.id === gratitudeId);
        if (!gratitude) return;

        const content = gratitude.content.length > 20
            ? gratitude.content.substring(0, 20) + '...'
            : gratitude.content;

        if (confirm(`确定要删除这条感恩记录"${content}"吗？`)) {
            this.deleteGratitude(gratitudeId);
        }
    }

    /**
     * 删除感恩
     */
    deleteGratitude(gratitudeId) {
        const success = storage.deleteGratitude(gratitudeId);
        if (success) {
            this.loadGratitudes();
            this.loadTodayGratitudes();
            this.updateStats();
            this.showToast('感恩已删除', 'success');
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
        const totalElement = document.getElementById('totalGratitude');
        const currentStreakElement = document.getElementById('currentStreak');
        const thisMonthElement = document.getElementById('thisMonth');
        const todayCountElement = document.getElementById('todayCount');

        if (totalElement) totalElement.textContent = stats.total;
        if (currentStreakElement) currentStreakElement.textContent = stats.currentStreak;
        if (thisMonthElement) thisMonthElement.textContent = stats.thisMonth;
        if (todayCountElement) todayCountElement.textContent = stats.today;
    }

    /**
     * 计算统计数据
     */
    calculateStats() {
        const now = new Date();
        const today = now.toDateString();
        const thisMonth = now.getMonth();

        const userStats = storage.getUserStats();
        const gratitudeStats = userStats.stats?.gratitude || {};

        return {
            total: this.gratitudes.length,
            today: this.gratitudes.filter(g =>
                new Date(g.createdAt).toDateString() === today
            ).length,
            thisMonth: this.gratitudes.filter(g =>
                new Date(g.createdAt).getMonth() === thisMonth
            ).length,
            currentStreak: gratitudeStats.currentStreak || 0,
            longestStreak: gratitudeStats.longestStreak || 0
        };
    }

    /**
     * 切换提醒
     */
    toggleReminder() {
        const reminderToggle = document.getElementById('reminderToggle');
        if (!reminderToggle) return;

        const isActive = reminderToggle.classList.contains('active');
        const newState = !isActive;

        // 更新UI
        reminderToggle.classList.toggle('active', newState);

        // 更新设置
        storage.updateSettings({
            notifications: {
                gratitude: {
                    enabled: newState,
                    time: '20:00'
                }
            }
        });

        this.showToast(newState ? '感恩提醒已开启' : '感恩提醒已关闭', 'success');
    }

    /**
     * 显示日历
     */
    showCalendar() {
        // 这里可以实现日历视图功能
        this.showToast('日历功能开发中...', 'info');
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
                month: 'long',
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
     * 导出感恩记录
     */
    exportGratitudes() {
        const data = {
            exportDate: new Date().toISOString(),
            gratitudes: this.gratitudes,
            stats: this.calculateStats()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gratitude-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('感恩记录已导出', 'success');
    }

    /**
     * 获取感恩热力图数据
     */
    getHeatmapData() {
        const heatmapData = {};
        const today = new Date();
        const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

        // 初始化一年数据
        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            heatmapData[dateKey] = 0;
        }

        // 填充实际数据
        this.gratitudes.forEach(gratitude => {
            const dateKey = gratitude.createdAt.split('T')[0];
            if (heatmapData.hasOwnProperty(dateKey)) {
                heatmapData[dateKey]++;
            }
        });

        return heatmapData;
    }
}

// 初始化感恩管理器
let gratitudeManager;
document.addEventListener('DOMContentLoaded', () => {
    // 确保在感恩页面才初始化
    if (document.getElementById('gratitudeTimeline')) {
        gratitudeManager = new GratitudeManager();
        window.gratitudeManager = gratitudeManager;
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GratitudeManager;
}