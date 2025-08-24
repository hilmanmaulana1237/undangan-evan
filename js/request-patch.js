// Monkey patch untuk mengarahkan request ke local server
(function() {
    // Wait for the main script to load
    function waitForUndangan() {
        if (typeof window.undangan !== 'undefined' && window.undangan.request) {
            patchRequestModule();
        } else {
            setTimeout(waitForUndangan, 100);
        }
    }

    function patchRequestModule() {
        const originalRequest = window.undangan.request;
        
        // Create local request function
        function localRequest(method, path) {
            const LOCAL_BASE_URL = 'http://localhost:3000';
            
            // Convert old API paths to new local paths
            const pathMapping = {
                'comments': '/api/comments',
                'comments/like': '/api/comments/like',
                'guest': '/api/guests'
            };
            
            // Map path to local endpoint
            let localPath = path;
            for (const [oldPath, newPath] of Object.entries(pathMapping)) {
                if (path.includes(oldPath)) {
                    localPath = path.replace(oldPath, newPath);
                    break;
                }
            }
            
            const fullUrl = `${LOCAL_BASE_URL}${localPath}`;
            
            return {
                send: async function(transform = null) {
                    try {
                        const options = {
                            method: method.toUpperCase(),
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        };
                        
                        if (this._body) {
                            options.body = this._body;
                        }
                        
                        if (this._token) {
                            options.headers['Authorization'] = `Bearer ${this._token}`;
                        }
                        
                        const response = await fetch(fullUrl, options);
                        const data = await response.json();
                        
                        if (response.ok) {
                            if (transform && data.data) {
                                data.data = transform(data.data);
                            }
                            
                            return {
                                code: response.status,
                                data: data.data || data,
                                error: null
                            };
                        } else {
                            throw new Error(data.error || 'Request failed');
                        }
                    } catch (error) {
                        console.error('Local request error:', error);
                        
                        // Fallback untuk offline mode
                        if (error.name === 'TypeError' || !navigator.onLine) {
                            return this.handleOffline(method, path, this._body);
                        }
                        
                        throw error;
                    }
                },
                
                handleOffline: function(method, path, body) {
                    console.log('Working offline, storing request locally');
                    
                    if (method === 'POST' && path.includes('comment')) {
                        const offlineComments = JSON.parse(localStorage.getItem('offline_comments') || '[]');
                        const commentData = JSON.parse(body);
                        
                        const offlineComment = {
                            uuid: 'offline-' + Date.now(),
                            id: Date.now(),
                            own: commentData.name?.toLowerCase().replace(/\s+/g, '-') || 'anonymous',
                            name: commentData.name || 'Anonymous',
                            presence: commentData.presence || false,
                            comment: commentData.comment || '',
                            gif_url: commentData.gif_url || null,
                            created_at: new Date().toISOString(),
                            is_admin: false,
                            is_parent: true,
                            comments: [],
                            like_count: 0,
                            offline: true
                        };
                        
                        offlineComments.push(commentData);
                        localStorage.setItem('offline_comments', JSON.stringify(offlineComments));
                        
                        return Promise.resolve({
                            code: 201,
                            data: offlineComment,
                            error: null
                        });
                    }
                    
                    return Promise.reject(new Error('Offline mode: Request not supported'));
                },
                
                token: function(tokenValue) {
                    this._token = tokenValue;
                    return this;
                },
                
                body: function(bodyData) {
                    this._body = JSON.stringify(bodyData);
                    return this;
                },
                
                withCache: function() { return this; },
                withRetry: function() { return this; },
                withCancel: function() { return this; }
            };
        }
        
        // Patch the undangan object
        window.undangan.request = {
            ...originalRequest,
            request: localRequest,
            
            // Patch specific comment methods
            comment: {
                getAll: async function(page = 1, per_page = 10) {
                    return localRequest('GET', `/api/comments?page=${page}&per_page=${per_page}`).send();
                },
                
                store: async function(data) {
                    return localRequest('POST', '/api/comments').body(data).send();
                },
                
                like: async function(uuid) {
                    return localRequest('PUT', `/api/comments/${uuid}/like`).send();
                }
            }
        };
        
        console.log('✅ Request module patched for local server');
        
        // Sync offline comments if online
        syncOfflineComments();
    }
    
    async function syncOfflineComments() {
        if (!navigator.onLine) return;
        
        const offlineComments = JSON.parse(localStorage.getItem('offline_comments') || '[]');
        if (offlineComments.length === 0) return;
        
        console.log('🔄 Syncing offline comments...');
        
        for (const comment of offlineComments) {
            try {
                const response = await fetch('http://localhost:3000/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(comment)
                });
                
                if (response.ok) {
                    console.log('✅ Synced comment from:', comment.name);
                } else {
                    console.error('❌ Failed to sync comment');
                    break;
                }
            } catch (error) {
                console.error('❌ Sync error:', error);
                break;
            }
        }
        
        localStorage.removeItem('offline_comments');
        console.log('✅ All offline comments synced');
    }
    
    // Listen for online events to sync
    window.addEventListener('online', syncOfflineComments);
    
    // Start the patching process
    waitForUndangan();
})();
