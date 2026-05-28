Page({
  data: {
    investorType: '',
    riskScore: 0,
    allocation: [],
    typeDetail: null,
  },

  onLoad: function (options) {
    var quizData = require('../../utils/quiz-data');
    var typeAdvice = quizData.typeAdvice;
    var TYPE_ALLOCATIONS = quizData.TYPE_ALLOCATIONS;

    var app = getApp();
    var result = app.globalData.quizResult || {};
    var type = result.type || options.type || '';
    var score = result.score || parseInt(options.score) || 0;
    var allocation = result.allocation;

    if (!allocation || !allocation.length) {
      allocation = TYPE_ALLOCATIONS[type] || [];
    }

    app.globalData.quizResult = null;

    this.setData({
      investorType: type,
      riskScore: score,
      allocation: allocation,
      typeDetail: typeAdvice[type] || null,
    });
  },

  onRetakeQuiz: function () {
    wx.navigateTo({ url: '/pages/quiz/quiz' });
  },

  onShareAppMessage: function () {
    return { title: 'QPP - 财经知识助手', path: '/pages/index/index' };
  },
});
