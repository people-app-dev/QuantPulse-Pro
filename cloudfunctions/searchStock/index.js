const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { keyword } = event;
  if (!keyword || !keyword.trim()) {
    return { success: false, error: '请输入股票代码或名称' };
  }

  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      const url = `https://searchapi.eastmoney.com/bussiness/web/1111?keyword=${encodeURIComponent(keyword)}&client=web&count=20`;
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('解析搜索结果失败')); }
        });
      }).on('error', reject);
    });

    const stocks = (data.Data || []).map(item => ({
      code: item.Code,
      name: item.Name,
      market: item.Market,
      fullCode: (item.Market === 'SH' ? 'sh' : 'sz') + item.Code
    }));

    return { success: true, data: stocks };
  } catch (err) {
    console.error('searchStock error:', err);
    return { success: false, error: err.message };
  }
};
