const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const CACHE_TTL = 5 * 60 * 1000;
const priceCache = {};

exports.main = async (event) => {
  const { codes } = event;
  if (!codes || !codes.length) {
    return { success: false, error: '请提供股票代码' };
  }

  const cacheKey = codes.sort().join(',');
  const cached = priceCache[cacheKey];
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { success: true, data: cached.data };
  }

  try {
    const https = require('https');
    const raw = await new Promise((resolve, reject) => {
      const url = `http://hq.sinajs.cn/list=${codes.join(',')}`;
      https.get(url, {
        headers: { 'Referer': 'https://finance.sina.com.cn' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      }).on('error', reject);
    });

    const results = [];
    const lines = raw.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/hq_str_(\w+)="(.+)"/);
      if (!match) continue;
      const code = match[1];
      const fields = match[2].split(',');
      if (fields.length < 4) continue;
      results.push({
        code,
        name: fields[0],
        open: parseFloat(fields[1]) || 0,
        yesterdayClose: parseFloat(fields[2]) || 0,
        price: parseFloat(fields[3]) || 0,
        high: parseFloat(fields[4]) || 0,
        low: parseFloat(fields[5]) || 0,
        change: (parseFloat(fields[3]) || 0) - (parseFloat(fields[2]) || 0),
        changePercent: fields[2] > 0
          ? (((parseFloat(fields[3]) || 0) - parseFloat(fields[2])) / parseFloat(fields[2]) * 100).toFixed(2)
          : '0.00'
      });
    }

    priceCache[cacheKey] = { data: results, time: Date.now() };
    return { success: true, data: results };
  } catch (err) {
    console.error('getStockPrice error:', err);
    return { success: false, error: err.message };
  }
};
