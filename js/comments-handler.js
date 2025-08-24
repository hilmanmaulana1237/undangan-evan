// Comments Handler for Wedding Invitation
class CommentsHandler {
  constructor() {
    this.api = new CommentsAPI();
    this.currentPage = 1;
    this.commentsPerPage = 5;
    this.init();
  }

  async init() {
    this.renderComments();
    this.setupEventListeners();
    this.showStats();
  }

  setupEventListeners() {
    // Event listener untuk form submit
    const sendButton = document.querySelector(
      '[onclick="undangan.comment.send(this)"]'
    );
    if (sendButton) {
      sendButton.removeAttribute("onclick");
      sendButton.addEventListener("click", (e) => this.handleSubmit(e));
    }

    // Event listener untuk like buttons
    document.addEventListener("click", (e) => {
      if (e.target.closest(".like-button")) {
        this.handleLike(e.target.closest(".like-button"));
      }
    });

    // Event listener untuk filter presence
    this.setupPresenceFilter();
  }

  setupPresenceFilter() {
    const filterContainer = document.querySelector("#comment .container");
    if (!filterContainer) return;

    const filterHTML = `
            <div class="d-flex justify-content-center mb-3">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm active" data-filter="all">
                        Semua
                    </button>
                    <button type="button" class="btn btn-outline-success btn-sm" data-filter="1">
                        Hadir
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" data-filter="2">
                        Berhalangan
                    </button>
                </div>
            </div>
        `;

    const commentsDiv = document.getElementById("comments");
    commentsDiv.insertAdjacentHTML("beforebegin", filterHTML);

    // Add event listeners for filter buttons
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", (e) => {
        // Update active state
        document
          .querySelectorAll("[data-filter]")
          .forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");

        // Filter comments
        this.currentPage = 1;
        this.currentFilter = e.target.dataset.filter;
        this.renderComments();
      });
    });
  }

  async handleSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById("form-name");
    const presenceSelect = document.getElementById("form-presence");
    const commentTextarea = document.getElementById("form-comment");

    const name = nameInput.value.trim();
    const presence = parseInt(presenceSelect.value);
    const comment = commentTextarea.value.trim();

    // Validasi
    if (!name || name.length < 2) {
      this.showAlert("Nama harus diisi minimal 2 karakter", "danger");
      return;
    }

    if (presence === 0) {
      this.showAlert("Silakan pilih konfirmasi kehadiran", "warning");
      return;
    }

    if (!comment || comment.length < 1) {
      this.showAlert("Ucapan dan doa harus diisi", "warning");
      return;
    }

    // Tambah komentar baru
    const newComment = this.api.addComment({
      name: name,
      presence: presence,
      comment: comment,
    });

    // Reset form
    nameInput.value = "";
    presenceSelect.value = "0";
    commentTextarea.value = "";

    // Render ulang komentar
    this.currentPage = 1;
    this.renderComments();
    this.showStats();

    this.showAlert("Terima kasih atas ucapan dan doanya! 🙏", "success");
  }

  handleLike(button) {
    const commentId = parseInt(button.dataset.commentId);
    const updatedComment = this.api.likeComment(commentId);

    if (updatedComment) {
      // Update tampilan like
      const likeCount = button.querySelector(".like-count");
      likeCount.textContent = updatedComment.likes;

      // Animasi
      button.classList.add("liked");
      setTimeout(() => button.classList.remove("liked"), 600);

      // Update stats
      this.showStats();
    }
  }

  renderComments() {
    const commentsContainer = document.getElementById("comments");
    const paginationContainer = document.getElementById("pagination");

    if (!commentsContainer) return;

    // Show loading
    commentsContainer.innerHTML = `
            <div class="comments-loading">
                <div class="loading-spinner"></div>
            </div>
        `;

    // Simulate loading delay for better UX
    setTimeout(() => {
      let commentsData;

      if (this.currentFilter && this.currentFilter !== "all") {
        commentsData = this.api.getCommentsByPresence(
          this.currentFilter,
          this.currentPage,
          this.commentsPerPage
        );
      } else {
        commentsData = this.api.getComments(
          this.currentPage,
          this.commentsPerPage
        );
      }

      if (commentsData.comments.length === 0) {
        commentsContainer.innerHTML = `
                    <div class="empty-comments">
                        <i class="fa-regular fa-comments fa-3x"></i>
                        <p>Belum ada ucapan dan doa. Jadilah yang pertama!</p>
                    </div>
                `;
        paginationContainer.classList.add("d-none");
        return;
      }

      let commentsHTML = "";
      commentsData.comments.forEach((comment, index) => {
        const presenceIcon = comment.presence === 1 ? "✅" : "❌";
        const presenceText = comment.presence === 1 ? "Hadir" : "Berhalangan";
        const presenceClass =
          comment.presence === 1 ? "presence-hadir" : "presence-berhalangan";
        const formattedDate = this.formatDate(comment.timestamp);
        const avatar = this.generateAvatar(comment.name);

        commentsHTML += `
                    <div class="comment-item bg-theme-auto rounded-4 shadow-sm p-3 mb-3" data-aos="fade-up" data-aos-delay="${
                      index * 100
                    }">
                        <div class="d-flex gap-3">
                            <div class="comment-avatar">${avatar}</div>
                            <div class="comment-content">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h6 class="mb-1 fw-bold">${this.escapeHtml(
                                          comment.name
                                        )}</h6>
                                        <div class="comment-meta d-flex align-items-center gap-2">
                                            <small class="text-muted">
                                                <i class="fa-regular fa-clock me-1"></i>${formattedDate}
                                            </small>
                                            <span class="presence-badge ${presenceClass}">
                                                ${presenceIcon} ${presenceText}
                                            </span>
                                        </div>
                                    </div>
                                    <button class="like-button btn btn-sm" data-comment-id="${
                                      comment.id
                                    }">
                                        <i class="fa-solid fa-heart me-1"></i>
                                        <span class="like-count">${
                                          comment.likes
                                        }</span>
                                    </button>
                                </div>
                                <p class="comment-text mb-0">${this.formatComment(
                                  comment.comment
                                )}</p>
                            </div>
                        </div>
                    </div>
                `;
      });

      commentsContainer.innerHTML = commentsHTML;

      // Render pagination
      this.renderPagination(commentsData);
    }, 500);
  }

  renderPagination(commentsData) {
    const paginationContainer = document.getElementById("pagination");

    if (commentsData.totalPages <= 1) {
      paginationContainer.classList.add("d-none");
      return;
    }

    paginationContainer.classList.remove("d-none");

    let paginationHTML = '<ul class="pagination pagination-sm">';

    // Previous button
    if (commentsData.hasPrev) {
      paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${
                      this.currentPage - 1
                    }">
                        <i class="fa-solid fa-chevron-left"></i>
                    </a>
                </li>
            `;
    }

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(commentsData.totalPages, this.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage ? "active" : "";
      paginationHTML += `
                <li class="page-item ${isActive}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    }

    // Next button
    if (commentsData.hasNext) {
      paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${
                      this.currentPage + 1
                    }">
                        <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </li>
            `;
    }

    paginationHTML += "</ul>";
    paginationContainer.innerHTML = paginationHTML;

    // Add event listeners for pagination
    paginationContainer.querySelectorAll("[data-page]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.currentPage = parseInt(
          e.target.closest("[data-page]").dataset.page
        );
        this.renderComments();
      });
    });
  }

  showStats() {
    const stats = this.api.getStats();
    const statsContainer = document.querySelector("#comment h2");

    if (statsContainer) {
      const statsHTML = `
                <div class="row text-center mt-3 mb-4">
                    <div class="col-4">
                        <div class="bg-theme-auto rounded-4 p-2">
                            <h6 class="mb-0">${stats.total}</h6>
                            <small class="text-muted">Total</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="bg-theme-auto rounded-4 p-2">
                            <h6 class="mb-0 text-success">${stats.hadir}</h6>
                            <small class="text-muted">Hadir</small>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="bg-theme-auto rounded-4 p-2">
                            <h6 class="mb-0 text-danger">${stats.berhalangan}</h6>
                            <small class="text-muted">Berhalangan</small>
                        </div>
                    </div>
                </div>
            `;

      // Remove existing stats
      const existingStats =
        statsContainer.parentNode.querySelector(".row.text-center");
      if (existingStats) {
        existingStats.remove();
      }

      statsContainer.insertAdjacentHTML("afterend", statsHTML);
    }
  }

  generateAvatar(name) {
    return name.charAt(0).toUpperCase();
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  formatComment(text) {
    // Format teks seperti WhatsApp (bold, italic)
    return this.escapeHtml(text)
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>") // *bold*
      .replace(/_([^_]+)_/g, "<em>$1</em>") // _italic_
      .replace(/\n/g, "<br>"); // line breaks
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showAlert(message, type = "info") {
    // Hapus alert yang sudah ada
    const existingAlert = document.querySelector(".temp-alert");
    if (existingAlert) {
      existingAlert.remove();
    }

    const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show rounded-4 temp-alert" role="alert">
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                ${message}
            </div>
        `;

    const commentForm = document.querySelector("#comment .border");
    commentForm.insertAdjacentHTML("afterbegin", alertHTML);

    // Auto hide after 5 seconds
    setTimeout(() => {
      const alert = document.querySelector(".temp-alert");
      if (alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }
}

// Initialize comments handler when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.commentsHandler = new CommentsHandler();
});

// CSS untuk animasi like
const style = document.createElement("style");
style.textContent = `
    .like-button {
        transition: all 0.3s ease;
    }
    
    .like-button.liked {
        transform: scale(1.2);
        color: #dc3545 !important;
        border-color: #dc3545 !important;
    }
    
    .like-button:hover {
        transform: scale(1.1);
    }
    
    .like-button .fa-heart {
        transition: all 0.3s ease;
    }
    
    .like-button.liked .fa-heart {
        color: #dc3545;
    }
`;
document.head.appendChild(style);
