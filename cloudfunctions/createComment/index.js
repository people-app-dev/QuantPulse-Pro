const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const { postId, content } = event;

  const checkResult = await cloud.callFunction({ name: 'contentCheck', data: { content } });
  if (!checkResult.result.pass) return { success: false, error: '评论内容不符合规范' };

  await db.collection('comments').add({
    data: { postId, userId: wxContext.OPENID, content, createdAt: db.serverDate() },
  });

  await db.collection('posts').doc(postId).update({ data: { comments: db.command.inc(1) } });
  return { success: true };
};
