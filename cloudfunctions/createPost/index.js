const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { content, images, tags } = event;

  const checkResult = await cloud.callFunction({ name: 'contentCheck', data: { content } });
  if (!checkResult.result.pass) {
    return { success: false, error: '内容不符合安全规范' };
  }

  const result = await db.collection('posts').add({
    data: {
      userId: openid,
      content,
      images: images || [],
      tags: tags || [],
      likes: 0,
      comments: 0,
      createdAt: db.serverDate(),
    },
  });

  return { success: true, id: result._id };
};
