Page({
  data: {
    brief: null,
    loading: true,
    activeHighlight: -1,
    expandAll: false,
    sections: [],
    takeaways: [],
  },

  onLoad(options) {
    if (options.highlight) {
      this.setData({ activeHighlight: parseInt(options.highlight) || -1 });
    }
    this.fetchBrief();
  },

  fetchBrief() {
    this.setData({ loading: true });
    wx.cloud.callFunction({ name: 'getMarketBrief' }).then((res) => {
      if (res.result && res.result.brief) {
        this.processBrief(res.result.brief);
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(() => {
      this.setData({ loading: false });
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  },

  processBrief(brief) {
    if (brief.forex && !Array.isArray(brief.forex)) {
      brief.forex = Object.values(brief.forex);
    }
    brief.forex.forEach(item => {
      item.isUp = item.change && item.change.indexOf('-') != 0;
    });
    brief.indices.forEach(item => {
      item.isUp = item.change && item.change.indexOf('-') != 0;
    });
    brief.highlights = brief.highlights.map((h, i) => {
      if (typeof h === 'string') return { title: h, summary: h, detail: h, index: i + 1 };
      h.index = i + 1;
      return h;
    });

    const sections = this.parseSections(brief.fullAnalysis || '');

    const takeaways = brief.takeaways || [];

    if (brief.date && !brief.date.endsWith('日')) {
      brief.date += '日';
    }
    if (brief.updateTime) {
      const d = new Date(brief.updateTime);
      brief.updateTime = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
        d.getHours().toString().padStart(2, '0') + ':' +
        d.getMinutes().toString().padStart(2, '0');
    }

    this.setData({
      brief,
      sections,
      takeaways,
      loading: false,
    });
  },

  parseSections(text) {
    if (!text) return [];
    const parts = text.split(/【(.+?)】/);
    const result = [];
    let intro = parts[0].trim();
    if (intro) {
      result.push({ header: '', body: intro });
    }
    for (let i = 1; i < parts.length; i += 2) {
      const header = parts[i];
      const body = (parts[i + 1] || '').trim();
      if (body) {
        result.push({ header, body });
      }
    }
    return result;
  },

  onHighlightTap(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    this.setData({
      activeHighlight: this.data.activeHighlight == idx ? -1 : idx
    });
  },

  onToggleAll() {
    this.setData({ expandAll: !this.data.expandAll });
  },

  onTopicTap(e) {
    const topic = e.currentTarget.dataset.topic;
    const app = getApp();
    app.globalData.searchTopic = topic;
    wx.switchTab({ url: '/pages/invest/invest' });
  },

  onShareAppMessage() {
    return { title: 'QPP - 每日市场观察', path: '/pages/index/index' };
  },
});
