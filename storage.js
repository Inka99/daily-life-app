/**
 * 数据存储管理模块
 * 负责所有本地数据的存储、读取、更新和删除操作
 */

class StorageManager {
    constructor() {
        this.prefix = 'dailyLife_';
        this.version = '1.0.0';
        this.collections = {
            todos: 'todos',
            inspiration: 'inspiration',
            gratitude: 'gratitude',
            achievements: 'achievements',
            settings: 'settings',
            userStats: 'userStats'
        };

        // 初始化存储
        this.init();
    }

    /**
     * 初始化存储系统
     */
    init() {
        // 检查localStorage可用性
        if (!this.isLocalStorageAvailable()) {
            console.warn('localStorage not available, using memory storage');
            this.useMemoryStorage = true;
        } else {
            this.useMemoryStorage = false;
        }

        // 初始化默认设置
        this.initDefaultSettings();

        // 初始化用户统计
        this.initUserStats();

        console.log('Storage initialized successfully');
    }

    /**
     * 检查localStorage是否可用
     */
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 获取完整的键名
     */
    getKey(key) {
        return this.prefix + key;
    }

    /**
     * 设置数据
     */
    set(key, value) {
        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                version: this.version
            };

            if (this.useMemoryStorage) {
                if (!window.memoryStorage) {
                    window.memoryStorage = {};
                }
                window.memoryStorage[this.getKey(key)] = data;
            } else {
                localStorage.setItem(this.getKey(key), JSON.stringify(data));
            }
            return true;
        } catch (error) {
            console.error('Error setting data:', error);
            return false;
        }
    }

    /**
     * 获取数据
     */
    get(key, defaultValue = null) {
        try {
            let data;

            if (this.useMemoryStorage) {
                data = window.memoryStorage?.[this.getKey(key)];
            } else {
                const item = localStorage.getItem(this.getKey(key));
                if (item) {
                    data = JSON.parse(item);
                }
            }

            if (data && data.value !== undefined) {
                return data.value;
            }

            return defaultValue;
        } catch (error) {
            console.error('Error getting data:', error);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     */
    remove(key) {
        try {
            if (this.useMemoryStorage) {
                delete window.memoryStorage?.[this.getKey(key)];
            } else {
                localStorage.removeItem(this.getKey(key));
            }
            return true;
        } catch (error) {
            console.error('Error removing data:', error);
            return false;
        }
    }

    /**
     * 检查数据是否存在
     */
    exists(key) {
        if (this.useMemoryStorage) {
            return window.memoryStorage?.[this.getKey(key)] !== undefined;
        } else {
            return localStorage.getItem(this.getKey(key)) !== null;
        }
    }

    /**
     * 获取所有键
     */
    getAllKeys() {
        try {
            let keys = [];

            if (this.useMemoryStorage) {
                if (window.memoryStorage) {
                    keys = Object.keys(window.memoryStorage).filter(key =>
                        key.startsWith(this.prefix)
                    ).map(key => key.replace(this.prefix, ''));
                }
            } else {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keys.push(key.replace(this.prefix, ''));
                    }
                }
            }

            return keys;
        } catch (error) {
            console.error('Error getting all keys:', error);
            return [];
        }
    }

    /**
     * 清空所有数据
     */
    clear() {
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => this.remove(key));
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            let itemCount = 0;

            if (this.useMemoryStorage) {
                if (window.memoryStorage) {
                    for (const key in window.memoryStorage) {
                        if (key.startsWith(this.prefix)) {
                            totalSize += JSON.stringify(window.memoryStorage[key]).length;
                            itemCount++;
                        }
                    }
                }
            } else {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        const value = localStorage.getItem(key);
                        totalSize += value.length;
                        itemCount++;
                    }
                }
            }

            return {
                totalSize: totalSize,
                itemCount: itemCount,
                formattedSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { totalSize: 0, itemCount: 0, formattedSize: '0 B' };
        }
    }

    /**
     * 格式化字节大小
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 初始化默认设置
     */
    initDefaultSettings() {
        const defaultSettings = {
            theme: 'light',
            language: 'zh-CN',
            notifications: {
                gratitude: {
                    enabled: true,
                    time: '20:00'
                },
                todos: {
                    enabled: true,
                    time: '09:00'
                }
            },
            privacy: {
                analytics: false,
                crashReporting: false
            },
            preferences: {
                autoSave: true,
                animation: true,
                sound: false
            }
        };

        if (!this.exists(this.collections.settings)) {
            this.set(this.collections.settings, defaultSettings);
        }
    }

    /**
     * 初始化用户统计
     */
    initUserStats() {
        const defaultStats = {
            joinDate: new Date().toISOString(),
            totalDays: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            stats: {
                todos: {
                    total: 0,
                    completed: 0,
                    todayCompleted: 0,
                    thisMonthCompleted: 0
                },
                inspiration: {
                    total: 0,
                    today: 0,
                    thisMonth: 0,
                    thisWeek: 0
                },
                gratitude: {
                    total: 0,
                    today: 0,
                    thisMonth: 0,
                    currentStreak: 0,
                    longestStreak: 0
                },
                achievements: {
                    total: 0,
                    today: 0,
                    thisMonth: 0,
                    level: 1,
                    experience: 0,
                    badges: []
                }
            },
            milestones: [],
            levelHistory: []
        };

        if (!this.exists(this.collections.userStats)) {
            this.set(this.collections.userStats, defaultStats);
        }
    }

    /**
     * 获取设置
     */
    getSettings() {
        return this.get(this.collections.settings, {});
    }

    /**
     * 更新设置
     */
    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return this.set(this.collections.settings, updatedSettings);
    }

    /**
     * 获取用户统计
     */
    getUserStats() {
        return this.get(this.collections.userStats, {});
    }

    /**
     * 更新用户统计
     */
    updateUserStats(newStats) {
        const currentStats = this.getUserStats();
        const updatedStats = { ...currentStats, ...newStats };
        return this.set(this.collections.userStats, updatedStats);
    }

    /**
     * 获取待办事项
     */
    getTodos() {
        return this.get(this.collections.todos, []);
    }

    /**
     * 保存待办事项
     */
    saveTodos(todos) {
        return this.set(this.collections.todos, todos);
    }

    /**
     * 添加待办事项
     */
    addTodo(todo) {
        const todos = this.getTodos();
        const newTodo = {
            id: this.generateId(),
            ...todo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        todos.push(newTodo);
        this.saveTodos(todos);
        this.updateTodoStats();
        return newTodo;
    }

    /**
     * 更新待办事项
     */
    updateTodo(id, updates) {
        const todos = this.getTodos();
        const index = todos.findIndex(todo => todo.id === id);
        if (index !== -1) {
            todos[index] = {
                ...todos[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveTodos(todos);
            this.updateTodoStats();
            return todos[index];
        }
        return null;
    }

    /**
     * 删除待办事项
     */
    deleteTodo(id) {
        const todos = this.getTodos();
        const filteredTodos = todos.filter(todo => todo.id !== id);
        const success = this.saveTodos(filteredTodos);
        if (success) {
            this.updateTodoStats();
        }
        return success;
    }

    /**
     * 更新待办事项统计
     */
    updateTodoStats() {
        const todos = this.getTodos();
        const today = new Date().toDateString();

        const stats = {
            total: todos.length,
            completed: todos.filter(todo => todo.status === 'completed').length,
            todayCompleted: todos.filter(todo =>
                todo.status === 'completed' &&
                new Date(todo.updatedAt).toDateString() === today
            ).length,
            thisMonthCompleted: todos.filter(todo =>
                todo.status === 'completed' &&
                new Date(todo.updatedAt).getMonth() === new Date().getMonth()
            ).length
        };

        const userStats = this.getUserStats();
        userStats.stats.todos = { ...userStats.stats.todos, ...stats };
        this.updateUserStats(userStats);
    }

    /**
     * 获取灵感记录
     */
    getInspiration() {
        return this.get(this.collections.inspiration, []);
    }

    /**
     * 保存灵感记录
     */
    saveInspiration(inspiration) {
        return this.set(this.collections.inspiration, inspiration);
    }

    /**
     * 添加灵感记录
     */
    addInspiration(inspiration) {
        const inspirations = this.getInspiration();
        const newInspiration = {
            id: this.generateId(),
            ...inspiration,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        inspirations.push(newInspiration);
        this.saveInspiration(inspirations);
        this.updateInspirationStats();
        return newInspiration;
    }

    /**
     * 更新灵感记录
     */
    updateInspiration(id, updates) {
        const inspirations = this.getInspiration();
        const index = inspirations.findIndex(item => item.id === id);
        if (index !== -1) {
            inspirations[index] = {
                ...inspirations[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveInspiration(inspirations);
            this.updateInspirationStats();
            return inspirations[index];
        }
        return null;
    }

    /**
     * 删除灵感记录
     */
    deleteInspiration(id) {
        const inspirations = this.getInspiration();
        const filteredInspirations = inspirations.filter(item => item.id !== id);
        const success = this.saveInspiration(filteredInspirations);
        if (success) {
            this.updateInspirationStats();
        }
        return success;
    }

    /**
     * 更新灵感统计
     */
    updateInspirationStats() {
        const inspirations = this.getInspiration();
        const today = new Date().toDateString();
        const thisWeek = this.getWeekStart();
        const thisMonth = new Date().getMonth();

        const stats = {
            total: inspirations.length,
            today: inspirations.filter(item =>
                new Date(item.createdAt).toDateString() === today
            ).length,
            thisWeek: inspirations.filter(item =>
                new Date(item.createdAt) >= thisWeek
            ).length,
            thisMonth: inspirations.filter(item =>
                new Date(item.createdAt).getMonth() === thisMonth
            ).length
        };

        const userStats = this.getUserStats();
        userStats.stats.inspiration = { ...userStats.stats.inspiration, ...stats };
        this.updateUserStats(userStats);
    }

    /**
     * 获取感恩记录
     */
    getGratitude() {
        return this.get(this.collections.gratitude, []);
    }

    /**
     * 保存感恩记录
     */
    saveGratitude(gratitude) {
        return this.set(this.collections.gratitude, gratitude);
    }

    /**
     * 添加感恩记录
     */
    addGratitude(gratitude) {
        const gratitudes = this.getGratitude();
        const newGratitude = {
            id: this.generateId(),
            ...gratitude,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        gratitudes.push(newGratitude);
        this.saveGratitude(gratitudes);
        this.updateGratitudeStats();
        return newGratitude;
    }

    /**
     * 更新感恩记录
     */
    updateGratitude(id, updates) {
        const gratitudes = this.getGratitude();
        const index = gratitudes.findIndex(item => item.id === id);
        if (index !== -1) {
            gratitudes[index] = {
                ...gratitudes[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveGratitude(gratitudes);
            this.updateGratitudeStats();
            return gratitudes[index];
        }
        return null;
    }

    /**
     * 删除感恩记录
     */
    deleteGratitude(id) {
        const gratitudes = this.getGratitude();
        const filteredGratitudes = gratitudes.filter(item => item.id !== id);
        const success = this.saveGratitude(filteredGratitudes);
        if (success) {
            this.updateGratitudeStats();
        }
        return success;
    }

    /**
     * 更新感恩统计
     */
    updateGratitudeStats() {
        const gratitudes = this.getGratitude();
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();

        const stats = {
            total: gratitudes.length,
            today: gratitudes.filter(item =>
                new Date(item.createdAt).toDateString() === today
            ).length,
            thisMonth: gratitudes.filter(item =>
                new Date(item.createdAt).getMonth() === thisMonth
            ).length
        };

        // 计算连续天数
        const streak = this.calculateGratitudeStreak(gratitudes);
        stats.currentStreak = streak.current;
        stats.longestStreak = streak.longest;

        const userStats = this.getUserStats();
        userStats.stats.gratitude = { ...userStats.stats.gratitude, ...stats };
        this.updateUserStats(userStats);
    }

    /**
     * 计算感恩连续天数
     */
    calculateGratitudeStreak(gratitudes) {
        if (gratitudes.length === 0) {
            return { current: 0, longest: 0 };
        }

        // 按日期分组
        const dates = {};
        gratitudes.forEach(item => {
            const date = new Date(item.createdAt).toDateString();
            dates[date] = true;
        });

        const sortedDates = Object.keys(dates).sort((a, b) =>
            new Date(b) - new Date(a)
        );

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        // 计算当前连续天数
        if (sortedDates.includes(today)) {
            currentStreak = 1;
            let checkDate = new Date(today);

            for (let i = 1; i < 365; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                const checkDateStr = checkDate.toDateString();
                if (sortedDates.includes(checkDateStr)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        } else if (sortedDates.includes(yesterday)) {
            // 如果今天没有记录，但昨天有，从昨天开始计算
            currentStreak = 1;
            let checkDate = new Date(yesterday);

            for (let i = 1; i < 365; i++) {
                checkDate.setDate(checkDate.getDate() - 1);
                const checkDateStr = checkDate.toDateString();
                if (sortedDates.includes(checkDateStr)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // 计算最长连续天数
        tempStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const prevDate = new Date(sortedDates[i - 1]);
            const diffDays = (prevDate - currentDate) / (24 * 60 * 60 * 1000);

            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return { current: currentStreak, longest: longestStreak };
    }

    /**
     * 获取成就记录
     */
    getAchievements() {
        return this.get(this.collections.achievements, []);
    }

    /**
     * 保存成就记录
     */
    saveAchievements(achievements) {
        return this.set(this.collections.achievements, achievements);
    }

    /**
     * 添加成就记录
     */
    addAchievement(achievement) {
        const achievements = this.getAchievements();
        const newAchievement = {
            id: this.generateId(),
            ...achievement,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        achievements.push(newAchievement);
        this.saveAchievements(achievements);
        this.updateAchievementStats(achievement);
        return newAchievement;
    }

    /**
     * 更新成就记录
     */
    updateAchievement(id, updates) {
        const achievements = this.getAchievements();
        const index = achievements.findIndex(item => item.id === id);
        if (index !== -1) {
            achievements[index] = {
                ...achievements[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveAchievements(achievements);
            this.updateAchievementStats(achievements[index]);
            return achievements[index];
        }
        return null;
    }

    /**
     * 删除成就记录
     */
    deleteAchievement(id) {
        const achievements = this.getAchievements();
        const filteredAchievements = achievements.filter(item => item.id !== id);
        const success = this.saveAchievements(filteredAchievements);
        if (success) {
            this.recalculateAchievementStats();
        }
        return success;
    }

    /**
     * 更新成就统计
     */
    updateAchievementStats(achievement) {
        const achievements = this.getAchievements();
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();

        // 计算经验值
        const expMap = {
            small: 10,
            medium: 25,
            large: 50
        };

        const totalExp = achievements.reduce((sum, item) => {
            return sum + (expMap[item.type] || 0);
        }, 0);

        // 计算等级
        const level = Math.floor(totalExp / 100) + 1;
        const levelExp = totalExp % 100;

        const stats = {
            total: achievements.length,
            today: achievements.filter(item =>
                new Date(item.createdAt).toDateString() === today
            ).length,
            thisMonth: achievements.filter(item =>
                new Date(item.createdAt).getMonth() === thisMonth
            ).length,
            level: level,
            experience: totalExp,
            levelExperience: levelExp
        };

        const userStats = this.getUserStats();
        userStats.stats.achievements = { ...userStats.stats.achievements, ...stats };
        this.updateUserStats(userStats);

        // 检查是否升级
        if (level > (userStats.stats.achievements.level || 1)) {
            this.handleLevelUp(level);
        }
    }

    /**
     * 重新计算成就统计
     */
    recalculateAchievementStats() {
        const achievements = this.getAchievements();
        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth();

        const expMap = {
            small: 10,
            medium: 25,
            large: 50
        };

        const totalExp = achievements.reduce((sum, item) => {
            return sum + (expMap[item.type] || 0);
        }, 0);

        const level = Math.floor(totalExp / 100) + 1;
        const levelExp = totalExp % 100;

        const stats = {
            total: achievements.length,
            today: achievements.filter(item =>
                new Date(item.createdAt).toDateString() === today
            ).length,
            thisMonth: achievements.filter(item =>
                new Date(item.createdAt).getMonth() === thisMonth
            ).length,
            level: level,
            experience: totalExp,
            levelExperience: levelExp
        };

        const userStats = this.getUserStats();
        userStats.stats.achievements = { ...userStats.stats.achievements, ...stats };
        this.updateUserStats(userStats);
    }

    /**
     * 处理升级
     */
    handleLevelUp(newLevel) {
        const userStats = this.getUserStats();

        // 添加升级记录
        if (!userStats.levelHistory) {
            userStats.levelHistory = [];
        }

        userStats.levelHistory.push({
            level: newLevel,
            timestamp: new Date().toISOString()
        });

        // 检查里程碑
        this.checkMilestones(newLevel);

        this.updateUserStats(userStats);

        // 触发升级事件
        this.dispatchEvent('levelUp', { level: newLevel });
    }

    /**
     * 检查里程碑
     */
    checkMilestones(level) {
        const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

        if (milestones.includes(level)) {
            const userStats = this.getUserStats();

            if (!userStats.milestones) {
                userStats.milestones = [];
            }

            const existingMilestone = userStats.milestones.find(m => m.level === level);

            if (!existingMilestone) {
                userStats.milestones.push({
                    level: level,
                    title: `达到等级 ${level}`,
                    description: `恭喜你达到了等级 ${level}！`,
                    timestamp: new Date().toISOString(),
                    type: 'level'
                });

                this.updateUserStats(userStats);
                this.dispatchEvent('milestone', { level: level });
            }
        }
    }

    /**
     * 获取本周开始日期
     */
    getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff));
    }

    /**
     * 导出数据
     */
    exportData() {
        try {
            const data = {
                version: this.version,
                exportDate: new Date().toISOString(),
                data: {
                    settings: this.getSettings(),
                    userStats: this.getUserStats(),
                    todos: this.getTodos(),
                    inspiration: this.getInspiration(),
                    gratitude: this.getGratitude(),
                    achievements: this.getAchievements()
                }
            };

            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * 导入数据
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            if (!data.data) {
                throw new Error('Invalid data format');
            }

            // 备份当前数据
            const backup = this.exportData();

            try {
                // 导入数据
                if (data.data.settings) {
                    this.set(this.collections.settings, data.data.settings);
                }
                if (data.data.userStats) {
                    this.set(this.collections.userStats, data.data.userStats);
                }
                if (data.data.todos) {
                    this.set(this.collections.todos, data.data.todos);
                }
                if (data.data.inspiration) {
                    this.set(this.collections.inspiration, data.data.inspiration);
                }
                if (data.data.gratitude) {
                    this.set(this.collections.gratitude, data.data.gratitude);
                }
                if (data.data.achievements) {
                    this.set(this.collections.achievements, data.data.achievements);
                }

                return { success: true, message: '数据导入成功' };
            } catch (importError) {
                // 恢复备份数据
                console.error('Import failed, restoring backup:', importError);
                this.importData(backup);
                throw importError;
            }
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, message: '数据导入失败: ' + error.message };
        }
    }

    /**
     * 触发事件
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail: detail });
        document.dispatchEvent(event);
    }

    /**
     * 监听事件
     */
    addEventListener(eventName, callback) {
        document.addEventListener(eventName, callback);
    }

    /**
     * 移除事件监听
     */
    removeEventListener(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }
}

// 创建全局存储管理器实例
window.storage = new StorageManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}