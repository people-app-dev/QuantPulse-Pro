const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();

  try {
    const existing = await db.collection('simulations').where({ userId: OPENID }).get();
    if (existing.data.length > 0) {
      return { success: true, data: existing.data[0], isNew: false };
    }

    const doc = {
      userId: OPENID,
      cash: 100000,
      holdings: [],
      transactions: [],
      createdAt: new Date()
    };

    const res = await db.collection('simulations').add({ data: doc });
    doc._id = res._id;
    return { success: true, data: doc, isNew: true };
  } catch (err) {
    console.error('initSimulation error:', err);
    return { success: false, error: err.message };
  }
};
