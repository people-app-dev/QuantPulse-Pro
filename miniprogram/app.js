// miniprogram/app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      wx.showModal({
        title: '云开发不可用',
        content: '请升级微信基础库到 2.2.3 以上，或检查微信版本',
        showCancel: false,
      });
      return;
    }

    wx.cloud.init({
      env: 'cloud1-d1g89sxp75c39545d',
      traceUser: true,
    });

    wx.cloud.callFunction({ name: 'login' }).then((res) => {
      if (res && res.result) {
        this.globalData.openid = res.result.openid || null;
        this.globalData.userInfo = res.result.user || null;
      }
    }).catch((err) => {
      console.error('登录失败，请检查云函数是否已部署:', err);
      wx.showToast({
        title: '登录失败，请部署云函数',
        icon: 'none',
        duration: 3000,
      });
    });
  },

  globalData: {
    userInfo: null,
    openid: null,
  },
});
