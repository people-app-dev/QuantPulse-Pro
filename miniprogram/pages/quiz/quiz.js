const { questions, calculateResult } = require('../../utils/quiz-data');

Page({
  data: {
    currentIndex: 0,
    totalQuestions: questions.length,
    currentQuestion: null,
    answers: [],
    selectedOption: null,
    progress: 0,
    completed: false,
    result: null,
    typeDetail: null,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onLoad() {
    this.resetQuiz();
  },

  resetQuiz() {
    this.setData({
      currentIndex: 0,
      answers: [],
      selectedOption: null,
      progress: 0,
      completed: false,
      result: null,
      typeDetail: null,
      currentQuestion: questions[0],
    });
  },

  onOptionTap(e) {
    const score = e.currentTarget.dataset.score;
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedOption: index });

    setTimeout(() => {
      const answers = [...this.data.answers];
      const existing = answers.findIndex(
        (a) => a.questionId === this.data.currentQuestion.id
      );
      if (existing >= 0) {
        answers[existing] = { questionId: this.data.currentQuestion.id, selectedScore: score };
      } else {
        answers.push({ questionId: this.data.currentQuestion.id, selectedScore: score });
      }
      this.setData({ answers });
      this.nextQuestion();
    }, 200);
  },

  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= questions.length) {
      this.finishQuiz();
    } else {
      const prevAnswer = this.data.answers.find(
        (a) => a.questionId === questions[nextIndex].id
      );
      this.setData({
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        progress: Math.round((nextIndex / questions.length) * 100),
        selectedOption: prevAnswer ? this.findOptionIndex(nextIndex, prevAnswer.selectedScore) : null,
      });
    }
  },

  prevQuestion() {
    if (this.data.currentIndex <= 0) return;
    const prevIndex = this.data.currentIndex - 1;
    const prevAnswer = this.data.answers.find(
      (a) => a.questionId === questions[prevIndex].id
    );
    this.setData({
      currentIndex: prevIndex,
      currentQuestion: questions[prevIndex],
      progress: Math.round((prevIndex / questions.length) * 100),
      selectedOption: prevAnswer ? this.findOptionIndex(prevIndex, prevAnswer.selectedScore) : null,
    });
  },

  findOptionIndex(questionIndex, score) {
    return questions[questionIndex].options.findIndex((o) => o.score === score);
  },

  finishQuiz() {
    const result = calculateResult(this.data.answers);
    const { typeAdvice } = require('../../utils/quiz-data');
    this.setData({
      completed: true,
      progress: 100,
      result: result,
      typeDetail: typeAdvice[result.investorType] || null,
    });
    this.saveResult(result);
  },

  saveResult(result) {
    var phone = wx.getStorageSync('accountPhone') || '';
    wx.cloud.callFunction({
      name: 'saveAssessment',
      data: {
        phone: phone,
        answers: this.data.answers,
        dimensions: result.dimensions,
        riskScore: result.riskScore,
        investorType: result.investorType,
        allocation: result.allocation,
      },
    }).catch((err) => {
      console.error('Failed to save assessment:', err);
    });
  },

  onRetake() {
    this.resetQuiz();
  },
});
