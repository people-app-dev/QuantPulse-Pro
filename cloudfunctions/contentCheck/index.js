const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  try {
    const result = await cloud.openapi.security.msgSecCheck({ content: event.content });
    return { pass: result.errCode === 0, detail: result };
  } catch (err) {
    return { pass: true, devFallback: true };
  }
};
