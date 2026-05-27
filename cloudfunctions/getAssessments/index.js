const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const phone = event && event.phone ? event.phone : '';
    const userId = phone || openid;

    const res = await db.collection('assessments')
      .where({ userId })
      .orderBy('createdAt', 'desc')
      .get();

    return { assessments: res.data, total: res.data.length };
  } catch (err) {
    console.error('getAssessments error:', err);
    return { assessments: [], total: 0, error: err.message };
  }
};
