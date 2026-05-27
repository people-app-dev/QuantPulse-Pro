Page({
  data: {
    searchKeyword: '',
    activeCategory: '',
    searchResults: [],
    isSearching: false,
    popularConcepts: [],
    conceptLoading: false,

    calcTool: 'compound',
    principal: '', annualRate: '', years: '', compoundResult: null,
    dcaAmount: '', dcaRate: '', dcaYears: '', dcaResult: null,
    loanAmount: '', loanRate: '', loanMonths: '', loanResult: null,
    retireCurrent: '', retireMonthly: '', retireRate: '', retireYears: '', retireResult: null,
    inflateAmount: '', inflateRate: '', inflateYears: '', inflateResult: null,
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }

    var app = getApp();
    if (app.globalData.searchTopic) {
      var topic = app.globalData.searchTopic;
      app.globalData.searchTopic = '';
      this.setData({ searchKeyword: topic, isSearching: true });
      this.performSearch(topic);
    }

    this.loadPopularConcepts();
  },

  loadPopularConcepts: function () {
    var self = this;
    var cat = self.data.activeCategory || undefined;
    self.setData({ conceptLoading: true });
    wx.cloud.callFunction({
      name: 'searchFinanceConcept',
      data: { keyword: '', category: cat },
    }).then(function (res) {
      if (res.result.success) {
        self.setData({ popularConcepts: res.result.data, conceptLoading: false });
      } else {
        self.setData({ conceptLoading: false });
      }
    }).catch(function () {
      self.setData({ conceptLoading: false });
    });
  },

  onSearchInput: function (e) {
    var kw = e.detail.value;
    this.setData({ searchKeyword: kw, isSearching: kw.trim().length > 0 });
    if (kw.trim()) {
      this.performSearch(kw.trim());
    } else {
      this.setData({ searchResults: [] });
    }
  },

  onClearSearch: function () {
    this.setData({ searchKeyword: '', isSearching: false, searchResults: [] });
  },

  performSearch: function (keyword) {
    var self = this;
    self.setData({ conceptLoading: true });
    var cat = self.data.activeCategory || undefined;
    wx.cloud.callFunction({
      name: 'searchFinanceConcept',
      data: { keyword: keyword, category: cat },
    }).then(function (res) {
      if (res.result.success) {
        self.setData({ searchResults: res.result.data, conceptLoading: false });
      } else {
        self.setData({ conceptLoading: false });
      }
    }).catch(function () {
      self.setData({ conceptLoading: false });
    });
  },

  onCategoryTap: function (e) {
    var cat = e.currentTarget.dataset.category;
    if (!cat || cat === '全部') cat = '';
    var newCat = cat === this.data.activeCategory ? '' : cat;
    this.setData({ activeCategory: newCat, popularConcepts: [], searchResults: [] });
    this.loadPopularConcepts();
    if (this.data.searchKeyword.trim()) {
      this.performSearch(this.data.searchKeyword.trim());
    }
  },

  onConceptTap: function (e) {
    var idx = e.currentTarget.dataset.index;
    var list = this.data.isSearching ? this.data.searchResults : this.data.popularConcepts;
    var item = list[idx];
    if (item) {
      getApp().globalData.selectedConcept = item;
    }
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/concept-detail/concept-detail?id=' + id });
  },

  /* ---- Calculator ---- */
  onCalcToolChange: function (e) {
    this.setData({ calcTool: e.currentTarget.dataset.tool });
  },

  onFieldInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var obj = {};
    obj[field] = e.detail.value;
    this.setData(obj);
  },

  onCalcCompound: function () {
    var P = parseFloat(this.data.principal);
    var r = parseFloat(this.data.annualRate) / 100;
    var n = parseInt(this.data.years);
    if (!P || !r || !n) { wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return; }
    var FV = (P * Math.pow(1 + r, n)).toFixed(2);
    var profit = (FV - P).toFixed(2);
    this.setData({ compoundResult: { finalAmount: FV, profit: profit } });
  },

  onCalcDCA: function () {
    var A = parseFloat(this.data.dcaAmount) * 12;
    var r = parseFloat(this.data.dcaRate) / 100;
    var n = parseInt(this.data.dcaYears);
    if (!A || !r || !n) { wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return; }
    var FV = (A * (Math.pow(1 + r, n) - 1) / r).toFixed(2);
    var invested = (A * n).toFixed(2);
    var profit = (FV - invested).toFixed(2);
    this.setData({ dcaResult: { finalAmount: FV, totalInvested: invested, profit: profit } });
  },

  onCalcLoan: function () {
    var P = parseFloat(this.data.loanAmount);
    var r = parseFloat(this.data.loanRate) / 100 / 12;
    var n = parseInt(this.data.loanMonths);
    if (!P || !r || !n) { wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return; }
    var monthly = (P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)).toFixed(2);
    var total = (monthly * n).toFixed(2);
    var interest = (total - P).toFixed(2);
    this.setData({ loanResult: { monthly: monthly, totalPayment: total, interest: interest } });
  },

  onCalcRetirement: function () {
    var current = parseFloat(this.data.retireCurrent) || 0;
    var monthly = parseFloat(this.data.retireMonthly) || 0;
    var rate = parseFloat(this.data.retireRate) / 100;
    var years = parseInt(this.data.retireYears);
    if (!current && !monthly || !rate || !years) { wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return; }
    var fvCurrent = current * Math.pow(1 + rate, years);
    var monthlyRate = rate / 12;
    var months = years * 12;
    var fvAnnuity = monthly > 0 ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : 0;
    var total = (fvCurrent + fvAnnuity).toFixed(2);
    var contributed = (current + monthly * months).toFixed(2);
    var growth = (total - contributed).toFixed(2);
    this.setData({ retireResult: { total: total, contributed: contributed, growth: growth } });
  },

  onCalcInflation: function () {
    var amount = parseFloat(this.data.inflateAmount);
    var rate = parseFloat(this.data.inflateRate) / 100;
    var years = parseInt(this.data.inflateYears);
    if (!amount || !rate || !years) { wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return; }
    var futureValue = (amount * Math.pow(1 + rate, years)).toFixed(2);
    var lostValue = (futureValue - amount).toFixed(2);
    var purchasePower = (amount / Math.pow(1 + rate, years)).toFixed(2);
    this.setData({ inflateResult: { futureValue: futureValue, lostValue: lostValue, purchasePower: purchasePower } });
  },

  onShareAppMessage: function () {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
