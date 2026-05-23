const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (event.nickname) {
    await db.collection('users').where({ openid }).update({ data: { nickname: event.nickname } });
  }

  const user = await db.collection('users').where({ openid }).get();
  return { user: user.data[0] || null };
};
