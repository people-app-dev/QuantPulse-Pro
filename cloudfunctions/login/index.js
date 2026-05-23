const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const user = await db.collection('users').where({ openid }).get();

  if (user.data.length === 0) {
    await db.collection('users').add({
      data: {
        openid,
        nickname: '',
        avatar: '',
        investorType: '',
        riskScore: 0,
        createdAt: db.serverDate(),
      },
    });
  }

  return {
    openid,
    user: user.data[0] || null,
  };
};
