// Simple request handler for local server
window.addEventListener("DOMContentLoaded", function () {
  const API_BASE = "http://localhost:3001";

  // Wait for undangan object to be available
  const waitForUndangan = setInterval(() => {
    if (window.undangan && window.undangan.request) {
      clearInterval(waitForUndangan);
      patchUndanganRequest();
    }
  }, 100);

  function patchUndanganRequest() {
    console.log("🔧 Patching undangan request for local server...");

    const originalRequest = window.undangan.request;

    // Create new request object that uses local API
    window.undangan.request = {
      ...originalRequest,

      comment: {
        getAll: async function (page = 1, per_page = 10) {
          try {
            const response = await fetch(
              `${API_BASE}/api/comments?page=${page}&per_page=${per_page}`
            );
            const result = await response.json();

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
              data: null,
              error: [error.message],
            };
          }
        },

        store: async function (data) {
          try {
            const response = await fetch(`${API_BASE}/api/comments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            });

            const result = await response.json();

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

            // Store offline if network error
            if (error.name === "TypeError" || !navigator.onLine) {
              return storeOfflineComment(data);
            }

            return {
              code: 500,
              data: null,
              error: [error.message],
            };
          }
        },

        like: async function (uuid) {
          try {
            const response = await fetch(
              `${API_BASE}/api/comments/${uuid}/like`,
              {
                method: "PUT",
              }
            );

            const result = await response.json();

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
      },
    };

    console.log("✅ Undangan request patched successfully");

    // Sync offline comments if any
    syncOfflineComments();
  }

  function storeOfflineComment(data) {
    console.log("📱 Storing comment offline...");

    const offlineComments = JSON.parse(
      localStorage.getItem("offline_comments") || "[]"
    );

    const offlineComment = {
      uuid: "offline-" + Date.now(),
      id: Date.now(),
      own: data.name?.toLowerCase().replace(/\s+/g, "-") || "anonymous",
      name: data.name || "Anonymous",
      presence: data.presence || false,
      comment: data.comment || "",
      gif_url: data.gif_url || null,
      created_at: new Date().toISOString(),
      is_admin: false,
      is_parent: true,
      comments: [],
      like_count: 0,
      offline: true,
    };

    offlineComments.push(data);
    localStorage.setItem("offline_comments", JSON.stringify(offlineComments));

    // Show offline notification
    if (
      window.undangan &&
      window.undangan.util &&
      window.undangan.util.showAlert
    ) {
      window.undangan.util.showAlert(
        "Komentar disimpan offline. Akan disinkronisasi saat online.",
        "warning"
      );
    }

    return {
      code: 201,
      data: offlineComment,
      error: null,
    };
  }

  async function syncOfflineComments() {
    if (!navigator.onLine) return;

    const offlineComments = JSON.parse(
      localStorage.getItem("offline_comments") || "[]"
    );
    if (offlineComments.length === 0) return;

    console.log("🔄 Syncing offline comments...");

    for (const comment of offlineComments) {
      try {
        const response = await fetch(`${API_BASE}/api/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(comment),
        });

        if (response.ok) {
          console.log("✅ Synced comment from:", comment.name);
        } else {
          console.error("❌ Failed to sync comment");
          break;
        }
      } catch (error) {
        console.error("❌ Sync error:", error);
        break;
      }
    }

    localStorage.removeItem("offline_comments");
    console.log("✅ All offline comments synced");

    // Refresh comments if possible
    if (
      window.undangan &&
      window.undangan.comment &&
      window.undangan.comment.refresh
    ) {
      window.undangan.comment.refresh();
    }
  }

  // Listen for online events
  window.addEventListener("online", syncOfflineComments);
});

console.log("🔧 Simple local server patch loaded");
