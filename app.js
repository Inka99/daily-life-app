/**
 * 主应用JavaScript文件
 * 负责应用的核心功能、路由、主题管理、事件处理等
 */

class DailyLifeApp {
    constructor() {
        this.currentPage = 'home';
        this.theme = 'light';
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('Initializing Daily Life App...');

            // 初始化主题
            this.initTheme();

            // 初始化事件监听
            this.initEventListeners();

            // 初始化导航
            this.initNavigation();

            // 初始化快捷键
            this.initKeyboardShortcuts();

            // 更新页面数据
            this.updatePageData();

            // 初始化通知
            this.initNotifications();

            // 初始化PWA
            this.initPWA();

            // 设置活动日期
            this.setActiveDate();

            console.log('App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    /**
     * 初始化主题
     */
    initTheme() {
        // 从存储中获取主题设置
        const settings = storage.getSettings();
        this.theme = settings.theme || 'light';

        // 应用主题
        this.applyTheme(this.theme);

        // 监听系统主题变化
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addListener((e) => {
                if (this.theme === 'system') {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * 应用主题
     */
    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }

        this.theme = theme;
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const themes = ['light', 'dark'];
        const currentIndex = themes.indexOf(this.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];

        this.applyTheme(nextTheme);
        storage.updateSettings({ theme: nextTheme });

        // 显示主题切换提示
        this.showToast(`已切换到${nextTheme === 'dark' ? '暗黑' : '明亮'}模式`);
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 主题切换按钮
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // 快速添加输入框回车事件
        const quickAddInput = document.getElementById('quickAddInput');
        if (quickAddInput) {
            quickAddInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.quickAddTodo(e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        // 搜索输入框
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });
        }

        // 搜索清除按钮
        const searchClear = document.getElementById('searchClear');
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchClear.style.display = 'none';
                this.handleSearch('');
            });
        }

        // 模态框点击外部关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target.id);
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // 监听存储事件
        storage.addEventListener('levelUp', (e) => {
            this.handleLevelUp(e.detail);
        });

        storage.addEventListener('milestone', (e) => {
            this.handleMilestone(e.detail);
        });

        // 监听在线/离线状态
        window.addEventListener('online', () => {
            this.showToast('网络连接已恢复', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('网络连接已断开，应用将在离线模式下运行', 'warning');
        });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updatePageData();
                this.setActiveDate();
            }
        });

        // 监听窗口大小变化
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    /**
     * 初始化导航
     */
    initNavigation() {
        // 底部导航
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // 返回按钮
        const backButtons = document.querySelectorAll('.back-button');
        backButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.goBack();
            });
        });

        // 功能卡片导航
        const featureCards = document.querySelectorAll('.feature-card[data-module]');
        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const module = card.getAttribute('data-module');
                this.navigateToModule(module);
            });
        });
    }

    /**
     * 导航到页面
     */
    navigateToPage(page) {
        if (page === this.currentPage) return;

        // 更新导航状态
        this.updateNavigation(page);

        // 页面切换逻辑
        switch (page) {
            case 'home':
                window.location.href = 'index.html';
                break;
            case 'stats':
                this.showStats();
                break;
            case 'calendar':
                this.showCalendar();
                break;
            case 'settings':
                this.showSettings();
                break;
            default:
                console.warn('Unknown page:', page);
        }
    }

    /**
     * 导航到功能模块
     */
    navigateToModule(module) {
        const modulePages = {
            todos: 'pages/todos.html',
            inspiration: 'pages/inspiration.html',
            gratitude: 'pages/gratitude.html',
            achievements: 'pages/achievements.html'
        };

        if (modulePages[module]) {
            window.location.href = modulePages[module];
        }
    }

    /**
     * 返回上一页
     */
    goBack() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'index.html';
        }
    }

    /**
     * 更新导航状态
     */
    updateNavigation(activePage) {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        this.currentPage = activePage;
    }

    /**
     * 初始化快捷键
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 快速搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleSearch();
            }

            // Ctrl/Cmd + N: 快速添加
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showAddMenu();
            }

            // Ctrl/Cmd + D: 切换主题
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * 初始化通知
     */
    initNotifications() {
        // 请求通知权限
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // 设置定时通知
        this.setupScheduledNotifications();
    }

    /**
     * 设置定时通知
     */
    setupScheduledNotifications() {
        const settings = storage.getSettings();

        // 检查是否启用了通知
        if (!settings.notifications?.gratitude?.enabled) return;

        // 设置感恩提醒
        const gratitudeTime = settings.notifications.gratitude.time || '20:00';
        this.scheduleNotification('gratitude', gratitudeTime, '每日感恩提醒', '今天你感恩了吗？');

        // 设置待办事项提醒
        if (settings.notifications?.todos?.enabled) {
            const todoTime = settings.notifications.todos.time || '09:00';
            this.scheduleNotification('todos', todoTime, '待办事项提醒', '记得查看今天的待办事项哦！');
        }
    }

    /**
     * 调度通知
     */
    scheduleNotification(type, time, title, body) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // 如果今天的时间已过，设置为明天
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delay = scheduledTime - now;

        setTimeout(() => {
            this.showNotification(title, body);
            // 设置每日重复
            this.scheduleNotification(type, time, title, body);
        }, delay);
    }

    /**
     * 显示通知
     */
    showNotification(title, body, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'assets/icons/icon-192x192.png',
                badge: 'assets/icons/badge-72x72.png',
                ...options
            });
        } else {
            // 降级为应用内通知
            this.showToast(body, 'info', 5000);
        }
    }

    /**
     * 初始化PWA
     */
    initPWA() {
        // 注册Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }

        // 监听安装提示
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // 显示安装提示
            this.showInstallPrompt(deferredPrompt);
        });

        // 监听应用安装
        window.addEventListener('appinstalled', () => {
            console.log('App was installed');
            this.showToast('应用已安装到桌面！', 'success');
            storage.updateSettings({ pwaInstalled: true });
        });
    }

    /**
     * 显示安装提示
     */
    showInstallPrompt(deferredPrompt) {
        const settings = storage.getSettings();
        if (settings.pwaInstalled) return;

        // 创建安装提示UI
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-banner-content">
                <div class="install-banner-text">
                    <h4>安装每日生活</h4>
                    <p>安装到桌面，随时随地记录生活</p>
                </div>
                <div class="install-banner-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.install-banner').remove()">稍后</button>
                    <button class="btn btn-primary" onclick="app.installPWA(deferredPrompt, this)">安装</button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-primary);
                border-top: 1px solid var(--border-light);
                box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                transform: translateY(100%);
                transition: transform 0.3s ease;
            }
            .install-banner.show {
                transform: translateY(0);
            }
            .install-banner-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-md) var(--spacing-lg);
                max-width: 600px;
                margin: 0 auto;
            }
            .install-banner-text h4 {
                margin: 0 0 var(--spacing-xs) 0;
                font-size: var(--text-base);
                color: var(--text-primary);
            }
            .install-banner-text p {
                margin: 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }
            .install-banner-actions {
                display: flex;
                gap: var(--spacing-sm);
            }
            @media (max-width: 480px) {
                .install-banner-content {
                    flex-direction: column;
                    gap: var(--spacing-md);
                    text-align: center;
                }
                .install-banner-actions {
                    width: 100%;
                }
                .install-banner-actions .btn {
                    flex: 1;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(installBanner);

        // 显示横幅
        setTimeout(() => {
            installBanner.classList.add('show');
        }, 1000);

        // 自动隐藏
        setTimeout(() => {
            if (document.body.contains(installBanner)) {
                installBanner.remove();
            }
        }, 30000);
    }

    /**
     * 安装PWA
     */
    installPWA(deferredPrompt, button) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;

            // 移除安装横幅
            const banner = button.closest('.install-banner');
            if (banner) {
                banner.remove();
            }
        });
    }

    /**
     * 设置活动日期
     */
    setActiveDate() {
        const dateDisplay = document.getElementById('currentDate');
        if (dateDisplay) {
            const today = new Date();
            const options = {
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            };
            dateDisplay.textContent = today.toLocaleDateString('zh-CN', options);
        }

        // 更新问候语
        this.updateGreeting();
    }

    /**
     * 更新问候语
     */
    updateGreeting() {
        const greeting = document.getElementById('greeting');
        if (!greeting) return;

        const hour = new Date().getHours();
        let greetingText;

        if (hour < 6) {
            greetingText = '夜深了';
        } else if (hour < 9) {
            greetingText = '早上好';
        } else if (hour < 12) {
            greetingText = '上午好';
        } else if (hour < 14) {
            greetingText = '中午好';
        } else if (hour < 17) {
            greetingText = '下午好';
        } else if (hour < 19) {
            greetingText = '傍晚好';
        } else if (hour < 22) {
            greetingText = '晚上好';
        } else {
            greetingText = '夜深了';
        }

        greeting.textContent = greetingText + '！';
    }

    /**
     * 更新页面数据
     */
    updatePageData() {
        this.updateStats();
        this.updateRecentData();
    }

    /**
     * 更新统计数据
     */
    updateStats() {
        const userStats = storage.getUserStats();

        // 更新待办事项统计
        const todosCount = document.getElementById('todosCount');
        if (todosCount) {
            const todayTodos = storage.getTodos().filter(todo =>
                new Date(todo.createdAt).toDateString() === new Date().toDateString()
            ).length;
            todosCount.textContent = todayTodos;
        }

        // 更新灵感统计
        const inspirationCount = document.getElementById('inspirationCount');
        if (inspirationCount) {
            inspirationCount.textContent = userStats.stats?.inspiration?.total || 0;
        }

        // 更新感恩统计
        const gratitudeCount = document.getElementById('gratitudeCount');
        if (gratitudeCount) {
            gratitudeCount.textContent = userStats.stats?.gratitude?.total || 0;
        }

        // 更新成就统计
        const achievementsCount = document.getElementById('achievementsCount');
        if (achievementsCount) {
            achievementsCount.textContent = userStats.stats?.achievements?.total || 0;
        }

        // 更新连续天数
        const streakDays = document.getElementById('streakDays');
        if (streakDays) {
            streakDays.textContent = userStats.stats?.gratitude?.currentStreak || 0;
        }

        // 更新待办事项进度
        this.updateTodoProgress();
    }

    /**
     * 更新待办事项进度
     */
    updateTodoProgress() {
        const todosProgress = document.getElementById('todosProgress');
        if (!todosProgress) return;

        const todos = storage.getTodos();
        const todayTodos = todos.filter(todo =>
            new Date(todo.createdAt).toDateString() === new Date().toDateString()
        );

        if (todayTodos.length === 0) {
            todosProgress.style.width = '0%';
            return;
        }

        const completedTodos = todayTodos.filter(todo => todo.status === 'completed').length;
        const progress = (completedTodos / todayTodos.length) * 100;

        todosProgress.style.width = `${progress}%`;
    }

    /**
     * 更新最近数据
     */
    updateRecentData() {
        // 更新最近灵感
        this.updateRecentInspiration();

        // 更新今日成就
        this.updateTodayAchievements();
    }

    /**
     * 更新最近灵感
     */
    updateRecentInspiration() {
        const recentInspiration = document.getElementById('recentInspiration');
        if (!recentInspiration) return;

        const inspirations = storage.getInspiration();
        if (inspirations.length === 0) {
            recentInspiration.innerHTML = '<p class="inspiration-text">记录你的灵感火花...</p>';
            return;
        }

        // 获取最近的灵感
        const latest = inspirations[inspirations.length - 1];
        const text = latest.content.length > 50
            ? latest.content.substring(0, 50) + '...'
            : latest.content;

        recentInspiration.innerHTML = `<p class="inspiration-text">"${text}"</p>`;
    }

    /**
     * 更新今日成就
     */
    updateTodayAchievements() {
        // 这里可以添加今日成就的逻辑
        // 目前在主页显示总成就数
    }

    /**
     * 显示添加菜单
     */
    showAddMenu() {
        const modal = document.getElementById('quickAddModal');
        if (modal) {
            this.openModal('quickAddModal');
        } else {
            // 降级处理：直接显示快速添加选项
            this.quickAdd('todo');
        }
    }

    /**
     * 切换搜索
     */
    toggleSearch() {
        const searchSection = document.getElementById('searchSection');
        const searchInput = document.getElementById('searchInput');

        if (searchSection && searchInput) {
            if (searchSection.style.display === 'none') {
                searchSection.style.display = 'block';
                searchInput.focus();
            } else {
                searchSection.style.display = 'none';
                searchInput.value = '';
                this.handleSearch('');
            }
        }
    }

    /**
     * 处理搜索
     */
    handleSearch(query) {
        const searchClear = document.getElementById('searchClear');
        if (searchClear) {
            searchClear.style.display = query ? 'block' : 'none';
        }

        // 触发搜索事件，让各个模块处理
        document.dispatchEvent(new CustomEvent('search', { detail: { query } }));
    }

    /**
     * 快速添加待办事项
     */
    quickAddTodo(title) {
        if (!title || !title.trim()) return;

        const todo = {
            title: title.trim(),
            description: '',
            priority: 'medium',
            category: 'other',
            status: 'pending'
        };

        storage.addTodo(todo);
        this.updateStats();
        this.showToast('待办事项已添加', 'success');
    }

    /**
     * 快速添加功能
     */
    quickAdd(type) {
        switch (type) {
            case 'todo':
                window.location.href = 'pages/todos.html';
                break;
            case 'inspiration':
                window.location.href = 'pages/inspiration.html';
                break;
            case 'gratitude':
                window.location.href = 'pages/gratitude.html';
                break;
            default:
                console.warn('Unknown quick add type:', type);
        }
    }

    /**
     * 从模态框快速添加
     */
    quickAddFromModal(type) {
        this.closeModal('quickAddModal');
        this.quickAdd(type);
    }

    /**
     * 显示统计
     */
    showStats() {
        // 这里可以实现统计页面的逻辑
        this.showToast('统计功能开发中...', 'info');
    }

    /**
     * 显示日历
     */
    showCalendar() {
        // 这里可以实现日历页面的逻辑
        this.showToast('日历功能开发中...', 'info');
    }

    /**
     * 显示设置
     */
    showSettings() {
        // 这里可以实现设置页面的逻辑
        this.showToast('设置功能开发中...', 'info');
    }

    /**
     * 显示模态框
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // 聚焦到第一个输入框
            const firstInput = modal.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * 关闭模态框
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info', duration = 3000) {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // 添加样式
        const style = document.createElement('style');
        if (!document.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%) translateY(-100px);
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    z-index: 2000;
                    opacity: 0;
                    transition: all 0.3s ease;
                    border: 1px solid var(--border-light);
                    font-size: var(--text-sm);
                    max-width: 80%;
                    text-align: center;
                }
                .toast.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                .toast-success {
                    background: var(--success-color);
                    color: white;
                    border-color: var(--success-color);
                }
                .toast-warning {
                    background: var(--warning-color);
                    color: white;
                    border-color: var(--warning-color);
                }
                .toast-error {
                    background: var(--error-color);
                    color: white;
                    border-color: var(--error-color);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // 显示Toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }

    /**
     * 处理升级事件
     */
    handleLevelUp(detail) {
        this.showToast(`🎉 恭喜升级到等级 ${detail.level}！`, 'success', 5000);

        // 可以添加更多升级效果，如烟花动画等
        this.playLevelUpAnimation();
    }

    /**
     * 处理里程碑事件
     */
    handleMilestone(detail) {
        this.showToast(`🏆 达成里程碑：等级 ${detail.level}`, 'success', 5000);
    }

    /**
     * 播放升级动画
     */
    playLevelUpAnimation() {
        // 创建升级动画效果
        const animation = document.createElement('div');
        animation.className = 'level-up-animation';
        animation.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <div class="level-up-text">升级！</div>
            </div>
        `;

        // 添加动画样式
        const style = document.createElement('style');
        if (!document.querySelector('#level-up-styles')) {
            style.id = 'level-up-styles';
            style.textContent = `
                .level-up-animation {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 3000;
                    pointer-events: none;
                }
                .level-up-content {
                    text-align: center;
                    animation: levelUpPulse 2s ease-out;
                }
                .level-up-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                .level-up-text {
                    font-size: 2rem;
                    font-weight: bold;
                    color: var(--primary-color);
                }
                @keyframes levelUpPulse {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(animation);

        // 移除动画
        setTimeout(() => {
            if (document.body.contains(animation)) {
                animation.remove();
            }
        }, 2000);
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 可以在这里添加响应式布局的逻辑
        console.log('Window resized');
    }

    /**
     * 导出数据
     */
    exportData() {
        try {
            const data = storage.exportData();
            if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `daily-life-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.showToast('数据导出成功', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('数据导出失败', 'error');
        }
    }

    /**
     * 导入数据
     */
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = storage.importData(e.target.result);
                if (result.success) {
                    this.showToast(result.message, 'success');
                    this.updatePageData();
                } else {
                    this.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Import failed:', error);
                this.showToast('数据导入失败', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 全局函数，供HTML调用
function navigateToModule(module) {
    app.navigateToModule(module);
}

function quickAdd(type) {
    app.quickAdd(type);
}

function quickAddFromModal(type) {
    app.quickAddFromModal(type);
}

function showAddMenu() {
    app.showAddMenu();
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

function goBack() {
    app.goBack();
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DailyLifeApp();
});

// 导出应用实例
window.app = app;