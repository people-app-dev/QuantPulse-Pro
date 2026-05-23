Page({
  data: {
    content: '',
    images: [],
    tags: ['理财故事', '每日打卡', '新手问答', '晒收益', '读书笔记'],
    selectedTags: [],
    maxImages: 9,
  },

  onContentInput(e) { this.setData({ content: e.detail.value }); },

  onChooseImage() {
    const remaining = this.data.maxImages - this.data.images.length;
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ images: [...this.data.images, ...res.tempFilePaths] });
      },
    });
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  onTagToggle(e) {
    const tag = e.currentTarget.dataset.tag;
    let selected = [...this.data.selectedTags];
    const idx = selected.indexOf(tag);
    if (idx >= 0) selected.splice(idx, 1);
    else selected.push(tag);
    this.setData({ selectedTags: selected });
  },

  async onSubmit() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发布中' });
    try {
      const imageUrls = [];
      for (const img of this.data.images) {
        const cloudPath = 'posts/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg';
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: img });
        imageUrls.push(uploadRes.fileID);
      }
      const res = await wx.cloud.callFunction({
        name: 'createPost',
        data: { content: this.data.content, images: imageUrls, tags: this.data.selectedTags },
      });
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({
          title: (res.result && res.result.error) || '发布失败，请检查云函数是否已部署',
          icon: 'none',
          duration: 3000,
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({
        title: '发布失败，请确保云函数已部署且云存储已开通',
        icon: 'none',
        duration: 3000,
      });
    }
  },
});
