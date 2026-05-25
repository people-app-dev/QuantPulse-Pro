const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // If wx.login code is provided, we could exchange it for session info
    // In cloud development, OPENID is automatically available from context
    if (event.code) {
      console.log('Login with code:', event.code.substring(0, 10) + '...');
    }

    const userRes = await db.collection('users').where({ openid }).get();

    if (userRes.data.length === 0) {
      const createResult = await db.collection('users').add({
        data: {
          openid,
          nickname: event.nickname || '',
          avatar: event.avatar || '',
          investorType: '',
          riskScore: 0,
          createdAt: db.serverDate(),
        },
      });
      return {
        openid,
        user: {
          _id: createResult._id,
          openid,
          nickname: event.nickname || '',
          avatar: event.avatar || '',
          investorType: '',
          riskScore: 0,
        },
      };
    }

    return { openid, user: userRes.data[0] };
  } catch (err) {
    console.error('login error:', err);
    return { openid: null, user: null, error: err.message };
  }
};
