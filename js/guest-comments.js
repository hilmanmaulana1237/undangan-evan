// New Guest Comments System
class GuestCommentsManager {
  constructor() {
    this.api = new CommentsAPI();
    this.currentPage = 1;
    this.itemsPerPage = 6;
    this.currentFilter = "all";
    this.isLoading = false;

    this.init();
  }

  async init() {
    await this.loadInitialData();
    this.setupEventListeners();
    this.renderStats();
    this.renderComments();
  }

  async loadInitialData() {
    // Jika localStorage kosong, load dari JSON
    const stored = localStorage.getItem("weddingComments");
    if (!stored) {
      try {
        const response = await fetch("./data/comments.json");
        const data = await response.json();
        localStorage.setItem("weddingComments", JSON.stringify(data));
      } catch (error) {
        console.log("Membuat data komentar baru...");
        const defaultData = { comments: [], total: 0, lastId: 0 };
        localStorage.setItem("weddingComments", JSON.stringify(defaultData));
      }
    }
  }

  setupEventListeners() {
    // Form submit - gunakan form yang ada
    const form = document.querySelector('#comment form, form[id*="comment"]');
    if (!form) {
      // Jika tidak ada form, buat event listener untuk button
      const submitBtn = document.querySelector(
        '[onclick*="undangan.comment.send"]'
      );
      if (submitBtn) {
        submitBtn.removeAttribute("onclick");
        submitBtn.addEventListener("click", (e) => this.handleFormSubmit(e));
      }
    } else {
      form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    // Filter buttons
    document
      .querySelectorAll('input[name="comment-filter"], [data-filter]')
      .forEach((element) => {
        if (element.type === "radio") {
          element.addEventListener("change", (e) => {
            this.currentFilter = e.target.value;
            this.currentPage = 1;
            this.renderComments();
          });
        } else {
          element.addEventListener("click", (e) => {
            // Remove active class from all filter buttons
            document
              .querySelectorAll("[data-filter]")
              .forEach((btn) => btn.classList.remove("active"));
            e.target.classList.add("active");

            this.currentFilter = e.target.dataset.filter;
            this.currentPage = 1;
            this.renderComments();
          });
        }
      });

    // Like buttons (delegated event)
    document.addEventListener("click", (e) => {
      if (e.target.closest(".like-btn, .like-button")) {
        this.handleLike(e.target.closest(".like-btn, .like-button"));
      }
    });
  }

  async handleFormSubmit(event) {
    event.preventDefault();

    if (this.isLoading) return;

    // Try to get form elements with multiple possible IDs
    const nameInput =
      document.getElementById("guest-name") ||
      document.getElementById("form-name") ||
      document.querySelector(
        'input[name="name"], input[placeholder*="nama" i]'
      );

    const presenceSelect =
      document.getElementById("guest-presence") ||
      document.getElementById("form-presence") ||
      document.querySelector(
        'select[name="presence"], select option[value="1"]'
      )?.parentElement;

    const messageTextarea =
      document.getElementById("guest-message") ||
      document.getElementById("form-comment") ||
      document.querySelector(
        'textarea[name="comment"], textarea[placeholder*="ucapan" i]'
      );

    const submitBtn =
      document.getElementById("submit-comment") ||
      document.querySelector('[onclick*="send"], button[type="submit"]') ||
      event.target;

    if (!nameInput || !presenceSelect || !messageTextarea) {
      this.showNotification(
        "Form elements tidak ditemukan. Periksa struktur HTML.",
        "error"
      );
      return;
    }

    // Get values
    const name = nameInput.value.trim();
    const presence = presenceSelect.value;
    const message = messageTextarea.value.trim();

    // Validate
    if (!name || name.length < 2) {
      this.showNotification("Nama harus diisi minimal 2 karakter", "error");
      nameInput.focus();
      return;
    }

    if (!presence || presence === "0") {
      this.showNotification("Silakan pilih konfirmasi kehadiran", "warning");
      presenceSelect.focus();
      return;
    }

    if (!message || message.length < 5) {
      this.showNotification(
        "Ucapan dan doa harus diisi minimal 5 karakter",
        "error"
      );
      messageTextarea.focus();
      return;
    }

    // Set loading state
    this.isLoading = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin me-2"></i>Mengirim...';

      // Store original text for later restoration
      submitBtn.dataset.originalText = originalText;
    }

    try {
      // Add comment
      const newComment = this.api.addComment({
        name: name,
        presence: parseInt(presence),
        comment: message,
      });

      // Reset form
      nameInput.value = "";
      presenceSelect.value = presenceSelect.querySelector('option[value="0"]')
        ? "0"
        : "";
      messageTextarea.value = "";

      // Show success
      this.showNotification(
        "Terima kasih atas ucapan dan doanya! 🙏",
        "success"
      );

      // Refresh display
      this.currentPage = 1;
      this.renderStats();
      this.renderComments();

      // Add confetti effect
      this.showConfetti();

      // Close any info alerts
      const infoAlert = document.getElementById("information");
      if (infoAlert) {
        infoAlert.style.display = "none";
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      this.showNotification("Terjadi kesalahan. Silakan coba lagi.", "error");
    } finally {
      // Reset loading state
      this.isLoading = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          submitBtn.dataset.originalText ||
          '<i class="fa-solid fa-paper-plane me-2"></i>Kirim Ucapan & Doa';
      }
    }
  }

  handleLike(button) {
    const commentId = parseInt(button.dataset.commentId);
    const isLiked = button.classList.contains("liked");

    if (isLiked) return; // Prevent multiple likes

    const updatedComment = this.api.likeComment(commentId);

    if (updatedComment) {
      // Update button state
      button.classList.add("liked");
      button.innerHTML = `<i class="fa-solid fa-heart text-danger"></i> ${updatedComment.likes}`;

      // Add animation
      button.style.transform = "scale(1.2)";
      setTimeout(() => {
        button.style.transform = "scale(1)";
      }, 200);

      // Update stats
      this.renderStats();

      // Show mini notification
      this.showMiniNotification("❤️ Terima kasih!");
    }
  }

  renderStats() {
    const stats = this.api.getStats();

    // Try multiple possible containers for stats
    let container =
      document.getElementById("comment-stats") ||
      document.querySelector(".row.text-center") ||
      document.querySelector("#comment .container");

    if (!container) {
      // Create stats container if doesn't exist
      const commentSection = document.getElementById("comment");
      if (commentSection) {
        const header = commentSection.querySelector("h2");
        if (header) {
          const statsHTML = `
            <div class="row text-center mb-4" id="comment-stats">
              <div class="col-4">
                <div class="bg-theme-auto rounded-4 p-3">
                  <h5 class="mb-1 text-primary">${stats.total}</h5>
                  <small class="text-muted">Total Ucapan</small>
                </div>
              </div>
              <div class="col-4">
                <div class="bg-theme-auto rounded-4 p-3">
                  <h5 class="mb-1 text-success">${stats.hadir}</h5>
                  <small class="text-muted">Hadir</small>
                </div>
              </div>
              <div class="col-4">
                <div class="bg-theme-auto rounded-4 p-3">
                  <h5 class="mb-1 text-danger">${stats.berhalangan}</h5>
                  <small class="text-muted">Berhalangan</small>
                </div>
              </div>
            </div>
          `;
          header.insertAdjacentHTML("afterend", statsHTML);
          return;
        }
      }
    }

    // Update existing stats container
    if (container && container.id === "comment-stats") {
      container.innerHTML = `
        <div class="col-4">
          <div class="bg-theme-auto rounded-4 p-3 text-center">
            <h4 class="mb-1 text-primary">${stats.total}</h4>
            <small class="text-muted">Total Ucapan</small>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-theme-auto rounded-4 p-3 text-center">
            <h4 class="mb-1 text-success">${stats.hadir}</h4>
            <small class="text-muted">Hadir</small>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-theme-auto rounded-4 p-3 text-center">
            <h4 class="mb-1 text-danger">${stats.berhalangan}</h4>
            <small class="text-muted">Berhalangan</small>
          </div>
        </div>
      `;
    }
  }

  renderComments() {
    // Try multiple possible containers
    const container =
      document.getElementById("guest-comments-list") ||
      document.getElementById("comments") ||
      document.querySelector("#comment .py-3, #comment [data-loading]");

    const loadingElement =
      document.getElementById("comments-loading") ||
      document.getElementById("loading-comments");

    if (!container) {
      console.warn("Comments container not found");
      return;
    }

    // Show loading
    if (loadingElement) {
      loadingElement.style.display = "block";
    } else {
      container.innerHTML = `
        <div class="text-center py-4" id="temp-loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Memuat ucapan dan doa...</p>
        </div>
      `;
    }

    setTimeout(() => {
      let commentsData;

      if (this.currentFilter === "all") {
        commentsData = this.api.getComments(
          this.currentPage,
          this.itemsPerPage
        );
      } else {
        commentsData = this.api.getCommentsByPresence(
          this.currentFilter,
          this.currentPage,
          this.itemsPerPage
        );
      }

      // Hide loading
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
      const tempLoading = document.getElementById("temp-loading");
      if (tempLoading) {
        tempLoading.remove();
      }

      if (commentsData.comments.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <div class="mb-4">
              <i class="fa-regular fa-comments fa-4x text-muted opacity-50"></i>
            </div>
            <h5 class="text-muted">Belum ada ucapan dan doa</h5>
            <p class="text-muted">Jadilah yang pertama memberikan ucapan selamat!</p>
          </div>
        `;
        this.hidePagination();
        return;
      }

      let html = '<div class="row">';

      commentsData.comments.forEach((comment, index) => {
        const presenceInfo = this.getPresenceInfo(comment.presence);
        const timeAgo = this.getTimeAgo(comment.timestamp);
        const avatar = this.generateAvatar(comment.name);

        html += `
          <div class="col-md-6 mb-4">
            <div class="card h-100 border-0 shadow-sm comment-card" style="animation-delay: ${
              index * 100
            }ms">
              <div class="card-body">
                <div class="d-flex align-items-start mb-3">
                  <div class="avatar me-3">${avatar}</div>
                  <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${this.escapeHtml(
                      comment.name
                    )}</h6>
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge ${presenceInfo.class}">${
          presenceInfo.text
        }</span>
                      <small class="text-muted">${timeAgo}</small>
                    </div>
                  </div>
                  <button class="btn btn-sm btn-outline-danger like-btn like-button" data-comment-id="${
                    comment.id
                  }">
                    <i class="fa-regular fa-heart"></i> ${comment.likes}
                  </button>
                </div>
                <p class="card-text">${this.formatMessage(comment.comment)}</p>
              </div>
            </div>
          </div>
        `;
      });

      html += "</div>";
      container.innerHTML = html;

      // Render pagination
      this.renderPagination(commentsData);
    }, 300); // Small delay for better UX
  }

  renderPagination(commentsData) {
    // Try multiple possible pagination containers
    const container =
      document.getElementById("comments-pagination") ||
      document.getElementById("guest-comments-pagination") ||
      document.getElementById("pagination");

    let pagination;

    if (!container) {
      console.warn("Pagination container not found, creating one");
      const commentsContainer =
        document.getElementById("guest-comments-list") ||
        document.getElementById("comments") ||
        document.querySelector("#comment .py-3, #comment [data-loading]");

      if (commentsContainer && commentsContainer.parentNode) {
        const paginationContainer = document.createElement("div");
        paginationContainer.id = "guest-comments-pagination";
        paginationContainer.className = "mt-4";
        commentsContainer.parentNode.insertBefore(
          paginationContainer,
          commentsContainer.nextSibling
        );

        const paginationElement = document.createElement("ul");
        paginationElement.className = "pagination justify-content-center";
        paginationContainer.appendChild(paginationElement);
        pagination = paginationElement;
      } else {
        console.warn("Cannot create pagination container");
        return;
      }
    } else {
      pagination = container.querySelector(".pagination");
      if (!pagination) {
        pagination = document.createElement("ul");
        pagination.className = "pagination justify-content-center";
        container.appendChild(pagination);
      }
    }

    if (commentsData.totalPages <= 1) {
      if (container) container.style.display = "none";
      return;
    }

    if (container) container.style.display = "block";

    let html = "";

    // Previous
    if (commentsData.hasPrev) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${this.currentPage - 1}">
            <i class="fa-solid fa-chevron-left"></i>
          </a>
        </li>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(commentsData.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const active = i === this.currentPage ? "active" : "";
      html += `
        <li class="page-item ${active}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    // Next
    if (commentsData.hasNext) {
      html += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${this.currentPage + 1}">
            <i class="fa-solid fa-chevron-right"></i>
          </a>
        </li>
      `;
    }

    pagination.innerHTML = html;

    // Add click listeners
    pagination.querySelectorAll("[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.currentPage = parseInt(
          e.target.closest("[data-page]").dataset.page
        );
        this.renderComments();

        // Smooth scroll to comments
        const commentsSection =
          document.getElementById("guest-comments") ||
          document.getElementById("comment") ||
          document.querySelector("#comment");
        if (commentsSection) {
          commentsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  hidePagination() {
    const container =
      document.getElementById("comments-pagination") ||
      document.getElementById("guest-comments-pagination") ||
      document.getElementById("pagination");
    if (container) {
      container.style.display = "none";
    }
  }

  // Helper methods
  getPresenceInfo(presence) {
    return presence === 1
      ? { class: "bg-success text-white", text: "✅ Hadir" }
      : { class: "bg-danger text-white", text: "❌ Berhalangan" };
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}j`;
    if (days < 7) return `${days}h`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  }

  generateAvatar(name) {
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
    ];
    const color = colors[name.length % colors.length];

    return `<div class="avatar-circle" style="background-color: ${color}">${initials}</div>`;
  }

  formatMessage(text) {
    return this.escapeHtml(text)
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = "info") {
    const colors = {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
    };

    const notification = document.createElement("div");
    notification.className = "toast-notification";
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 9999;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 350px;
        `;
    notification.innerHTML = `
            <div class="d-flex align-items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; margin-left: 1rem; cursor: pointer;">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto remove
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = "translateX(400px)";
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  showMiniNotification(message) {
    const mini = document.createElement("div");
    mini.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            z-index: 9999;
            font-size: 0.9rem;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
    mini.textContent = message;

    document.body.appendChild(mini);

    setTimeout(() => (mini.style.opacity = "1"), 100);
    setTimeout(() => {
      mini.style.opacity = "0";
      setTimeout(() => mini.remove(), 300);
    }, 1500);
  }

  showConfetti() {
    // Simple confetti effect
    if (typeof confetti !== "undefined") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.guestComments = new GuestCommentsManager();
});

// Add custom CSS for animations and styling
const commentStyles = document.createElement("style");
commentStyles.textContent = `
    .comment-card {
        animation: fadeInUp 0.5s ease forwards;
        opacity: 0;
        transform: translateY(20px);
    }

    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        flex-shrink: 0;
    }

    .avatar-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 0.9rem;
    }

    .like-btn.liked {
        background-color: #dc3545 !important;
        border-color: #dc3545 !important;
        color: white !important;
    }

    .like-btn:hover {
        transform: scale(1.05);
    }

    .comment-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        transition: all 0.3s ease;
    }

    #new-comment-form {
        background: rgba(255,255,255,0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    }

    .btn-check:checked + .btn {
        background-color: var(--bs-primary);
        border-color: var(--bs-primary);
        color: white;
    }
`;
document.head.appendChild(commentStyles);
