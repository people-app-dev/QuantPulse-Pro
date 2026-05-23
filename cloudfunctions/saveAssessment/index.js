const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { answers, dimensions, riskScore, investorType, allocation } = event;

  const result = await db.collection('assessments').add({
    data: {
      userId: openid,
      answers,
      dimensions,
      riskScore,
      investorType,
      allocation,
      createdAt: db.serverDate(),
    },
  });

  await db.collection('users').where({ openid }).update({
    data: {
      investorType,
      riskScore,
    },
  });

  return { id: result._id };
};
