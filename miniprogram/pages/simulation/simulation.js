Page({
  data: {
    cash: 100000,
    holdings: [],
    totalMarketValue: '0.00',
    totalAssets: '100000.00',
    totalProfit: '0.00',
    totalProfitPercent: '0.00',
    isProfit: true,

    searching: false,
    searchKeyword: '',
    searchResults: [],

    ordering: false,
    orderStock: null,
    orderType: '',
    orderPrice: 0,
    orderShares: 0,
    orderTotal: '0.00',
    maxShares: 0,
  },

  onShow() { this.loadData(); },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  loadData() {
    return wx.cloud.callFunction({ name: 'getSimulation' }).then((res) => {
      if (!res.result.success || !res.result.data) {
        this.setData({
          cash: 100000, holdings: [], totalAssets: '100000.00',
          totalMarketValue: '0.00', totalProfit: '0.00',
          totalProfitPercent: '0.00', isProfit: true,
        });
        return;
      }
      const sim = res.result.data;
      const totalCost = sim.holdings.reduce((sum, h) => sum + h.costPrice * h.shares, 0);
      this.setData({
        cash: sim.cash,
        holdings: sim.holdings || [],
        totalMarketValue: totalCost.toFixed(2),
        totalAssets: (sim.cash + totalCost).toFixed(2),
      });
      if (sim.holdings && sim.holdings.length) {
        this.refreshPrices(sim.holdings.map(h => h.code));
      }
    }).catch(console.error);
  },

  refreshPrices(codes) {
    wx.cloud.callFunction({ name: 'getStockPrice', data: { codes } }).then((res) => {
      if (!res.result.success) return;
      const prices = res.result.data;
      const priceMap = {};
      prices.forEach(p => priceMap[p.code] = p.price);

      let totalMarketValue = 0;
      let totalCost = 0;
      const holdings = this.data.holdings.map(h => {
        const currentPrice = priceMap[h.code] || h.costPrice;
        const marketValue = currentPrice * h.shares;
        const cost = h.costPrice * h.shares;
        totalMarketValue += marketValue;
        totalCost += cost;
        return {
          ...h,
          currentPrice: currentPrice,
          marketValue: marketValue.toFixed(2),
          isHoldingProfit: marketValue > cost,
        };
      });

      const totalProfit = totalMarketValue - totalCost;
      const totalProfitPercent = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0.00';

      this.setData({
        holdings,
        totalMarketValue: totalMarketValue.toFixed(2),
        totalAssets: (this.data.cash + totalMarketValue).toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        totalProfitPercent,
        isProfit: totalProfit >= 0,
      });
    }).catch(() => {});
  },

  onStartBuy() {
    this.setData({ searching: true, ordering: false, searchKeyword: '', searchResults: [] });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    const kw = this.data.searchKeyword.trim();
    if (!kw) return;
    wx.cloud.callFunction({ name: 'searchStock', data: { keyword: kw } }).then((res) => {
      if (res.result.success) {
        this.setData({ searchResults: res.result.data || [] });
      }
    }).catch(console.error);
  },

  onPickStock(e) {
    const idx = e.currentTarget.dataset.index;
    const stock = this.data.searchResults[idx];
    this.setData({
      searching: false,
      ordering: true,
      orderStock: stock,
      orderType: 'buy',
      orderPrice: 0,
      orderShares: 0,
      orderTotal: '0.00',
    });
    wx.cloud.callFunction({ name: 'getStockPrice', data: { codes: [stock.fullCode] } }).then((res) => {
      if (res.result.success && res.result.data.length) {
        const price = res.result.data[0].price;
        this.setData({ orderPrice: price });
        this.computeOrderTotal(0, price);
      }
    });
  },

  onSellStock(e) {
    const idx = e.currentTarget.dataset.index;
    const h = this.data.holdings[idx];
    const price = h.currentPrice || h.costPrice;
    this.setData({
      ordering: true,
      searching: false,
      orderStock: { fullCode: h.code, name: h.name },
      orderType: 'sell',
      orderPrice: price,
      orderShares: 0,
      orderTotal: '0.00',
      maxShares: h.shares,
    });
  },

  computeOrderTotal(shares, price) {
    const p = price || this.data.orderPrice;
    const s = shares || 0;
    const total = p * s;
    this.setData({ orderTotal: total > 0 ? total.toFixed(2) : '0.00' });
  },

  onOrderSharesInput(e) {
    const v = parseInt(e.detail.value) || 0;
    const shares = Math.max(0, v);
    this.setData({ orderShares: shares });
    this.computeOrderTotal(shares);
  },

  onSubmitOrder() {
    const { orderType, orderStock, orderPrice, orderShares } = this.data;
    if (orderShares <= 0) {
      wx.showToast({ title: '请输入有效数量', icon: 'none' }); return;
    }
    if (orderPrice <= 0) {
      wx.showToast({ title: '获取价格失败，请重试', icon: 'none' }); return;
    }

    wx.showLoading({ title: '交易中' });
    wx.cloud.callFunction({
      name: 'tradeStock',
      data: {
        type: orderType,
        code: orderStock.fullCode,
        name: orderStock.name,
        price: orderPrice,
        shares: orderShares,
      },
    }).then((res) => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({ title: orderType === 'buy' ? '买入成功' : '卖出成功', icon: 'success' });
        this.setData({ ordering: false, searching: false });
        this.loadData();
      } else {
        wx.showToast({ title: res.result.error || '交易失败', icon: 'none' });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('tradeStock error:', err);
      wx.showToast({ title: '交易失败', icon: 'none' });
    });
  },

  onCancel() {
    this.setData({ searching: false, ordering: false });
  },

  onShareAppMessage() {
    return { title: 'QPP - 投资模拟盘', path: '/pages/invest/invest' };
  },
});
