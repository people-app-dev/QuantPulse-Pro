Page({
  data: {
    brief: null,
    loading: true,
    error: '',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.fetchBrief();
  },

  onPullDownRefresh() {
    this.fetchBrief(true);
  },

  fetchBrief(forceRefresh) {
    this.setData({ loading: true, error: '' });
    wx.cloud.callFunction({
      name: 'getMarketBrief',
      data: { force: forceRefresh || false },
    }).then((res) => {
      if (res.result && res.result.brief) {
        const brief = res.result.brief;
        // Format forex object into array for iteration
        if (brief.forex && !Array.isArray(brief.forex)) {
          brief.forex = Object.values(brief.forex);
        }
        brief.forex.forEach(item => {
          item.isUp = item.change && item.change.indexOf('-') != 0;
        });
        brief.indices.forEach(item => {
          item.isUp = item.change && item.change.indexOf('-') != 0;
        });
        brief.highlights = brief.highlights.map(h => {
          if (typeof h === 'string') return { title: h, summary: h, detail: h };
          return h;
        });
        // Ensure date ends with 日 (safety net for old cached data)
        if (brief.date && !brief.date.endsWith('日')) {
          brief.date += '日';
        }
        // Format updateTime
        if (brief.updateTime) {
          const d = new Date(brief.updateTime);
          brief.updateTime = d.getHours().toString().padStart(2, '0') + ':' +
            d.getMinutes().toString().padStart(2, '0');
        }
        this.setData({ brief, loading: false });
      } else {
        this.setData({
          loading: false,
          error: (res.result && res.result.error) || '获取简报失败',
        });
      }
      wx.stopPullDownRefresh();
    }).catch((err) => {
      console.error('获取简报失败:', err);
      this.setData({
        loading: false,
        error: '网络错误，请下拉刷新重试',
      });
      wx.stopPullDownRefresh();
    });
  },

  onRefresh() {
    this.fetchBrief(true);
  },

  onBriefTap() {
    wx.navigateTo({ url: '/pages/brief-detail/brief-detail' });
  },

  onHighlightTap(e) {
    const idx = e.currentTarget.dataset.index;
    wx.navigateTo({ url: '/pages/brief-detail/brief-detail?highlight=' + idx });
  },

  onShareAppMessage() {
    return { title: 'QPP - 全球市场简报', path: '/pages/index/index' };
  },

  onShareTimeline() {
    return { title: 'QPP - 全球市场简报' };
  },
});
