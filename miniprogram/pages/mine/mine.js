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

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadProfile();
  },

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

  onRefreshLogin() {
    wx.showLoading({ title: '登录中' });
    wx.cloud.callFunction({ name: 'login' }).then((res) => {
      wx.hideLoading();
      if (res && res.result && res.result.user) {
        this.setData({ userInfo: res.result.user });
        wx.showToast({ title: '登录成功', icon: 'success' });
      } else {
        wx.showToast({ title: '请检查云函数是否已部署', icon: 'none', duration: 3000 });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请部署云函数', icon: 'none', duration: 3000 });
    });
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
