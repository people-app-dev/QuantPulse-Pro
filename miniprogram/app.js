// miniprogram/app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'YOUR_ENV_ID',
        traceUser: true,
      });
    }

    wx.cloud.callFunction({ name: 'login' }).then((res) => {
      this.globalData.openid = res.result.openid;
      this.globalData.userInfo = res.result.user;
    }).catch(console.error);
  },

  globalData: {
    userInfo: null,
    openid: null,
  },
});
