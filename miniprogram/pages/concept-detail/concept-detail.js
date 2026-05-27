const CATEGORY_CLASS_MAP = {
  '股票': 'cat-stock',
  '基金': 'cat-fund',
  '债券': 'cat-bond',
  '宏观': 'cat-macro',
  '理财': 'cat-finance',
};

Page({
  data: {
    concept: null,
    relatedConcepts: [],
    loading: true,
    categoryClass: '',
    detailLoading: false,
  },

  onLoad(options) {
    const app = getApp();
    if (app.globalData.selectedConcept) {
      const concept = app.globalData.selectedConcept;
      app.globalData.selectedConcept = null;
      const categoryClass = CATEGORY_CLASS_MAP[concept.category] || '';
      this.setData({ concept, categoryClass, loading: false });
      this.fetchRelated(concept);
      if (!concept.detail) {
        this.setData({ detailLoading: true });
        this.fetchConceptDetail(concept.id || concept.concept);
      }
      return;
    }

    if (!options.id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.fetchConcept(options.id, options.name);
  },

  fetchConcept(id, name) {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'searchFinanceConcept',
      data: { exactId: id, keyword: name || id },
    }).then((res) => {
      if (res.result.success && res.result.data.length > 0) {
        const concept = res.result.data[0];
        const categoryClass = CATEGORY_CLASS_MAP[concept.category] || '';
        this.setData({ concept, categoryClass, loading: false });
        this.fetchRelated(concept);
      } else {
        wx.showToast({ title: '未找到概念', icon: 'none' });
        this.setData({ loading: false });
      }
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    });
  },

  fetchConceptDetail(keyword) {
    wx.cloud.callFunction({
      name: 'searchFinanceConcept',
      data: { exactId: keyword, keyword: keyword },
    }).then((res) => {
      if (res.result.success && res.result.data.length > 0 && res.result.data[0].detail) {
        const concept = { ...this.data.concept, detail: res.result.data[0].detail };
        this.setData({ concept, detailLoading: false });
      } else {
        this.fetchConceptFallback(keyword);
      }
    }).catch(() => {
      this.fetchConceptFallback(keyword);
    });
  },

  fetchConceptFallback(keyword) {
    const conceptName = this.data.concept ? this.data.concept.concept : keyword;
    wx.cloud.callFunction({
      name: 'searchFinanceConcept',
      data: { keyword: conceptName },
    }).then((res) => {
      if (res.result.success && res.result.data.length > 0) {
        const match = res.result.data.find(c => c.id === keyword || c.concept === conceptName);
        if (match && match.detail) {
          const concept = { ...this.data.concept, detail: match.detail };
          this.setData({ concept, detailLoading: false });
        } else {
          this.setData({ detailLoading: false });
        }
      } else {
        this.setData({ detailLoading: false });
      }
    }).catch(() => {
      this.setData({ detailLoading: false });
    });
  },

  fetchRelated(concept) {
    wx.cloud.callFunction({
      name: 'searchFinanceConcept',
      data: { keyword: '', category: concept.category },
    }).then((res) => {
      if (res.result.success) {
        const related = res.result.data
          .filter(c => c.id !== concept.id)
          .slice(0, 4);
        this.setData({ relatedConcepts: related });
      }
    }).catch(() => {});
  },

  onRelatedTap(e) {
    const id = e.currentTarget.dataset.id;
    this.fetchConcept(id);
    wx.pageScrollTo({ scrollTop: 0 });
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    const c = this.data.concept;
    return {
      title: c ? c.concept + ' - QPP金融知识' : 'QPP - 金融知识',
      path: '/pages/concept-detail/concept-detail?id=' + (c ? c.id : ''),
    };
  },
});
