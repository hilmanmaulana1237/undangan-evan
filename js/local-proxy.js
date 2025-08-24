// Local server configuration
const LOCAL_SERVER = "http://localhost:3000";

// Override request module to use local server for comments
if (typeof undangan !== "undefined" && undangan.request) {
  const originalRequest = undangan.request;

  undangan.request = {
    ...originalRequest,
    comment: {
      ...originalRequest.comment,
      getAll: async (page = 1, per_page = 10) => {
        try {
          const response = await fetch(
            `${LOCAL_SERVER}/api/comments?page=${page}&per_page=${per_page}`
          );
          return await response.json();
        } catch (error) {
          console.error("Error fetching comments:", error);
          return { success: false, error: error.message };
        }
      },
      store: async (data) => {
        try {
          const response = await fetch(`${LOCAL_SERVER}/api/comments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          return await response.json();
        } catch (error) {
          console.error("Error storing comment:", error);
          return { success: false, error: error.message };
        }
      },
      like: async (uuid) => {
        try {
          const response = await fetch(
            `${LOCAL_SERVER}/api/comments/${uuid}/like`,
            {
              method: "PUT",
            }
          );
          return await response.json();
        } catch (error) {
          console.error("Error liking comment:", error);
          return { success: false, error: error.message };
        }
      },
    },
  };
}

// Initialize offline fallback
if (typeof undangan !== "undefined" && undangan.storage) {
  const storage = undangan.storage;

  // Function to sync offline comments when online
  async function syncOfflineComments() {
    const offlineComments = storage.get("offline_comments") || [];
    if (offlineComments.length === 0) return;

    console.log("Syncing offline comments...");

    for (const comment of offlineComments) {
      try {
        const result = await undangan.request.comment.store(comment);
        if (result.success) {
          console.log("Synced comment:", comment.name);
        }
      } catch (error) {
        console.error("Failed to sync comment:", error);
        break; // Stop syncing on error
      }
    }

    // Clear synced comments
    storage.remove("offline_comments");
    console.log("Offline comments synced successfully");
  }

  // Check if online and sync
  if (navigator.onLine) {
    syncOfflineComments();
  }

  // Listen for online event
  window.addEventListener("online", syncOfflineComments);
}

console.log("Local server proxy loaded for comments API");
