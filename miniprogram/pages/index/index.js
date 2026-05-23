Page({
  data: {
    marketIndex: { name: '上证指数', value: '3,258.63', change: '+0.82%' },
    entries: [
      { type: 'quiz', label: '风险评估', desc: '了解你的投资偏好', icon: 'quiz' },
      { type: 'allocation', label: '资产配置', desc: '查看你的配置方案', icon: 'allocation' },
    ],
    posts: [],
  },
  onShow() { this.fetchPosts(); },
  fetchPosts() { this.setData({ posts: [] }); },
  onEntryTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'quiz') wx.switchTab({ url: '/pages/quiz/quiz' });
  },
  onViewAll() { wx.switchTab({ url: '/pages/feed/feed' }); },
});
