const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const res = await db.collection('assessments')
      .where({ userId: openid })
      .orderBy('createdAt', 'desc')
      .get();

    return { assessments: res.data, total: res.data.length };
  } catch (err) {
    console.error('getAssessments error:', err);
    return { assessments: [], total: 0, error: err.message };
  }
};
