const { getPostsCollection } = require('../../utils/api');
const { icons, toDataUri } = require('../../utils/icons');

Page({
  data: {
    marketIndex: { name: '上证指数', value: '3,258.63', change: '+0.82%' },
    iconQuiz: '',
    iconAlloc: '',
    posts: [],
    allocation: null,
  },

  onLoad() {
    this.setData({
      iconQuiz: toDataUri(icons.quiz(false)),
      iconAlloc: toDataUri(icons.allocation(false)),
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
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
