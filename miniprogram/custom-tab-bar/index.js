const { getTabIconUris } = require('../utils/icons');

Component({
  data: {
    selected: 0,
    iconUris: {},
    list: [
      { pagePath: '/pages/index/index', text: '市场', icon: 'home' },
      { pagePath: '/pages/invest/invest', text: '投资', icon: 'invest' },
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
