Page({
  data: {
    mode: 'login',
    phone: '',
    password: '',
    confirmPassword: '',
    canSubmit: false,
  },

  onLoad: function () {
    var phone = wx.getStorageSync('accountPhone');
    if (phone) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  onSwitchMode: function (e) {
    var mode = e.currentTarget.dataset.mode;
    this.setData({
      mode: mode,
      password: '',
      confirmPassword: '',
    });
    this.checkCanSubmit();
  },

  onPhoneInput: function (e) {
    var val = (e.detail.value || '').slice(0, 11);
    this.setData({ phone: val });
    this.checkCanSubmit();
  },

  onPasswordInput: function (e) {
    this.setData({ password: e.detail.value || '' });
    this.checkCanSubmit();
  },

  onConfirmInput: function (e) {
    this.setData({ confirmPassword: e.detail.value || '' });
    this.checkCanSubmit();
  },

  checkCanSubmit: function () {
    var phone = this.data.phone;
    var pw = this.data.password;
    var mode = this.data.mode;
    var can = false;

    if (phone.length === 11 && /^1\d{10}$/.test(phone) && pw.length >= 6) {
      if (mode === 'register') {
        can = pw === this.data.confirmPassword;
      } else {
        can = true;
      }
    }
    this.setData({ canSubmit: can });
  },

  onGetPhoneNumber: function (e) {
    var self = this;
    if (!e.detail.code) {
      wx.showModal({ title: '获取失败', content: '未能获取手机号授权', showCancel: false });
      return;
    }
    wx.showLoading({ title: '登录中' });
    wx.cloud.callFunction({
      name: 'login',
      data: { phoneCode: e.detail.code },
    }).then(function (res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.phone) {
        self.onLoginSuccess(result);
      } else {
        wx.showModal({
          title: '登录失败',
          content: result.error || '请稍后重试',
          showCancel: false,
        });
      }
    }).catch(function (err) {
      wx.hideLoading();
      wx.showModal({
        title: '网络错误',
        content: err.errMsg || '请检查网络连接后重试',
        showCancel: false,
      });
    });
  },

  onSubmit: function () {
    var self = this;
    var phone = this.data.phone;
    var password = this.data.password;
    var mode = this.data.mode;

    if (!this.data.canSubmit) return;

    wx.showLoading({ title: mode === 'register' ? '注册中' : '登录中' });

    var data = {
      phoneNumber: phone,
      password: password,
    };
    if (mode === 'register') {
      data.action = 'register';
    }

    wx.cloud.callFunction({
      name: 'login',
      data: data,
    }).then(function (res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.phone) {
        self.onLoginSuccess(result);
      } else {
        wx.showModal({
          title: '操作失败',
          content: result.error || '请稍后重试',
          showCancel: false,
        });
      }
    }).catch(function (err) {
      wx.hideLoading();
      wx.showModal({
        title: '网络错误',
        content: err.errMsg || '请检查网络连接后重试',
        showCancel: false,
      });
    });
  },

  onSkip: function () {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShowUserAgreement: function () {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用 QPP 财经知识助手。\n\n'
        + '1. 本小程序提供金融知识学习、风险评估、理财计算器等教育工具，所有内容仅供学习参考。\n\n'
        + '2. 用户应保证所提供信息的真实性，不得冒用他人手机号进行注册。\n\n'
        + '3. 用户不得利用本程序从事违法违规活动，不得干扰程序正常运行。\n\n'
        + '4. 本程序提供的市场简报及分析内容仅供参考，不构成任何投资建议。投资有风险，决策需谨慎。\n\n'
        + '5. 我们保留根据法律法规和运营需要修改本协议的权利。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  onShowPrivacyPolicy: function () {
    wx.showModal({
      title: '隐私政策',
      content: 'QPP 重视您的隐私保护。\n\n'
        + '【收集的信息】\n'
        + '- 手机号码：用于账号注册与登录，区分不同用户的数据\n'
        + '- 微信头像/昵称：用于个人主页展示（您可选择不提供）\n'
        + '- 风险测评答案：用于生成投资者类型和资产配置分析参考\n\n'
        + '【信息的使用】\n'
        + '- 手机号仅用于账号标识，不会用于营销或出售给第三方\n'
        + '- 测评数据仅用于生成个人测评分析结果\n'
        + '- 市场简报为匿名生成，不关联个人身份\n\n'
        + '【信息的存储】\n'
        + '- 数据存储在微信云开发平台，采用微信提供的安全机制\n'
        + '- 您的密码采用加密存储（SHA256），不会以明文保存\n\n'
        + '【您的权利】\n'
        + '- 您可随时退出登录，数据不会被删除\n'
        + '- 如需彻底删除账号数据，请联系我们\n\n'
        + '【免责声明】\n'
        + '- 本程序为金融教育工具，所有内容不构成投资建议\n'
        + '- 市场有风险，投资需谨慎',
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  onLoginSuccess: function (result) {
    wx.setStorageSync('accountPhone', result.phone);
    var app = getApp();
    app.globalData.accountPhone = result.phone;
    app.globalData.userInfo = result.user || null;
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
