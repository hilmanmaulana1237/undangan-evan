// JSON Direct Access Patch - No server required
window.addEventListener("DOMContentLoaded", function () {
  console.log("🔧 Loading JSON direct access patch...");

  // Wait for both undangan and jsonStorage to be available
  const waitForDependencies = setInterval(() => {
    if (window.undangan && window.jsonStorage && window.jsonStorage.isLoaded) {
      clearInterval(waitForDependencies);
      patchUndanganForJSON();
    }
  }, 100);

  function patchUndanganForJSON() {
    console.log("🔧 Patching undangan to use JSON storage directly...");

    // Store original request object
    const originalRequest = window.undangan.request || {};

    // Create new request object that uses JSON storage
    window.undangan.request = {
      ...originalRequest,

      // Comments API
      comment: {
        getAll: async function (page = 1, per_page = 10) {
          try {
            const result = await window.jsonStorage.getComments(page, per_page);
            
            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error fetching comments:", error);
            return {
              code: 500,
              data: { lists: [], count: 0 },
              error: [error.message],
            };
          }
        },

        store: async function (data) {
          try {
            const result = await window.jsonStorage.addComment(data);

            if (result.success) {
              return {
                code: 201,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error storing comment:", error);
            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        },

        like: async function (uuid) {
          try {
            const result = await window.jsonStorage.likeComment(uuid);

            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error liking comment:", error);
            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        },

        delete: async function (uuid) {
          try {
            const result = await window.jsonStorage.deleteComment(uuid);

            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error deleting comment:", error);
            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        },

        update: async function (uuid, data) {
          try {
            const result = await window.jsonStorage.updateComment(uuid, data);

            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error updating comment:", error);
            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        }
      },

      // Guests API
      guest: {
        getAll: async function (page = 1, per_page = 10) {
          try {
            const result = await window.jsonStorage.getGuests(page, per_page);
            
            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error fetching guests:", error);
            return {
              code: 500,
              data: { guests: [], total: 0 },
              error: [error.message],
            };
          }
        },

        store: async function (data) {
          try {
            const result = await window.jsonStorage.addGuest(data);

            if (result.success) {
              return {
                code: 201,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error storing guest:", error);
            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        }
      },

      // Settings API
      settings: {
        get: async function () {
          try {
            const result = await window.jsonStorage.getSettings();
            
            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error fetching settings:", error);
            return {
              code: 500,
              data: {},
              error: [error.message],
            };
          }
        },

        update: async function (data) {
          try {
            const result = await window.jsonStorage.updateSettings(data);

            if (result.success) {
              return {
                code: 200,
                data: result.data,
                error: null,
              };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error("Error updating settings:", error);
            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        }
      }
    };

    // Override connection module if available
    if (window.undangan.connection) {
      // Replace request functions to use JSON storage
      const originalHTTP = window.undangan.connection.request || {};
      
      window.undangan.connection.request = {
        ...originalHTTP,
        
        // Override HTTP methods to use JSON storage
        GET: function(url) {
          return {
            token: () => ({ 
              send: async () => {
                if (url.includes('/api/v2/comment')) {
                  const urlParams = new URLSearchParams(url.split('?')[1] || '');
                  const per = parseInt(urlParams.get('per')) || 10;
                  const next = parseInt(urlParams.get('next')) || 1;
                  
                  return window.undangan.request.comment.getAll(next, per);
                } else if (url.includes('/api/settings')) {
                  return window.undangan.request.settings.get();
                }
                
                return { code: 404, data: null, error: ['Not found'] };
              }
            })
          };
        },

        POST: function(url) {
          return {
            token: () => ({
              body: (data) => ({
                send: async () => {
                  if (url.includes('/api/comment')) {
                    return window.undangan.request.comment.store(data);
                  } else if (url.includes('/api/guest')) {
                    return window.undangan.request.guest.store(data);
                  }
                  
                  return { code: 404, data: null, error: ['Not found'] };
                }
              })
            })
          };
        },

        PUT: function(url) {
          return {
            token: () => ({
              body: (data) => ({
                send: async () => {
                  if (url.includes('/api/comment/') && url.includes('/like')) {
                    const uuid = url.split('/')[3];
                    return window.undangan.request.comment.like(uuid);
                  } else if (url.includes('/api/comment/')) {
                    const uuid = url.split('/')[3];
                    return window.undangan.request.comment.update(uuid, data);
                  } else if (url.includes('/api/settings')) {
                    return window.undangan.request.settings.update(data);
                  }
                  
                  return { code: 404, data: null, error: ['Not found'] };
                }
              })
            })
          };
        },

        DELETE: function(url) {
          return {
            token: () => ({ 
              send: async () => {
                if (url.includes('/api/comment/')) {
                  const uuid = url.split('/')[3];
                  return window.undangan.request.comment.delete(uuid);
                }
                
                return { code: 404, data: null, error: ['Not found'] };
              }
            })
          };
        }
      };
    }

    console.log("✅ Undangan patched to use JSON storage directly");

    // Increment page view
    window.jsonStorage.incrementView();

    // Trigger initial comment load if comment system exists
    setTimeout(() => {
      if (window.undangan && window.undangan.comment && window.undangan.comment.show) {
        window.undangan.comment.show();
      }
    }, 1000);
  }

  // Utility function to show notifications
  function showNotification(message, type = 'info') {
    if (window.undangan && window.undangan.util && window.undangan.util.notify) {
      window.undangan.util.notify(message)[type]();
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // Handle offline storage
  function setupOfflineSupport() {
    // Save data periodically
    setInterval(() => {
      if (window.jsonStorage && window.jsonStorage.isLoaded) {
        window.jsonStorage.saveToLocalStorage();
      }
    }, 30000); // Save every 30 seconds

    // Handle visibility change to save data
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && window.jsonStorage && window.jsonStorage.isLoaded) {
        window.jsonStorage.saveToLocalStorage();
      }
    });

    // Handle beforeunload to save data
    window.addEventListener('beforeunload', () => {
      if (window.jsonStorage && window.jsonStorage.isLoaded) {
        window.jsonStorage.saveToLocalStorage();
      }
    });
  }

  setupOfflineSupport();
});

console.log("🔧 JSON direct access patch loaded");
