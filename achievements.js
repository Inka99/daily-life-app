/**
 * 每日成就管理模块
 * 负责成就记录的增删改查、等级系统、徽章收集等功能
 */

class AchievementsManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.badges = this.initBadges();

        this.init();
    }

    /**
     * 初始化成就管理器
     */
    init() {
        this.initEventListeners();
        this.initFilters();
        this.initForms();
        this.loadAchievements();
        this.updateStats();
        this.updateLevelProgress();
        this.updateBadges();
    }

    /**
     * 初始化徽章系统
     */
    initBadges() {
        return {
            // 等级徽章
            level_1: { name: '初学者', icon: '🌟', description: '开始你的成就之旅', unlocked: true },
            level_5: { name: '进步者', icon: '⭐', description: '达到等级5', unlocked: false },
            level_10: { name: '优秀者', icon: '🌟', description: '达到等级10', unlocked: false },
            level_20: { name: '专家', icon: '💫', description: '达到等级20', unlocked: false },
            level_30: { name: '大师', icon: '🏆', description: '达到等级30', unlocked: false },

            // 连续徽章
            streak_3: { name: '坚持3天', icon: '🔥', description: '连续记录3天成就', unlocked: false },
            streak_7: { name: '一周达人', icon: '🔥', description: '连续记录7天成就', unlocked: false },
            streak_30: { name: '月度冠军', icon: '🏅', description: '连续记录30天成就', unlocked: false },
            streak_100: { name: '百日传奇', icon: '👑', description: '连续记录100天成就', unlocked: false },

            // 数量徽章
            count_10: { name: '小有成就', icon: '🎯', description: '记录10个成就', unlocked: false },
            count_50: { name: '成就满满', icon: '🎯', description: '记录50个成就', unlocked: false },
            count_100: { name: '成就大师', icon: '🎯', description: '记录100个成就', unlocked: false },
            count_500: { name: '传奇成就', icon: '🎯', description: '记录500个成就', unlocked: false },

            // 特殊徽章
            first_achievement: { name: '初次尝试', icon: '🌱', description: '记录第一个成就', unlocked: false },
            variety_master: { name: '全能玩家', icon: '🌈', description: '在所有类别都有成就记录', unlocked: false },
            big_achievement: { name: '重大突破', icon: '💎', description: '记录一个大成就', unlocked: false },
            perfect_day: { name: '完美一天', icon: '✨', description: '一天内记录3个以上成就', unlocked: false }
        };
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 搜索功能
        document.addEventListener('search', (e) => {
            if (e.detail.query !== undefined) {
                this.searchQuery = e.detail.query.toLowerCase();
                this.renderAchievements();
            }
        });

        // 筛选器
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.getAttribute('data-filter');
                this.renderAchievements();
            });
        });

        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.currentCategory = filter.getAttribute('data-category');
                this.renderAchievements();
            });
        });

        // 表单提交
        const addForm = document.getElementById('addAchievementForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddAchievement();
            });
        }

        // 统计按钮
        const statsButton = document.getElementById('statsButton');
        if (statsButton) {
            statsButton.addEventListener('click', () => {
                this.showStats();
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
        // 这里可以添加表单初始化逻辑
    }

    /**
     * 加载成就记录
     */
    loadAchievements() {
        this.achievements = storage.getAchievements();
        this.renderAchievements();
    }

    /**
     * 渲染成就列表
     */
    renderAchievements() {
        const container = document.getElementById('achievementsTimeline');
        if (!container) return;

        // 筛选成就
        let filteredAchievements = this.filterAchievements();

        // 排序成就
        filteredAchievements = this.sortAchievements(filteredAchievements);

        // 检查是否为空
        if (filteredAchievements.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        // 按日期分组
        const groupedAchievements = this.groupByDate(filteredAchievements);

        // 渲染时间线
        const timelineHTML = Object.entries(groupedAchievements)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([date, achievements]) => this.renderDateGroup(date, achievements))
            .join('');

        container.innerHTML = timelineHTML;

        // 添加事件监听
        this.attachAchievementItemEvents();
    }

    /**
     * 渲染日期分组
     */
    renderDateGroup(date, achievements) {
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
                    <span class="achievement-count">${achievements.length} 个成就</span>
                </div>
                <div class="achievement-items">
                    ${achievements.map(achievement => this.renderAchievementItem(achievement)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 渲染成就项
     */
    renderAchievementItem(achievement) {
        const typeIcons = {
            small: '⭐',
            medium: '🏆',
            large: '👑'
        };

        const typeNames = {
            small: '小成就',
            medium: '中成就',
            large: '大成就'
        };

        const typeColors = {
            small: '#10b981',
            medium: '#f59e0b',
            large: '#ef4444'
        };

        const skillNames = {
            work: '工作技能',
            study: '学习能力',
            health: '健康运动',
            social: '社交能力',
            creative: '创意思维',
            personal: '个人成长',
            other: '其他'
        };

        return `
            <div class="achievement-item" data-id="${achievement.id}">
                <div class="achievement-header">
                    <div class="achievement-icon" style="color: ${typeColors[achievement.type]}">
                        ${typeIcons[achievement.type]}
                    </div>
                    <div class="achievement-content">
                        <div class="achievement-title">${this.escapeHtml(achievement.title)}</div>
                        ${achievement.description ? `
                            <div class="achievement-description">${this.escapeHtml(achievement.description)}</div>
                        ` : ''}
                        <div class="achievement-meta">
                            <div class="achievement-type">
                                <span class="type-badge" style="background-color: ${typeColors[achievement.type]}20; color: ${typeColors[achievement.type]}">
                                    ${typeNames[achievement.type]}
                                </span>
                                <span class="exp-points">+${this.getExpPoints(achievement.type)} EXP</span>
                            </div>
                            ${achievement.skill ? `
                                <div class="achievement-skill">
                                    <span class="skill-tag">${skillNames[achievement.skill] || achievement.skill}</span>
                                </div>
                            ` : ''}
                            <div class="achievement-time">
                                ${new Date(achievement.createdAt).toLocaleTimeString('zh-CN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                    <div class="achievement-actions">
                        <button class="action-button" onclick="achievementsManager.editAchievement('${achievement.id}')" title="编辑">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="achievementsManager.shareAchievement('${achievement.id}')" title="分享">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="achievementsManager.deleteAchievementConfirm('${achievement.id}')" title="删除">
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
        let message = '还没有成就记录';
        let subMessage = '开始记录你的每一个进步吧';

        if (this.currentFilter !== 'all' || this.currentCategory !== 'all' || this.searchQuery) {
            message = '没有找到匹配的成就记录';
            subMessage = '尝试调整筛选条件或搜索关键词';
        }

        container.innerHTML = `
            <div class="empty-state" id="emptyState">
                <svg class="empty-icon" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.86-2h8.28l.96-5.84-3.93 3.72L12 8.4l-1.17 2.48-3.93-3.72L7.86 14z"/>
                </svg>
                <p class="empty-text">${message}</p>
                <p class="empty-subtext">${subMessage}</p>
            </div>
        `;
    }

    /**
     * 添加成就项事件监听
     */
    attachAchievementItemEvents() {
        // 可以添加更多的事件监听逻辑
    }

    /**
     * 筛选成就
     */
    filterAchievements() {
        let filtered = [...this.achievements];

        // 按时间筛选
        const now = new Date();
        switch (this.currentFilter) {
            case 'today':
                const today = now.toDateString();
                filtered = filtered.filter(achievement =>
                    new Date(achievement.createdAt).toDateString() === today
                );
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(achievement =>
                    new Date(achievement.createdAt) >= weekAgo
                );
                break;
            case 'month':
                const thisMonth = now.getMonth();
                filtered = filtered.filter(achievement =>
                    new Date(achievement.createdAt).getMonth() === thisMonth
                );
                break;
        }

        // 按分类筛选
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(achievement => achievement.type === this.currentCategory);
        }

        // 搜索筛选
        if (this.searchQuery) {
            filtered = filtered.filter(achievement =>
                achievement.title.toLowerCase().includes(this.searchQuery) ||
                (achievement.description && achievement.description.toLowerCase().includes(this.searchQuery))
            );
        }

        return filtered;
    }

    /**
     * 排序成就
     */
    sortAchievements(achievements) {
        return achievements.sort((a, b) => {
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
    groupByDate(achievements) {
        return achievements.reduce((groups, achievement) => {
            const date = new Date(achievement.createdAt).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(achievement);
            return groups;
        }, {});
    }

    /**
     * 处理添加成就
     */
    handleAddAchievement() {
        const title = document.getElementById('achievementTitle').value.trim();
        const description = document.getElementById('achievementDescription').value.trim();
        const type = document.querySelector('input[name="type"]:checked')?.value;
        const skill = document.getElementById('achievementSkill').value;

        if (!title) {
            this.showToast('请输入成就名称', 'error');
            return;
        }

        const achievement = {
            title: title,
            description: description,
            type: type,
            skill: skill || null
        };

        storage.addAchievement(achievement);
        this.loadAchievements();
        this.updateStats();
        this.updateLevelProgress();
        this.checkAndUnlockBadges();

        this.closeModal('addAchievementModal');
        this.showToast('成就已记录！', 'success');

        // 清空表单
        document.getElementById('addAchievementForm').reset();
    }

    /**
     * 编辑成就
     */
    editAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        // 填充表单
        document.getElementById('achievementTitle').value = achievement.title;
        document.getElementById('achievementDescription').value = achievement.description || '';
        document.getElementById('achievementSkill').value = achievement.skill || '';

        // 设置类型
        const typeRadio = document.querySelector(`input[name="type"][value="${achievement.type}"]`);
        if (typeRadio) typeRadio.checked = true;

        this.openModal('addAchievementModal');
    }

    /**
     * 分享成就
     */
    shareAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const typeIcons = {
            small: '⭐',
            medium: '🏆',
            large: '👑'
        };

        const typeNames = {
            small: '小成就',
            medium: '中成就',
            large: '大成就'
        };

        const shareText = `🎉 每日成就\n\n${typeIcons[achievement.type]} ${achievement.title}\n${typeNames[achievement.type]} (+${this.getExpPoints(achievement.type)} EXP)\n\n${this.formatDate(achievement.createdAt)}`;

        if (navigator.share) {
            navigator.share({
                title: '成就分享',
                text: shareText
            }).catch(err => console.log('分享失败:', err));
        } else {
            // 降级到复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                this.showToast('成就已复制到剪贴板', 'success');
            }).catch(() => {
                this.showToast('分享失败', 'error');
            });
        }
    }

    /**
     * 确认删除成就
     */
    deleteAchievementConfirm(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        if (confirm(`确定要删除成就"${achievement.title}"吗？`)) {
            this.deleteAchievement(achievementId);
        }
    }

    /**
     * 删除成就
     */
    deleteAchievement(achievementId) {
        const success = storage.deleteAchievement(achievementId);
        if (success) {
            this.loadAchievements();
            this.updateStats();
            this.updateLevelProgress();
            this.showToast('成就已删除', 'success');
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
        const totalElement = document.getElementById('totalAchievements');
        const currentStreakElement = document.getElementById('currentStreak');
        const thisMonthElement = document.getElementById('thisMonth');
        const badgeCountElement = document.getElementById('badgeCount');

        if (totalElement) totalElement.textContent = stats.total;
        if (currentStreakElement) currentStreakElement.textContent = stats.currentStreak;
        if (thisMonthElement) thisMonthElement.textContent = stats.thisMonth;
        if (badgeCountElement) badgeCountElement.textContent = stats.badges;
    }

    /**
     * 更新等级进度
     */
    updateLevelProgress() {
        const userStats = storage.getUserStats();
        const achievementStats = userStats.stats?.achievements || {};

        const level = achievementStats.level || 1;
        const experience = achievementStats.experience || 0;
        const levelExp = experience % 100;
        const requiredExp = 100;

        // 更新等级信息
        const currentLevelElement = document.getElementById('currentLevel');
        const levelNameElement = document.getElementById('levelName');
        const currentExpElement = document.getElementById('currentExp');
        const requiredExpElement = document.getElementById('requiredExp');
        const levelProgressElement = document.getElementById('levelProgress');

        if (currentLevelElement) currentLevelElement.textContent = `Lv.${level}`;
        if (levelNameElement) levelNameElement.textContent = this.getLevelName(level);
        if (currentExpElement) currentExpElement.textContent = levelExp;
        if (requiredExpElement) requiredExpElement.textContent = requiredExp;
        if (levelProgressElement) {
            const progress = (levelExp / requiredExp) * 100;
            levelProgressElement.style.width = `${progress}%`;
        }
    }

    /**
     * 更新徽章显示
     */
    updateBadges() {
        const badgesGrid = document.getElementById('badgesGrid');
        if (!badgesGrid) return;

        // 检查并解锁徽章
        this.checkAndUnlockBadges();

        // 渲染徽章
        const badgesHTML = Object.entries(this.badges).map(([key, badge]) => `
            <div class="badge-item ${badge.unlocked ? '' : 'locked'}" title="${badge.description}">
                <div class="badge-icon">
                    ${badge.unlocked ? badge.icon : '🔒'}
                </div>
                <span class="badge-name">${badge.name}</span>
            </div>
        `).join('');

        badgesGrid.innerHTML = badgesHTML;
    }

    /**
     * 检查并解锁徽章
     */
    checkAndUnlockBadges() {
        const userStats = storage.getUserStats();
        const achievementStats = userStats.stats?.achievements || {};

        // 检查等级徽章
        this.checkBadge(`level_5`, achievementStats.level >= 5);
        this.checkBadge(`level_10`, achievementStats.level >= 10);
        this.checkBadge(`level_20`, achievementStats.level >= 20);
        this.checkBadge(`level_30`, achievementStats.level >= 30);

        // 检查连续徽章
        const streak = this.calculateCurrentStreak();
        this.checkBadge(`streak_3`, streak >= 3);
        this.checkBadge(`streak_7`, streak >= 7);
        this.checkBadge(`streak_30`, streak >= 30);
        this.checkBadge(`streak_100`, streak >= 100);

        // 检查数量徽章
        this.checkBadge(`count_10`, this.achievements.length >= 10);
        this.checkBadge(`count_50`, this.achievements.length >= 50);
        this.checkBadge(`count_100`, this.achievements.length >= 100);
        this.checkBadge(`count_500`, this.achievements.length >= 500);

        // 检查特殊徽章
        this.checkBadge(`first_achievement`, this.achievements.length > 0);
        this.checkBadge(`big_achievement`, this.achievements.some(a => a.type === 'large'));
        this.checkBadge(`perfect_day`, this.hasPerfectDay());
        this.checkBadge(`variety_master`, this.hasVarietyMaster());
    }

    /**
     * 检查徽章
     */
    checkBadge(badgeKey, condition) {
        if (condition && !this.badges[badgeKey].unlocked) {
            this.badges[badgeKey].unlocked = true;
            this.showBadgeUnlocked(this.badges[badgeKey]);
        }
    }

    /**
     * 显示徽章解锁
     */
    showBadgeUnlocked(badge) {
        this.showToast(`🎉 解锁新徽章：${badge.icon} ${badge.name}`, 'success', 5000);
    }

    /**
     * 计算当前连续天数
     */
    calculateCurrentStreak() {
        if (this.achievements.length === 0) return 0;

        // 按日期分组
        const dates = {};
        this.achievements.forEach(achievement => {
            const date = new Date(achievement.createdAt).toDateString();
            dates[date] = true;
        });

        const sortedDates = Object.keys(dates).sort((a, b) =>
            new Date(b) - new Date(a)
        );

        let streak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        if (sortedDates.includes(today)) {
            streak = 1;
            let checkDate = new Date(today);

            for (let i = 1; i < 365; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                const checkDateStr = checkDate.toDateString();
                if (sortedDates.includes(checkDateStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        } else if (sortedDates.includes(yesterday)) {
            streak = 1;
            let checkDate = new Date(yesterday);

            for (let i = 1; i < 365; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                const checkDateStr = checkDate.toDateString();
                if (sortedDates.includes(checkDateStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        return streak;
    }

    /**
     * 检查是否有完美一天
     */
    hasPerfectDay() {
        const today = new Date().toDateString();
        const todayAchievements = this.achievements.filter(a =>
            new Date(a.createdAt).toDateString() === today
        );
        return todayAchievements.length >= 3;
    }

    /**
     * 检查是否是全能玩家
     */
    hasVarietyMaster() {
        const skills = new Set();
        this.achievements.forEach(achievement => {
            if (achievement.skill) {
                skills.add(achievement.skill);
            }
        });
        return skills.size >= 6; // 至少6个不同技能
    }

    /**
     * 获取经验值点数
     */
    getExpPoints(type) {
        const expMap = {
            small: 10,
            medium: 25,
            large: 50
        };
        return expMap[type] || 10;
    }

    /**
     * 获取等级名称
     */
    getLevelName(level) {
        const names = {
            1: '初学者',
            2: '新手',
            3: '学徒',
            4: '熟手',
            5: '进步者',
            6: '能手',
            7: '熟练者',
            8: '专家',
            9: '大师',
            10: '优秀者'
        };

        if (level <= 10) {
            return names[level] || '未知';
        } else if (level <= 20) {
            return '专家';
        } else if (level <= 30) {
            return '大师';
        } else {
            return '传奇';
        }
    }

    /**
     * 计算统计数据
     */
    calculateStats() {
        const now = new Date();
        const today = now.toDateString();
        const thisMonth = now.getMonth();

        const userStats = storage.getUserStats();
        const achievementStats = userStats.stats?.achievements || {};

        return {
            total: this.achievements.length,
            today: this.achievements.filter(a =>
                new Date(a.createdAt).toDateString() === today
            ).length,
            thisMonth: this.achievements.filter(a =>
                new Date(a.createdAt).getMonth() === thisMonth
            ).length,
            currentStreak: this.calculateCurrentStreak(),
            badges: Object.values(this.badges).filter(b => b.unlocked).length,
            level: achievementStats.level || 1,
            experience: achievementStats.experience || 0
        };
    }

    /**
     * 显示统计
     */
    showStats() {
        this.openModal('statsModal');
        this.renderStatsCharts();
    }

    /**
     * 渲染统计图表
     */
    renderStatsCharts() {
        // 类型分布图
        const typeChart = document.getElementById('typeChart');
        if (typeChart) {
            const typeStats = this.getTypeDistribution();
            typeChart.innerHTML = this.renderTypeChart(typeStats);
        }

        // 趋势图
        const trendChart = document.getElementById('trendChart');
        if (trendChart) {
            const trendData = this.getTrendData();
            trendChart.innerHTML = this.renderTrendChart(trendData);
        }
    }

    /**
     * 获取类型分布
     */
    getTypeDistribution() {
        const types = { small: 0, medium: 0, large: 0 };
        this.achievements.forEach(achievement => {
            types[achievement.type] = (types[achievement.type] || 0) + 1;
        });
        return types;
    }

    /**
     * 获取趋势数据
     */
    getTrendData() {
        const last30Days = {};
        const today = new Date();

        // 初始化30天数据
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            last30Days[dateKey] = 0;
        }

        // 填充实际数据
        this.achievements.forEach(achievement => {
            const dateKey = achievement.createdAt.split('T')[0];
            if (last30Days.hasOwnProperty(dateKey)) {
                last30Days[dateKey]++;
            }
        });

        return last30Days;
    }

    /**
     * 渲染类型图表
     */
    renderTypeChart(data) {
        const total = Object.values(data).reduce((sum, count) => sum + count, 0);
        if (total === 0) {
            return '<p>暂无数据</p>';
        }

        const typeNames = {
            small: '小成就',
            medium: '中成就',
            large: '大成就'
        };

        const typeColors = {
            small: '#10b981',
            medium: '#f59e0b',
            large: '#ef4444'
        };

        return `
            <div class="type-chart-container">
                ${Object.entries(data).map(([type, count]) => {
                    const percentage = Math.round((count / total) * 100);
                    return `
                        <div class="type-stat">
                            <div class="type-color" style="background-color: ${typeColors[type]}"></div>
                            <div class="type-info">
                                <div class="type-name">${typeNames[type]}</div>
                                <div class="type-count">${count} (${percentage}%)</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 渲染趋势图表
     */
    renderTrendChart(data) {
        const values = Object.values(data);
        const maxValue = Math.max(...values, 1);

        return `
            <div class="trend-chart-container">
                <div class="trend-bars">
                    ${Object.entries(data).map(([date, count]) => {
                        const height = (count / maxValue) * 100;
                        const dateObj = new Date(date);
                        const day = dateObj.getDate();
                        const isToday = date === new Date().toISOString().split('T')[0];

                        return `
                            <div class="trend-bar ${isToday ? 'today' : ''}"
                                 style="height: ${height}%"
                                 title="${date}: ${count}个成就">
                                <div class="bar-day">${day}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
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
     * 导出成就记录
     */
    exportAchievements() {
        const data = {
            exportDate: new Date().toISOString(),
            achievements: this.achievements,
            stats: this.calculateStats(),
            badges: this.badges
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `achievements-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('成就记录已导出', 'success');
    }
}

// 初始化成就管理器
let achievementsManager;
document.addEventListener('DOMContentLoaded', () => {
    // 确保在成就页面才初始化
    if (document.getElementById('achievementsTimeline')) {
        achievementsManager = new AchievementsManager();
        window.achievementsManager = achievementsManager;
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementsManager;
}