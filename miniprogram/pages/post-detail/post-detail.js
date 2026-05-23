Page({
  data: { post: null, comments: [], commentInput: '' },
  onLoad(options) {
    const postId = options.id;
    this.setData({ postId });
    this.fetchPost(postId);
    this.fetchComments(postId);
  },
  fetchPost(postId) {
    wx.cloud.database().collection('posts').doc(postId).get().then((res) => {
      this.setData({ post: res.data });
    }).catch(console.error);
  },
  fetchComments(postId) {
    wx.cloud.callFunction({ name: 'getComments', data: { postId } }).then((res) => {
      this.setData({ comments: res.result.comments });
    }).catch(console.error);
  },
  onCommentInput(e) { this.setData({ commentInput: e.detail.value }); },
  onSubmitComment() {
    const content = this.data.commentInput.trim();
    if (!content) return;
    wx.cloud.callFunction({ name: 'createComment', data: { postId: this.data.postId, content } }).then((res) => {
      if (res.result.success) {
        this.setData({ commentInput: '' });
        this.fetchComments(this.data.postId);
      }
    }).catch(console.error);
  },
});
