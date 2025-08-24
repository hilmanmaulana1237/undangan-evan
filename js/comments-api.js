// Simple API for handling comments
class CommentsAPI {
  constructor() {
    this.storage = localStorage;
    this.storageKey = "weddingComments";
    this.initializeStorage();
  }

  initializeStorage() {
    const stored = this.storage.getItem(this.storageKey);
    if (!stored) {
      // Initialize with data from JSON file
      this.loadFromJSON();
    }
  }

  async loadFromJSON() {
    try {
      const response = await fetch("./data/comments.json");
      const data = await response.json();
      this.storage.setItem(this.storageKey, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error("Error loading comments from JSON:", error);
      const defaultData = { comments: [], total: 0, lastId: 0 };
      this.storage.setItem(this.storageKey, JSON.stringify(defaultData));
      return defaultData;
    }
  }

  getComments(page = 1, limit = 10) {
    const data = this.getData();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      comments: data.comments.slice(startIndex, endIndex),
      total: data.total,
      page: page,
      totalPages: Math.ceil(data.total / limit),
      hasNext: endIndex < data.total,
      hasPrev: page > 1,
    };
  }

  addComment(commentData) {
    const data = this.getData();
    const newComment = {
      id: data.lastId + 1,
      name: commentData.name,
      presence: parseInt(commentData.presence),
      comment: commentData.comment,
      timestamp: new Date().toISOString(),
      likes: 0,
      gif: commentData.gif || null,
    };

    data.comments.unshift(newComment);
    data.total++;
    data.lastId++;

    this.saveData(data);
    return newComment;
  }

  likeComment(commentId) {
    const data = this.getData();
    const comment = data.comments.find((c) => c.id === parseInt(commentId));

    if (comment) {
      comment.likes++;
      this.saveData(data);
      return comment;
    }

    return null;
  }

  deleteComment(commentId) {
    const data = this.getData();
    const index = data.comments.findIndex((c) => c.id === parseInt(commentId));

    if (index > -1) {
      const deletedComment = data.comments.splice(index, 1)[0];
      data.total--;
      this.saveData(data);
      return deletedComment;
    }

    return null;
  }

  updateComment(commentId, updateData) {
    const data = this.getData();
    const comment = data.comments.find((c) => c.id === parseInt(commentId));

    if (comment) {
      Object.assign(comment, updateData);
      this.saveData(data);
      return comment;
    }

    return null;
  }

  getData() {
    const stored = this.storage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : { comments: [], total: 0, lastId: 0 };
  }

  saveData(data) {
    this.storage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Export data untuk backup
  exportData() {
    return this.getData();
  }

  // Import data dari backup
  importData(data) {
    this.saveData(data);
  }

  // Clear all comments
  clearAll() {
    const emptyData = { comments: [], total: 0, lastId: 0 };
    this.saveData(emptyData);
  }

  // Search comments
  searchComments(query, page = 1, limit = 10) {
    const data = this.getData();
    const filteredComments = data.comments.filter(
      (comment) =>
        comment.name.toLowerCase().includes(query.toLowerCase()) ||
        comment.comment.toLowerCase().includes(query.toLowerCase())
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      comments: filteredComments.slice(startIndex, endIndex),
      total: filteredComments.length,
      page: page,
      totalPages: Math.ceil(filteredComments.length / limit),
      hasNext: endIndex < filteredComments.length,
      hasPrev: page > 1,
      query: query,
    };
  }

  // Get comments by presence status
  getCommentsByPresence(presence, page = 1, limit = 10) {
    const data = this.getData();
    const filteredComments = data.comments.filter(
      (comment) => comment.presence === parseInt(presence)
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      comments: filteredComments.slice(startIndex, endIndex),
      total: filteredComments.length,
      page: page,
      totalPages: Math.ceil(filteredComments.length / limit),
      hasNext: endIndex < filteredComments.length,
      hasPrev: page > 1,
      presence: presence,
    };
  }

  // Get statistics
  getStats() {
    const data = this.getData();
    const hadir = data.comments.filter((c) => c.presence === 1).length;
    const berhalangan = data.comments.filter((c) => c.presence === 2).length;
    const totalLikes = data.comments.reduce((sum, c) => sum + c.likes, 0);

    return {
      total: data.total,
      hadir: hadir,
      berhalangan: berhalangan,
      totalLikes: totalLikes,
      averageLikes: data.total > 0 ? (totalLikes / data.total).toFixed(1) : 0,
    };
  }
}

// Export untuk digunakan di file lain
window.CommentsAPI = CommentsAPI;
