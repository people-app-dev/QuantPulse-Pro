const { getPostsCollection } = require('../../utils/api');

Page({
  data: {
    marketIndex: { name: '上证指数', value: '3,258.63', change: '+0.82%' },
    entries: [
      { type: 'quiz', label: '风险评估', desc: '了解你的投资偏好' },
      { type: 'allocation', label: '资产配置', desc: '查看你的配置方案' },
    ],
    posts: [],
    allocation: null,
  },

  onShow() {
    this.fetchPosts();
    this.fetchAllocation();
  },

  fetchPosts() {
    getPostsCollection()
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get()
      .then((res) => {
        this.setData({ posts: res.data });
      })
      .catch((err) => {
        console.error('Failed to fetch posts:', err);
      });
  },

  fetchAllocation() {
    wx.cloud.callFunction({ name: 'getAssessments' }).then((res) => {
      if (res.result.assessments && res.result.assessments.length > 0) {
        const latest = res.result.assessments[0];
        this.setData({ allocation: latest.allocation || null });
      }
    }).catch((err) => {
      console.error('Failed to fetch allocation:', err);
    });
  },

  onEntryTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'quiz') wx.switchTab({ url: '/pages/quiz/quiz' });
  },

  onViewAll() {
    wx.switchTab({ url: '/pages/feed/feed' });
  },
});
