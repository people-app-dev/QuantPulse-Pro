const { getPostsCollection } = require('../../utils/api');

Page({
  data: {
    tags: ['理财故事', '每日打卡', '新手问答', '晒收益', '读书笔记'],
    activeTag: '',
    posts: [],
    loading: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.fetchPosts();
  },

  fetchPosts() {
    this.setData({ loading: true });
    let query = getPostsCollection().orderBy('createdAt', 'desc').limit(20);
    if (this.data.activeTag) {
      query = query.where({ tags: this.data.activeTag });
    }
    query.get().then((res) => {
      this.setData({ posts: res.data, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ activeTag: this.data.activeTag === tag ? '' : tag });
    this.fetchPosts();
  },

  onCreatePost() {
    wx.navigateTo({ url: '/pages/post-create/post-create' });
  },

  onPostLike(e) {
    const { postId } = e.detail;
    wx.cloud.callFunction({ name: 'toggleLike', data: { postId } }).then((res) => {
      const posts = this.data.posts.map((p) => {
        if (p._id === postId) {
          p.likes += res.result.liked ? 1 : -1;
        }
        return p;
      });
      this.setData({ posts });
    }).catch(console.error);
  },
});
