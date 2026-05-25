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

    // Enable share menu
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });

    this.doLogin();
  },

  doLogin() {
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          console.error('wx.login 失败: 未获取到 code');
          return;
        }
        wx.cloud.callFunction({
          name: 'login',
          data: { code: loginRes.code },
        }).then((res) => {
          if (res && res.result) {
            // Only store user info, never expose openid to UI
            this.globalData.userInfo = res.result.user || null;
            this.globalData.openid = res.result.openid || null;
          }
        }).catch((err) => {
          console.error('登录失败:', err);
          wx.showModal({
            title: '登录失败',
            content: '错误: ' + (err.errMsg || err.message || JSON.stringify(err)),
            showCancel: false,
          });
        });
      },
      fail: (err) => {
        console.error('wx.login 调用失败:', err);
      },
    });
  },

  globalData: {
    userInfo: null,
    openid: null,
  },
});
