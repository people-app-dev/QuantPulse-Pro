Page({
  data: {
    userInfo: {},
    menuItems: [],
    simOverview: null,
  },

  onLoad() {
    this.setData({
      menuItems: [
        { key: 'simulation', label: '我的模拟盘' },
        { key: 'calculator', label: '理财计算器' },
      ],
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadProfile();
    this.loadSimOverview();
  },

  loadProfile() {
    wx.cloud.callFunction({ name: 'getUserProfile' }).then((res) => {
      this.setData({ userInfo: res.result.user || {} });
    }).catch(console.error);
  },

  loadSimOverview() {
    wx.cloud.callFunction({ name: 'getSimulation' }).then((res) => {
      if (res.result.success && res.result.data) {
        const sim = res.result.data;
        if (sim.holdings && sim.holdings.length) {
          const codes = sim.holdings.map(h => h.code);
          wx.cloud.callFunction({ name: 'getStockPrice', data: { codes } }).then((priceRes) => {
            if (priceRes.result.success) {
              const priceMap = {};
              priceRes.result.data.forEach(p => priceMap[p.code] = p.price);
              let marketValue = 0, totalCost = 0;
              sim.holdings.forEach(h => {
                const p = priceMap[h.code] || h.costPrice;
                marketValue += p * h.shares;
                totalCost += h.costPrice * h.shares;
              });
              this.setData({
                simOverview: {
                  totalAssets: (sim.cash + marketValue).toFixed(2),
                  totalProfit: (marketValue - totalCost).toFixed(2),
                  totalProfitPercent: totalCost > 0 ? ((marketValue - totalCost) / totalCost * 100).toFixed(2) : '0.00',
                }
              });
            }
          }).catch(() => {});
        } else {
          this.setData({
            simOverview: {
              totalAssets: sim.cash.toFixed(2),
              totalProfit: '0.00',
              totalProfitPercent: '0.00',
            }
          });
        }
      }
    }).catch(() => {});
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    wx.showLoading({ title: '上传中' });
    wx.cloud.uploadFile({
      cloudPath: 'avatars/' + Date.now() + '.png',
      filePath: avatarUrl,
    }).then((uploadRes) => {
      wx.hideLoading();
      return wx.cloud.callFunction({
        name: 'getUserProfile',
        data: { avatar: uploadRes.fileID },
      });
    }).then(() => {
      this.setData({ 'userInfo.avatar': avatarUrl });
    }).catch((err) => {
      wx.hideLoading();
      console.error('头像上传失败:', err);
      wx.showToast({ title: '头像上传失败', icon: 'none' });
    });
  },

  onNicknameBlur(e) {
    const nickname = e.detail.value;
    if (!nickname || nickname === this.data.userInfo.nickname) return;
    wx.cloud.callFunction({
      name: 'getUserProfile',
      data: { nickname },
    }).then(() => {
      this.setData({ 'userInfo.nickname': nickname });
    }).catch(console.error);
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'simulation') {
      wx.navigateTo({ url: '/pages/simulation/simulation' });
    } else if (key === 'calculator') {
      wx.navigateTo({ url: '/pages/calculator/calculator' });
    }
  },

  onRefreshLogin() {
    wx.showLoading({ title: '登录中' });
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading();
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
          return;
        }
        wx.cloud.callFunction({
          name: 'login',
          data: { code: loginRes.code },
        }).then((res) => {
          wx.hideLoading();
          if (res && res.result && res.result.user) {
            this.setData({ userInfo: res.result.user });
            wx.showToast({ title: '登录成功', icon: 'success' });
          } else {
            wx.showModal({
              title: '登录未完成',
              content: '请确保 login 云函数已部署',
              showCancel: false,
            });
          }
        }).catch((err) => {
          wx.hideLoading();
          console.error('登录失败:', err);
          wx.showModal({
            title: '登录失败',
            content: '错误: ' + (err.errMsg || err.message || JSON.stringify(err)),
            showCancel: false,
          });
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('wx.login 失败:', err);
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      },
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
