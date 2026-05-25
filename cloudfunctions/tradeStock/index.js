const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { type, code, name, price, shares } = event;

  if (!type || !code || !name || !price || !shares || shares <= 0) {
    return { success: false, error: '参数不完整' };
  }
  if (!['buy', 'sell'].includes(type)) {
    return { success: false, error: '交易类型无效' };
  }

  try {
    const res = await db.collection('simulations').where({ userId: OPENID }).get();
    if (res.data.length === 0) {
      return { success: false, error: '请先开通模拟账户' };
    }

    const sim = res.data[0];
    const totalCost = price * shares;

    if (type === 'buy') {
      if (sim.cash < totalCost) {
        return { success: false, error: '可用资金不足' };
      }
      const idx = sim.holdings.findIndex(h => h.code === code);
      if (idx >= 0) {
        const h = sim.holdings[idx];
        const totalShares = h.shares + shares;
        h.costPrice = ((h.costPrice * h.shares) + totalCost) / totalShares;
        h.shares = totalShares;
      } else {
        sim.holdings.push({ code, name, shares, costPrice: price });
      }
      sim.cash -= totalCost;
    } else {
      const idx = sim.holdings.findIndex(h => h.code === code);
      if (idx < 0 || sim.holdings[idx].shares < shares) {
        return { success: false, error: '持仓不足' };
      }
      sim.holdings[idx].shares -= shares;
      if (sim.holdings[idx].shares === 0) {
        sim.holdings.splice(idx, 1);
      }
      sim.cash += totalCost;
    }

    sim.transactions.push({
      type, code, name, price, shares,
      createdAt: new Date()
    });

    await db.collection('simulations').doc(sim._id).update({
      data: {
        cash: sim.cash,
        holdings: sim.holdings,
        transactions: sim.transactions
      }
    });

    return { success: true, data: sim };
  } catch (err) {
    console.error('tradeStock error:', err);
    return { success: false, error: err.message };
  }
};
