/**
 * 待办事项管理模块
 * 负责待办事项的增删改查、状态管理、筛选排序等功能
 */

class TodosManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';

        this.init();
    }

    /**
     * 初始化待办事项管理器
     */
    init() {
        this.initEventListeners();
        this.initFilters();
        this.initForms();
        this.loadTodos();
        this.updateStats();
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 快速添加
        const quickAddBtn = document.querySelector('.quick-add-button');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => this.quickAddTodo());
        }

        // 搜索功能
        document.addEventListener('search', (e) => {
            if (e.detail.query !== undefined) {
                this.searchQuery = e.detail.query.toLowerCase();
                this.renderTodos();
            }
        });

        // 筛选器
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.getAttribute('data-filter');
                this.renderTodos();
            });
        });

        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.getAttribute('data-category');
                this.renderTodos();
            });
        });

        // 表单提交
        const addForm = document.getElementById('addTodoForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTodo();
            });
        }

        const editForm = document.getElementById('editTodoForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditTodo();
            });
        }

        // 筛选按钮
        const filterButton = document.getElementById('filterButton');
        if (filterButton) {
            filterButton.addEventListener('click', () => {
                this.toggleFilterSection();
            });
        }
    }

    /**
     * 初始化筛选器
     */
    initFilters() {
        // 可以在这里添加更多筛选逻辑
    }

    /**
     * 初始化表单
     */
    initForms() {
        // 设置默认截止时间
        const dueDateInput = document.getElementById('todoDueDate');
        if (dueDateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDateInput.min = new Date().toISOString().slice(0, 16);
        }

        const editDueDateInput = document.getElementById('editTodoDueDate');
        if (editDueDateInput) {
            editDueDateInput.min = new Date().toISOString().slice(0, 16);
        }
    }

    /**
     * 加载待办事项
     */
    loadTodos() {
        this.todos = storage.getTodos();
        this.renderTodos();
    }

    /**
     * 渲染待办事项列表
     */
    renderTodos() {
        const container = document.getElementById('todosContainer');
        if (!container) return;

        // 筛选待办事项
        let filteredTodos = this.filterTodos();

        // 排序待办事项
        filteredTodos = this.sortTodos(filteredTodos);

        // 检查是否为空
        if (filteredTodos.length === 0) {
            this.renderEmptyState(container);
            return;
        }

        // 渲染待办事项
        const todosHTML = filteredTodos.map(todo => this.renderTodoItem(todo)).join('');
        container.innerHTML = todosHTML;

        // 添加事件监听
        this.attachTodoItemEvents();
    }

    /**
     * 筛选待办事项
     */
    filterTodos() {
        let filtered = [...this.todos];

        // 按状态筛选
        switch (this.currentFilter) {
            case 'today':
                const today = new Date().toDateString();
                filtered = filtered.filter(todo =>
                    new Date(todo.createdAt).toDateString() === today ||
                    (todo.dueDate && new Date(todo.dueDate).toDateString() === today)
                );
                break;
            case 'pending':
                filtered = filtered.filter(todo =>
                    todo.status === 'pending' || todo.status === 'progress'
                );
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.status === 'completed');
                break;
        }

        // 按分类筛选
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(todo => todo.category === this.currentCategory);
        }

        // 搜索筛选
        if (this.searchQuery) {
            filtered = filtered.filter(todo =>
                todo.title.toLowerCase().includes(this.searchQuery) ||
                (todo.description && todo.description.toLowerCase().includes(this.searchQuery))
            );
        }

        return filtered;
    }

    /**
     * 排序待办事项
     */
    sortTodos(todos) {
        return todos.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];

            // 处理日期类型
            if (this.sortBy === 'createdAt' || this.sortBy === 'updatedAt' || this.sortBy === 'dueDate') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            }

            // 处理优先级
            if (this.sortBy === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                aValue = priorityOrder[aValue] || 0;
                bValue = priorityOrder[bValue] || 0;
            }

            let result = 0;
            if (aValue > bValue) result = 1;
            if (aValue < bValue) result = -1;

            return this.sortOrder === 'desc' ? -result : result;
        });
    }

    /**
     * 渲染待办事项项
     */
    renderTodoItem(todo) {
        const isCompleted = todo.status === 'completed';
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !isCompleted;
        const priorityColors = {
            high: 'var(--error-color)',
            medium: 'var(--warning-color)',
            low: 'var(--info-color)'
        };

        const categoryNames = {
            work: '工作',
            life: '生活',
            study: '学习',
            health: '健康',
            other: '其他'
        };

        return `
            <div class="todo-item ${isCompleted ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-header">
                    <div class="todo-checkbox ${isCompleted ? 'checked' : ''}"
                         onclick="todosManager.toggleTodoStatus('${todo.id}')"></div>
                    <div class="todo-content">
                        <div class="todo-title">${this.escapeHtml(todo.title)}</div>
                        ${todo.description ? `<div class="todo-description">${this.escapeHtml(todo.description)}</div>` : ''}
                        <div class="todo-meta">
                            <div class="todo-priority">
                                <span class="priority-badge ${todo.priority}" style="background-color: ${priorityColors[todo.priority]}20; color: ${priorityColors[todo.priority]}">
                                    ${todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                                </span>
                            </div>
                            <div class="todo-category">
                                <span class="category-badge" style="background-color: var(--bg-tertiary); color: var(--text-secondary)">
                                    ${categoryNames[todo.category] || todo.category}
                                </span>
                            </div>
                            ${todo.dueDate ? `
                                <div class="todo-due-date ${isOverdue ? 'overdue' : ''}">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                                    </svg>
                                    <span>${this.formatDate(todo.dueDate)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button class="action-button" onclick="todosManager.editTodo('${todo.id}')" title="编辑">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-button" onclick="todosManager.deleteTodoConfirm('${todo.id}')" title="删除">
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
        let message = '暂无待办事项';
        let subMessage = '点击上方输入框添加新的待办事项';

        if (this.currentFilter !== 'all' || this.currentCategory !== 'all' || this.searchQuery) {
            message = '没有找到匹配的待办事项';
            subMessage = '尝试调整筛选条件或搜索关键词';
        }

        container.innerHTML = `
            <div class="empty-state" id="emptyState">
                <svg class="empty-icon" viewBox="0 0 24 24">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
                <p class="empty-text">${message}</p>
                <p class="empty-subtext">${subMessage}</p>
            </div>
        `;
    }

    /**
     * 添加待办事项事件监听
     */
    attachTodoItemEvents() {
        // 这里可以添加更多的事件监听逻辑
    }

    /**
     * 快速添加待办事项
     */
    quickAddTodo() {
        const input = document.getElementById('quickAddInput');
        if (!input || !input.value.trim()) return;

        const todo = {
            title: input.value.trim(),
            description: '',
            priority: 'medium',
            category: 'other',
            status: 'pending'
        };

        storage.addTodo(todo);
        this.loadTodos();
        this.updateStats();

        input.value = '';
        this.showToast('待办事项已添加', 'success');
    }

    /**
     * 处理添加待办事项
     */
    handleAddTodo() {
        const form = document.getElementById('addTodoForm');
        const formData = new FormData(form);

        const todo = {
            title: formData.get('title') || document.getElementById('todoTitle').value,
            description: document.getElementById('todoDescription').value,
            priority: formData.get('priority'),
            category: document.getElementById('todoCategory').value,
            status: 'pending',
            dueDate: document.getElementById('todoDueDate').value || null
        };

        if (!todo.title.trim()) {
            this.showToast('请输入待办事项标题', 'error');
            return;
        }

        storage.addTodo(todo);
        this.loadTodos();
        this.updateStats();

        this.closeModal('addTodoModal');
        this.showToast('待办事项已添加', 'success');
    }

    /**
     * 处理编辑待办事项
     */
    handleEditTodo() {
        const form = document.getElementById('editTodoForm');
        const todoId = document.getElementById('editTodoId').value;

        const updates = {
            title: document.getElementById('editTodoTitle').value,
            description: document.getElementById('editTodoDescription').value,
            status: document.getElementById('editTodoStatus').value,
            priority: document.querySelector('input[name="editPriority"]:checked')?.value,
            category: document.getElementById('editTodoCategory').value,
            dueDate: document.getElementById('editTodoDueDate').value || null
        };

        if (!updates.title.trim()) {
            this.showToast('请输入待办事项标题', 'error');
            return;
        }

        const updatedTodo = storage.updateTodo(todoId, updates);
        if (updatedTodo) {
            this.loadTodos();
            this.updateStats();
            this.closeModal('editTodoModal');
            this.showToast('待办事项已更新', 'success');
        } else {
            this.showToast('更新失败', 'error');
        }
    }

    /**
     * 切换待办事项状态
     */
    toggleTodoStatus(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        let newStatus;
        switch (todo.status) {
            case 'pending':
                newStatus = 'progress';
                break;
            case 'progress':
                newStatus = 'completed';
                break;
            case 'completed':
                newStatus = 'pending';
                break;
            default:
                newStatus = 'pending';
        }

        storage.updateTodo(todoId, { status: newStatus });
        this.loadTodos();
        this.updateStats();

        if (newStatus === 'completed') {
            this.showToast('待办事项已完成！', 'success');
        }
    }

    /**
     * 编辑待办事项
     */
    editTodo(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        // 填充表单
        document.getElementById('editTodoId').value = todo.id;
        document.getElementById('editTodoTitle').value = todo.title;
        document.getElementById('editTodoDescription').value = todo.description || '';
        document.getElementById('editTodoStatus').value = todo.status;
        document.getElementById('editTodoCategory').value = todo.category;

        // 设置优先级
        const priorityRadio = document.querySelector(`input[name="editPriority"][value="${todo.priority}"]`);
        if (priorityRadio) {
            priorityRadio.checked = true;
        }

        // 设置截止时间
        if (todo.dueDate) {
            document.getElementById('editTodoDueDate').value = todo.dueDate;
        }

        this.openModal('editTodoModal');
    }

    /**
     * 确认删除待办事项
     */
    deleteTodoConfirm(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;

        if (confirm(`确定要删除待办事项"${todo.title}"吗？`)) {
            this.deleteTodo(todoId);
        }
    }

    /**
     * 删除待办事项
     */
    deleteTodo(todoId) {
        const success = storage.deleteTodo(todoId);
        if (success) {
            this.loadTodos();
            this.updateStats();
            this.showToast('待办事项已删除', 'success');
        } else {
            this.showToast('删除失败', 'error');
        }
    }

    /**
     * 更新统计数据
     */
    updateStats() {
        const stats = {
            total: this.todos.length,
            pending: this.todos.filter(t => t.status === 'pending' || t.status === 'progress').length,
            completed: this.todos.filter(t => t.status === 'completed').length
        };

        // 更新统计显示
        const totalElement = document.getElementById('totalTodos');
        const pendingElement = document.getElementById('pendingTodos');
        const completedElement = document.getElementById('completedTodos');
        const rateElement = document.getElementById('completionRate');

        if (totalElement) totalElement.textContent = stats.total;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (completedElement) completedElement.textContent = stats.completed;

        if (rateElement && stats.total > 0) {
            const rate = Math.round((stats.completed / stats.total) * 100);
            rateElement.textContent = `${rate}%`;
        } else if (rateElement) {
            rateElement.textContent = '0%';
        }
    }

    /**
     * 切换筛选区域显示
     */
    toggleFilterSection() {
        const filterSection = document.getElementById('filterSection');
        if (filterSection) {
            const isHidden = filterSection.style.display === 'none';
            filterSection.style.display = isHidden ? 'block' : 'none';
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
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '明天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
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
     * 批量操作
     */
    markAllCompleted() {
        const pendingTodos = this.todos.filter(t =>
            t.status === 'pending' || t.status === 'progress'
        );

        pendingTodos.forEach(todo => {
            storage.updateTodo(todo.id, { status: 'completed' });
        });

        this.loadTodos();
        this.updateStats();
        this.showToast(`已完成 ${pendingTodos.length} 个待办事项`, 'success');
    }

    /**
     * 清理已完成事项
     */
    clearCompleted() {
        const completedTodos = this.todos.filter(t => t.status === 'completed');

        if (completedTodos.length === 0) {
            this.showToast('没有已完成的待办事项', 'info');
            return;
        }

        if (confirm(`确定要删除 ${completedTodos.length} 个已完成的待办事项吗？`)) {
            completedTodos.forEach(todo => {
                storage.deleteTodo(todo.id);
            });

            this.loadTodos();
            this.updateStats();
            this.showToast(`已删除 ${completedTodos.length} 个已完成的待办事项`, 'success');
        }
    }

    /**
     * 导出待办事项
     */
    exportTodos() {
        const data = {
            exportDate: new Date().toISOString(),
            todos: this.todos,
            stats: {
                total: this.todos.length,
                completed: this.todos.filter(t => t.status === 'completed').length,
                pending: this.todos.filter(t => t.status === 'pending' || t.status === 'progress').length
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('待办事项已导出', 'success');
    }
}

// 初始化待办事项管理器
let todosManager;
document.addEventListener('DOMContentLoaded', () => {
    // 确保在待办事项页面才初始化
    if (document.getElementById('todosContainer')) {
        todosManager = new TodosManager();
        window.todosManager = todosManager;
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodosManager;
}