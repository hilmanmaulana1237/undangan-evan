// JSON Storage Manager - Direct file access without server
class JSONStorage {
  constructor() {
    this.dataPath = './data/';
    this.cache = {
      comments: null,
      guests: null,
      settings: null
    };
    this.isLoaded = false;
    this.init();
  }

  async init() {
    try {
      await this.loadAllData();
      this.isLoaded = true;
      console.log('📁 JSON Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize JSON Storage:', error);
      this.initializeEmptyData();
    }
  }

  async loadAllData() {
    try {
      // Load comments
      const commentsResponse = await fetch(`${this.dataPath}comments.json`);
      this.cache.comments = await commentsResponse.json();

      // Load guests
      const guestsResponse = await fetch(`${this.dataPath}guests.json`);
      this.cache.guests = await guestsResponse.json();

      // Load settings
      const settingsResponse = await fetch(`${this.dataPath}settings.json`);
      this.cache.settings = await settingsResponse.json();

      console.log('✅ All JSON data loaded');
    } catch (error) {
      console.warn('⚠️ Failed to load JSON files, using localStorage fallback');
      this.loadFromLocalStorage();
    }
  }

  initializeEmptyData() {
    this.cache.comments = {
      comments: [],
      total: 0,
      lastId: 0
    };

    this.cache.guests = {
      guests: [],
      total: 0,
      lastId: 0
    };

    this.cache.settings = {
      event: {
        title: "Undangan Pernikahan",
        childName: "Mempelai",
        fatherName: "Bapak",
        motherName: "Ibu",
        date: new Date().toISOString().split('T')[0],
        time: "08:00:00",
        location: "Alamat Acara",
        mapUrl: "#"
      },
      contact: {
        phone: "08123456789",
        bankName: "Bank",
        bankAccount: "1234567890",
        bankHolder: "Nama Pemilik"
      },
      stats: {
        totalViews: 0,
        totalComments: 0,
        totalGuests: 0
      }
    };

    this.saveToLocalStorage();
  }

  loadFromLocalStorage() {
    this.cache.comments = JSON.parse(localStorage.getItem('json_comments') || '{"comments":[],"total":0,"lastId":0}');
    this.cache.guests = JSON.parse(localStorage.getItem('json_guests') || '{"guests":[],"total":0,"lastId":0}');
    this.cache.settings = JSON.parse(localStorage.getItem('json_settings') || '{}');
    
    if (!this.cache.settings.event) {
      this.initializeEmptyData();
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('json_comments', JSON.stringify(this.cache.comments));
    localStorage.setItem('json_guests', JSON.stringify(this.cache.guests));
    localStorage.setItem('json_settings', JSON.stringify(this.cache.settings));
  }

  // Comments API
  async getComments(page = 1, per_page = 10) {
    await this.waitForLoad();
    
    const start = (page - 1) * per_page;
    const end = start + per_page;
    const comments = this.cache.comments.comments.slice(start, end);

    return {
      success: true,
      data: {
        lists: comments,
        count: this.cache.comments.total,
        page: page,
        per_page: per_page
      }
    };
  }

  async addComment(commentData) {
    await this.waitForLoad();

    const newComment = {
      uuid: this.generateUUID(),
      id: ++this.cache.comments.lastId,
      own: commentData.name?.toLowerCase().replace(/\s+/g, '-') || 'anonymous',
      name: commentData.name || 'Anonymous',
      presence: commentData.presence !== undefined ? commentData.presence : true,
      comment: commentData.comment || '',
      gif_url: commentData.gif_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_admin: false,
      is_parent: !commentData.parent_id,
      parent_id: commentData.parent_id || null,
      comments: [],
      like_count: 0,
      user_agent: navigator.userAgent,
      ip: '127.0.0.1'
    };

    if (commentData.parent_id) {
      // Add as reply
      const parentComment = this.findCommentById(commentData.parent_id);
      if (parentComment) {
        parentComment.comments.push(newComment);
      }
    } else {
      // Add as main comment
      this.cache.comments.comments.unshift(newComment);
    }

    this.cache.comments.total++;
    this.cache.settings.stats.totalComments++;
    
    this.saveToLocalStorage();

    return {
      success: true,
      data: newComment
    };
  }

  async likeComment(uuid) {
    await this.waitForLoad();

    const comment = this.findCommentByUuid(uuid);
    if (comment) {
      comment.like_count = (comment.like_count || 0) + 1;
      this.saveToLocalStorage();
      
      return {
        success: true,
        data: {
          uuid: uuid,
          like_count: comment.like_count
        }
      };
    }

    return {
      success: false,
      error: 'Comment not found'
    };
  }

  async deleteComment(uuid) {
    await this.waitForLoad();

    const result = this.removeCommentByUuid(uuid);
    if (result) {
      this.cache.comments.total--;
      this.cache.settings.stats.totalComments--;
      this.saveToLocalStorage();
      
      return {
        success: true,
        data: { status: true }
      };
    }

    return {
      success: false,
      error: 'Comment not found'
    };
  }

  async updateComment(uuid, data) {
    await this.waitForLoad();

    const comment = this.findCommentByUuid(uuid);
    if (comment) {
      if (data.comment !== undefined) comment.comment = data.comment;
      if (data.presence !== undefined) comment.presence = data.presence;
      if (data.gif_url !== undefined) comment.gif_url = data.gif_url;
      comment.updated_at = new Date().toISOString();
      
      this.saveToLocalStorage();
      
      return {
        success: true,
        data: { status: true }
      };
    }

    return {
      success: false,
      error: 'Comment not found'
    };
  }

  // Guests API
  async getGuests(page = 1, per_page = 10) {
    await this.waitForLoad();
    
    const start = (page - 1) * per_page;
    const end = start + per_page;
    const guests = this.cache.guests.guests.slice(start, end);

    return {
      success: true,
      data: {
        guests: guests,
        total: this.cache.guests.total,
        page: page,
        per_page: per_page
      }
    };
  }

  async addGuest(guestData) {
    await this.waitForLoad();

    const newGuest = {
      id: ++this.cache.guests.lastId,
      name: guestData.name,
      type: guestData.type || '',
      category: guestData.category || 'Tamu',
      full_name: `${guestData.type} ${guestData.name}`.trim(),
      slug: guestData.name.toLowerCase().replace(/\s+/g, '-'),
      invitation_link: `index.html?to=${encodeURIComponent((guestData.type + ' ' + guestData.name).trim())}`,
      views: 0,
      comment_count: 0,
      created_at: new Date().toISOString()
    };

    this.cache.guests.guests.push(newGuest);
    this.cache.guests.total++;
    this.cache.settings.stats.totalGuests++;
    
    this.saveToLocalStorage();

    return {
      success: true,
      data: newGuest
    };
  }

  // Settings API
  async getSettings() {
    await this.waitForLoad();
    return {
      success: true,
      data: this.cache.settings
    };
  }

  async updateSettings(settingsData) {
    await this.waitForLoad();
    
    this.cache.settings = { ...this.cache.settings, ...settingsData };
    this.saveToLocalStorage();
    
    return {
      success: true,
      data: this.cache.settings
    };
  }

  // Helper methods
  async waitForLoad() {
    while (!this.isLoaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  findCommentByUuid(uuid) {
    for (const comment of this.cache.comments.comments) {
      if (comment.uuid === uuid) return comment;
      
      for (const reply of comment.comments || []) {
        if (reply.uuid === uuid) return reply;
      }
    }
    return null;
  }

  findCommentById(id) {
    for (const comment of this.cache.comments.comments) {
      if (comment.id === id) return comment;
      
      for (const reply of comment.comments || []) {
        if (reply.id === id) return reply;
      }
    }
    return null;
  }

  removeCommentByUuid(uuid) {
    // Check main comments
    for (let i = 0; i < this.cache.comments.comments.length; i++) {
      if (this.cache.comments.comments[i].uuid === uuid) {
        this.cache.comments.comments.splice(i, 1);
        return true;
      }
      
      // Check replies
      const replies = this.cache.comments.comments[i].comments || [];
      for (let j = 0; j < replies.length; j++) {
        if (replies[j].uuid === uuid) {
          replies.splice(j, 1);
          return true;
        }
      }
    }
    return false;
  }

  // Statistics
  incrementView() {
    if (this.isLoaded) {
      this.cache.settings.stats.totalViews++;
      this.saveToLocalStorage();
    }
  }

  getStats() {
    return this.cache.settings.stats;
  }
}

// Initialize global instance
window.jsonStorage = new JSONStorage();

console.log('📁 JSON Storage system loaded');
