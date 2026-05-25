const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();

  try {
    const res = await db.collection('simulations').where({ userId: OPENID }).get();
    if (res.data.length === 0) {
      return { success: true, data: null };
    }

    const sim = res.data[0];
    const totalCost = sim.holdings.reduce((sum, h) => sum + h.costPrice * h.shares, 0);
    sim.totalCost = totalCost;

    return { success: true, data: sim };
  } catch (err) {
    console.error('getSimulation error:', err);
    return { success: false, error: err.message };
  }
};
