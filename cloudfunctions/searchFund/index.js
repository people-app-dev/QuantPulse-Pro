const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  const { keyword } = event;
  if (!keyword || !keyword.trim()) {
    return { success: false, error: '请输入基金代码或名称' };
  }

  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?callback=&m=9&key=${encodeURIComponent(keyword)}`;
      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('解析基金搜索结果失败')); }
        });
      }).on('error', reject);
    });

    const funds = (data.Datas || []).map(item => ({
      code: item.CODE,
      name: item.NAME,
      type: item.FundType || '基金',
      fullCode: item.CODE
    }));

    return { success: true, data: funds };
  } catch (err) {
    console.error('searchFund error:', err);
    return { success: false, error: err.message };
  }
};
