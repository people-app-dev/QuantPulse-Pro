Component({
  properties: {
    post: Object,
  },
  methods: {
    onTap() {
      wx.navigateTo({ url: '/pages/post-detail/post-detail?id=' + this.properties.post._id });
    },
    onLike() {
      this.triggerEvent('like', { postId: this.properties.post._id });
    },
  },
});
