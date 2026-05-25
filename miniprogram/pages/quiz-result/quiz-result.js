Page({
  data: {
    investorType: '',
    riskScore: 0,
    allocation: [],
  },

  onLoad(options) {
    if (options.type && options.score) {
      const allocation = JSON.parse(decodeURIComponent(options.allocation || '[]'));
      this.setData({
        investorType: options.type,
        riskScore: parseInt(options.score) || 0,
        allocation,
      });
    }
  },

  onStartSimulation() {
    wx.showLoading({ title: '开通中' });
    wx.cloud.callFunction({ name: 'initSimulation' }).then((res) => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.switchTab({ url: '/pages/invest/invest' });
      } else {
        wx.showToast({ title: '开通失败', icon: 'none' });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('initSimulation error:', err);
      wx.showToast({ title: '开通失败', icon: 'none' });
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
