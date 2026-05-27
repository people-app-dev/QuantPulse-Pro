const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const phone = event.phone || '';
    const userId = phone || openid;
    const { answers, dimensions, riskScore, investorType, allocation } = event;

    const result = await db.collection('assessments').add({
      data: {
        userId,
        answers,
        dimensions,
        riskScore,
        investorType,
        allocation,
        createdAt: db.serverDate(),
      },
    });

    if (phone) {
      await db.collection('users').where({ phone }).update({
        data: { investorType, riskScore },
      });
    } else {
      await db.collection('users').where({ openid }).update({
        data: { investorType, riskScore },
      });
    }

    return { id: result._id, success: true };
  } catch (err) {
    console.error('saveAssessment error:', err);
    return { success: false, error: err.message };
  }
};
