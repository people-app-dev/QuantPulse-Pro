const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { postId } = event;

  const likesRef = db.collection('likes');
  const existing = await likesRef.where({ postId, userId: openid }).get();

  if (existing.data.length > 0) {
    await likesRef.doc(existing.data[0]._id).remove();
    await db.collection('posts').doc(postId).update({ data: { likes: db.command.inc(-1) } });
    return { liked: false };
  } else {
    await likesRef.add({ data: { postId, userId: openid, createdAt: db.serverDate() } });
    await db.collection('posts').doc(postId).update({ data: { likes: db.command.inc(1) } });
    return { liked: true };
  }
};
