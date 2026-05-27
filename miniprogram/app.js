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

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });

    var phone = wx.getStorageSync('accountPhone');
    if (phone) {
      this.globalData.accountPhone = phone;
    }

    // Privacy authorization (WeChat base library >= 2.32.3)
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization(function (resolve) {
        wx.showModal({
          title: '隐私授权',
          content: '为了提供账号登录和个人数据管理服务，我们需要获取您的手机号码等信息。请阅读并同意《用户协议》和《隐私政策》。',
          confirmText: '同意',
          cancelText: '不同意',
          success: function (res) {
            if (res.confirm) {
              resolve({ event: 'agree', buttonId: 'agree' });
            } else {
              resolve({ event: 'disagree' });
            }
          },
        });
      });
    }
  },

  globalData: {
    userInfo: null,
    openid: null,
    accountPhone: '',
    searchTopic: '',
  },
});
