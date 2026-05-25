Page({
  data: {
    hasAssessment: false,
    investorType: '',
    riskScore: 0,
    hasSimulation: false,
    simData: null,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.loadData();
  },

  loadData() {
    wx.cloud.callFunction({ name: 'getUserProfile' }).then((res) => {
      const user = res.result.user || {};
      const hasAssessment = !!user.investorType;
      this.setData({
        hasAssessment,
        investorType: user.investorType || '',
        riskScore: user.riskScore || 0,
      });
      if (hasAssessment) this.loadSimulation();
    }).catch(console.error);
  },

  loadSimulation() {
    wx.cloud.callFunction({ name: 'getSimulation' }).then((res) => {
      if (res.result.success && res.result.data) {
        const sim = res.result.data;
        let totalMarketValue = sim.holdings.reduce((sum, h) => sum + h.costPrice * h.shares, 0);
        this.setData({
          hasSimulation: true,
          simData: {
            cash: sim.cash,
            totalAssets: (sim.cash + totalMarketValue).toFixed(2),
            holdingCount: sim.holdings.length,
          }
        });
      }
    }).catch(() => {});
  },

  onGoQuiz() {
    wx.navigateTo({ url: '/pages/quiz/quiz' });
  },

  onGoSimulation() {
    wx.cloud.callFunction({ name: 'initSimulation' }).then((res) => {
      if (res.result && res.result.success) {
        wx.navigateTo({ url: '/pages/simulation/simulation' });
      } else {
        wx.showToast({ title: '开通失败', icon: 'none' });
      }
    }).catch((err) => {
      console.error('initSimulation error:', err);
      wx.showToast({ title: '开通失败', icon: 'none' });
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
