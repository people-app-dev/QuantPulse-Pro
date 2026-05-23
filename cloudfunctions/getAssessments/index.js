const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const res = await db.collection('assessments')
    .where({ userId: openid })
    .orderBy('createdAt', 'desc')
    .get();

  return { assessments: res.data, total: res.data.length };
};
