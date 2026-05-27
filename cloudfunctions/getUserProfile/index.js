const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function buildQuery(openid, phone) {
  if (phone) return { phone };
  return { openid };
}

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const phone = event.phone || '';

    const query = buildQuery(openid, phone);
    const updates = {};
    if (event.nickname) updates.nickname = event.nickname;
    if (event.avatar) updates.avatar = event.avatar;

    const userRes = await db.collection('users').where(query).get();
    if (userRes.data.length === 0) {
      await db.collection('users').add({
        data: {
          openid,
          phone,
          nickname: event.nickname || '',
          avatar: event.avatar || '',
          investorType: '',
          riskScore: 0,
          createdAt: db.serverDate(),
        },
      });
    } else if (Object.keys(updates).length > 0) {
      await db.collection('users').where(query).update({ data: updates });
    }

    const user = await db.collection('users').where(query).get();
    return { user: user.data[0] || null };
  } catch (err) {
    console.error('getUserProfile error:', err);
    return { user: null, error: err.message };
  }
};
