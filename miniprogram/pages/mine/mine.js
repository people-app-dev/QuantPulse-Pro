Page({
  data: {
    userInfo: {},
    assessmentCount: 0,
    menuItems: [
      { key: 'posts', label: '我的动态', icon: 'posts' },
      { key: 'history', label: '测评记录', icon: 'history' },
      { key: 'favorites', label: '我的收藏', icon: 'favorites' },
    ],
  },

  onShow() { this.loadProfile(); },

  loadProfile() {
    wx.cloud.callFunction({ name: 'getUserProfile' }).then((res) => {
      this.setData({ userInfo: res.result.user || {} });
    }).catch(console.error);

    wx.cloud.callFunction({ name: 'getAssessments' }).then((res) => {
      this.setData({ assessmentCount: res.result.total || 0 });
    }).catch(console.error);
  },

  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({ 'userInfo.nickname': e.detail.userInfo.nickName });
      wx.cloud.callFunction({
        name: 'getUserProfile',
        data: { nickname: e.detail.userInfo.nickName },
      });
    }
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'posts') {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    } else if (key === 'history') {
      wx.showToast({ title: '测评记录可在测评页查看', icon: 'none' });
    } else if (key === 'favorites') {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },
});
