const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const likesRes = await db.collection('likes')
      .where({ userId: openid })
      .orderBy('createdAt', 'desc')
      .get();

    if (likesRes.data.length === 0) {
      return { posts: [], total: 0 };
    }

    const postIds = likesRes.data.map(l => l.postId);
    const postsRes = await db.collection('posts')
      .where({ _id: db.command.in(postIds) })
      .get();

    const postMap = {};
    postsRes.data.forEach(p => { postMap[p._id] = p; });
    const sorted = postIds.map(id => postMap[id]).filter(Boolean);

    return { posts: sorted, total: sorted.length };
  } catch (err) {
    console.error('getMyLikes error:', err);
    return { posts: [], total: 0, error: err.message };
  }
};
