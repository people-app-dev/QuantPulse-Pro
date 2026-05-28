var quizData = require('../../utils/quiz-data');

function getPhone() {
  return wx.getStorageSync('accountPhone') || '';
}

function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

Page({
  data: {
    userInfo: {},
    accountPhone: '',
    phoneDisplay: '',
    assessmentCount: 0,
    investorType: '',
    riskScore: 0,
    allocation: [],
    expectedVolatility: '',
    typeDetail: null,
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    var phone = getPhone();
    this.setData({ accountPhone: phone, phoneDisplay: maskPhone(phone) });
    this.loadProfile();
    this.loadAssessmentCount();
  },

  loadProfile: function () {
    var self = this;
    var phone = getPhone();
    wx.cloud.callFunction({
      name: 'getUserProfile',
      data: { phone: phone },
    }).then(function (res) {
      var user = res.result.user || {};
      var invType = user.investorType || '';
      var score = user.riskScore || 0;
      var alloc = quizData.TYPE_ALLOCATIONS[invType] || [];
      self.setData({
        userInfo: user,
        investorType: invType,
        riskScore: score,
        allocation: alloc,
        typeDetail: quizData.typeAdvice[invType] || null,
      });
    }).catch(function () {});
  },

  loadAssessmentCount: function () {
    var self = this;
    var phone = getPhone();
    wx.cloud.callFunction({
      name: 'getAssessments',
      data: { phone: phone },
    }).then(function (res) {
      if (res.result && res.result.assessments) {
        self.setData({ assessmentCount: res.result.assessments.length });
      }
    }).catch(function () {});
  },

  onChooseAvatar: function (e) {
    var self = this;
    var avatarUrl = e.detail.avatarUrl;
    wx.showLoading({ title: '上传中' });
    wx.cloud.uploadFile({
      cloudPath: 'avatars/' + Date.now() + '.png',
      filePath: avatarUrl,
    }).then(function (uploadRes) {
      wx.hideLoading();
      return wx.cloud.callFunction({
        name: 'getUserProfile',
        data: { avatar: uploadRes.fileID, phone: getPhone() },
      });
    }).then(function () {
      self.setData({ 'userInfo.avatar': avatarUrl });
    }).catch(function (err) {
      wx.hideLoading();
      console.error('头像上传失败:', err);
      wx.showToast({ title: '头像上传失败', icon: 'none' });
    });
  },

  onNicknameBlur: function (e) {
    var self = this;
    var nickname = e.detail.value;
    if (!nickname || nickname === self.data.userInfo.nickname) return;
    wx.cloud.callFunction({
      name: 'getUserProfile',
      data: { nickname: nickname, phone: getPhone() },
    }).then(function () {
      self.setData({ 'userInfo.nickname': nickname });
    }).catch(function (err) { console.error(err); });
  },

  onMenuTap: function (e) {
    var key = e.currentTarget.dataset.key;
    if (key === 'quiz') {
      wx.navigateTo({ url: '/pages/quiz/quiz' });
    } else if (key === 'result') {
      var alloc = quizData.TYPE_ALLOCATIONS[this.data.investorType] || [];
      getApp().globalData.quizResult = {
        type: this.data.investorType,
        score: this.data.riskScore,
        allocation: alloc,
      };
      wx.navigateTo({ url: '/pages/quiz-result/quiz-result?type=1' });
    } else if (key === 'logout') {
      this.onLogout();
    }
  },

  onRefreshLogin: function () {
    var self = this;
    wx.showLoading({ title: '登录中' });
    wx.login({
      success: function (loginRes) {
        if (!loginRes.code) {
          wx.hideLoading();
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
          return;
        }
        wx.cloud.callFunction({
          name: 'login',
          data: { code: loginRes.code },
        }).then(function (res) {
          wx.hideLoading();
          if (res && res.result && res.result.user) {
            self.setData({ userInfo: res.result.user });
            self.loadAssessmentCount();
            wx.showToast({ title: '登录成功', icon: 'success' });
          } else {
            wx.showModal({
              title: '登录未完成',
              content: '请确保 login 云函数已部署',
              showCancel: false,
            });
          }
        }).catch(function (err) {
          wx.hideLoading();
          console.error('登录失败:', err);
          wx.showModal({
            title: '登录失败',
            content: '错误: ' + (err.errMsg || err.message || JSON.stringify(err)),
            showCancel: false,
          });
        });
      },
      fail: function (err) {
        wx.hideLoading();
        console.error('wx.login 失败:', err);
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      },
    });
  },

  onGoLogin: function () {
    wx.reLaunch({ url: '/pages/login/login' });
  },

  onLogout: function () {
    var self = this;
    wx.showModal({
      title: '退出登录',
      content: '退出后不会删除数据，您可以使用相同手机号重新登录。',
      confirmText: '退出',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync('accountPhone');
          var app = getApp();
          app.globalData.accountPhone = '';
          app.globalData.userInfo = null;
          self.setData({ userInfo: {}, investorType: '', riskScore: 0, allocation: [], typeDetail: null });
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },

  onShareAppMessage: function () {
    return { title: 'QPP - 财经知识助手', path: '/pages/index/index' };
  },
});
