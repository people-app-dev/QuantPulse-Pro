Page({
  data: {
    tab: 'compound',

    principal: '', annualRate: '', years: '',
    compoundResult: null,

    dcaAmount: '', dcaRate: '', dcaYears: '',
    dcaResult: null,

    loanAmount: '', loanRate: '', loanMonths: '',
    loanResult: null,
  },

  onTabChange(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onFieldInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  onCalcCompound() {
    const P = parseFloat(this.data.principal);
    const r = parseFloat(this.data.annualRate) / 100;
    const n = parseInt(this.data.years);
    if (!P || !r || !n || P <= 0 || r <= 0 || n <= 0) {
      wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return;
    }
    const FV = P * Math.pow(1 + r, n);
    this.setData({
      compoundResult: { finalAmount: FV.toFixed(2), profit: (FV - P).toFixed(2) }
    });
  },

  onCalcDCA() {
    const A = parseFloat(this.data.dcaAmount) * 12;
    const r = parseFloat(this.data.dcaRate) / 100;
    const n = parseInt(this.data.dcaYears);
    if (!A || !r || !n || A <= 0 || r <= 0 || n <= 0) {
      wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return;
    }
    const FV = A * (Math.pow(1 + r, n) - 1) / r;
    const totalInvested = A * n;
    this.setData({
      dcaResult: { finalAmount: FV.toFixed(2), totalInvested: totalInvested.toFixed(2), profit: (FV - totalInvested).toFixed(2) }
    });
  },

  onCalcLoan() {
    const P = parseFloat(this.data.loanAmount);
    const r = parseFloat(this.data.loanRate) / 100 / 12;
    const n = parseInt(this.data.loanMonths);
    if (!P || !r || !n || P <= 0 || r <= 0 || n <= 0) {
      wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return;
    }
    const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const total = monthly * n;
    this.setData({
      loanResult: { monthly: monthly.toFixed(2), totalPayment: total.toFixed(2), interest: (total - P).toFixed(2) }
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 理财计算器', path: '/pages/calculator/calculator' };
  },
});
