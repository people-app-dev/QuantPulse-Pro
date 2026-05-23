const { getTabIconUris } = require('../utils/icons');

Component({
  data: {
    selected: 0,
    iconUris: {},
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'home' },
      { pagePath: '/pages/quiz/quiz', text: '测评', icon: 'quiz' },
      { pagePath: '/pages/feed/feed', text: '社区', icon: 'feed' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: 'mine' },
    ],
  },

  attached() {
    this.setData({ iconUris: getTabIconUris() });
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      wx.switchTab({ url: item.pagePath });
    },
  },
});
