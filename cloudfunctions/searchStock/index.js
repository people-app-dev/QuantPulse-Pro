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
      const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&count=20`;
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('解析搜索结果失败')); }
        });
      }).on('error', reject);
    });

    const stocks = (data.QuotationCodeTable?.Data || []).map(item => ({
      code: item.Code,
      name: item.Name,
      market: item.Market,
      fullCode: (item.Market === 'SH' || item.Market === '0' ? 'sh' : 'sz') + item.Code
    }));

    return { success: true, data: stocks };
  } catch (err) {
    console.error('searchStock error:', err);
    return { success: false, error: err.message };
  }
};
