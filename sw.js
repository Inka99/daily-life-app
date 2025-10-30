/**
 * Service Worker
 * 负责离线缓存、资源管理、后台同步等功能
 */

const CACHE_NAME = 'daily-life-v1.0.0';
const STATIC_CACHE_NAME = 'daily-life-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'daily-life-dynamic-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/pages/todos.html',
    '/pages/inspiration.html',
    '/pages/gratitude.html',
    '/pages/achievements.html',
    '/css/main.css',
    '/css/components.css',
    '/css/responsive.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/todos.js',
    '/js/inspiration.js',
    '/js/gratitude.js',
    '/js/achievements.js',
    '/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

// 需要缓存的API路径
const CACHE_PATTERNS = [
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/
];

/**
 * 安装事件
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache static assets:', error);
            })
    );
});

/**
 * 激活事件
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 删除旧版本缓存
                        if (cacheName !== STATIC_CACHE_NAME &&
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Old caches cleaned up');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Failed to clean up old caches:', error);
            })
    );
});

/**
 * 网络请求拦截
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳过非HTTP(S)请求
    if (!request.url.startsWith('http')) {
        return;
    }

    // 静态资源缓存策略
    if (isStaticAsset(request.url)) {
        event.respondWith(handleStaticAsset(request));
        return;
    }

    // API请求缓存策略
    if (isAPIRequest(request.url)) {
        event.respondWith(handleAPIRequest(request));
        return;
    }

    // 页面请求缓存策略
    if (isNavigationRequest(request)) {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // 默认网络优先策略
    event.respondWith(
        fetch(request)
            .catch(() => {
                // 网络失败时尝试从缓存获取
                return caches.match(request);
            })
    );
});

/**
 * 处理静态资源
 */
function handleStaticAsset(request) {
    return caches.match(request)
        .then((response) => {
            if (response) {
                return response;
            }

            // 静态资源不在缓存中，从网络获取并缓存
            return fetch(request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 缓存响应
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE_NAME)
                        .then((cache) => {
                            cache.put(request, responseClone);
                        });

                    return response;
                });
        });
}

/**
 * 处理API请求
 */
function handleAPIRequest(request) {
    return fetch(request)
        .then((response) => {
            // 只缓存成功的GET请求
            if (request.method === 'GET' && response.ok) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                    .then((cache) => {
                        cache.put(request, responseClone);
                    });
            }
            return response;
        })
        .catch(() => {
            // 网络失败时尝试从缓存获取
            return caches.match(request);
        });
}

/**
 * 处理导航请求
 */
function handleNavigationRequest(request) {
    return fetch(request)
        .then((response) => {
            // 缓存成功的页面响应
            if (response.ok) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                    .then((cache) => {
                        cache.put(request, responseClone);
                    });
            }
            return response;
        })
        .catch(() => {
            // 网络失败时返回缓存的页面或离线页面
            return caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }

                    // 返回离线页面
                    return caches.match('/index.html');
                });
        });
}

/**
 * 推送事件
 */
self.addEventListener('push', (event) => {
    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: '/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/assets/icons/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        // 打开应用到相关页面
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 关闭通知
        event.notification.close();
    } else {
        // 默认操作：打开应用
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

/**
 * 后台同步事件
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

/**
 * 执行后台同步
 */
function doBackgroundSync() {
    return new Promise((resolve, reject) => {
        // 这里可以实现数据同步逻辑
        console.log('Background sync started');

        // 模拟同步过程
        setTimeout(() => {
            console.log('Background sync completed');
            resolve();
        }, 1000);
    });
}

/**
 * 消息事件
 */
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;

        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;

        default:
            console.log('Unknown message type:', type);
    }
});

/**
 * 清理所有缓存
 */
function clearAllCaches() {
    return caches.keys()
        .then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        });
}

/**
 * 检查是否为静态资源
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.endsWith(asset)) ||
           url.includes('/css/') ||
           url.includes('/js/') ||
           url.includes('/assets/') ||
           CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 检查是否为API请求
 */
function isAPIRequest(url) {
    // 这里可以添加API路径的判断逻辑
    return false;
}

/**
 * 检查是否为导航请求
 */
function isNavigationRequest(request) {
    return request.mode === 'navigate' ||
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * 缓存更新检查
 */
function checkForUpdates() {
    return fetch('/manifest.json')
        .then(response => response.json())
        .then(manifest => {
            const currentVersion = CACHE_NAME.split('-')[1];
            if (manifest.version && manifest.version !== currentVersion) {
                console.log('New version available:', manifest.version);
                return true;
            }
            return false;
        })
        .catch(() => false);
}

/**
 * 定期缓存清理
 */
self.addEventListener('message', (event) => {
    if (event.data.type === 'PERIODIC_SYNC') {
        event.waitUntil(
            Promise.all([
                clearOldCaches(),
                checkForUpdates()
            ])
        );
    }
});

/**
 * 清理旧缓存
 */
function clearOldCaches() {
    return caches.keys()
        .then((cacheNames) => {
            const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!currentCaches.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        });
}

// 错误处理
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});