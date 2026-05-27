const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function hashPassword(pw) {
  return crypto.createHash('sha256').update('qpp-salt-' + pw).digest('hex');
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // —— WeChat one-tap phone login ——
    if (event.phoneCode) {
      try {
        const phoneRes = await cloud.openapi.phonenumber.getPhoneNumber({
          code: event.phoneCode,
        });
        const phone = phoneRes.phoneInfo.phoneNumber;
        if (!phone) return { error: '未能获取手机号' };
        return await loginOrCreateByPhone(phone, openid);
      } catch (e) {
        return { error: '手机号获取失败: ' + (e.errMsg || e.message) };
      }
    }

    // —— Phone + password login or register ——
    if (event.phoneNumber) {
      const phone = String(event.phoneNumber).trim();
      if (!/^1\d{10}$/.test(phone)) {
        return { error: '手机号格式不正确' };
      }

      // Register new account or set password for existing
      if (event.action === 'register') {
        return await registerUser(phone, openid, event.password || '');
      }

      // Login with password
      if (event.password) {
        return await loginByPassword(phone, openid, event.password);
      }

      // Login without password (lookup only, for WeChat one-tap fallback)
      return await loginOrCreateByPhone(phone, openid);
    }

    // —— Fallback: OpenID-based login (legacy) ——
    const userRes = await db.collection('users').where({ openid }).get();
    if (userRes.data.length === 0) {
      const data = {
        openid, phone: '', password: '', nickname: '', avatar: '',
        investorType: '', riskScore: 0, createdAt: new Date(),
      };
      const result = await db.collection('users').add({ data });
      return { openid, user: { _id: result._id, ...data } };
    }
    return { openid, user: sanitizeUser(userRes.data[0]) };
  } catch (err) {
    console.error('login error:', err);
    return { error: '服务器错误: ' + (err.message || '未知错误') };
  }
};

// —— Helper functions ——

async function loginOrCreateByPhone(phone, openid) {
  const userRes = await db.collection('users').where({ phone }).get();

  if (userRes.data.length > 0) {
    const user = userRes.data[0];
    if (!user.openid) {
      await db.collection('users').doc(user._id).update({ data: { openid } });
    }
    return { phone, user: sanitizeUser(user) };
  }

  const data = {
    openid, phone, password: '', nickname: '', avatar: '',
    investorType: '', riskScore: 0, createdAt: new Date(),
  };
  const result = await db.collection('users').add({ data });
  return { phone, user: { _id: result._id, ...data } };
}

async function registerUser(phone, openid, password) {
  if (!password || password.length < 6) {
    return { error: '密码长度不能少于6位' };
  }

  try {
    const userRes = await db.collection('users').where({ phone }).get();

    if (userRes.data.length > 0) {
      const user = userRes.data[0];
      if (user.password) {
        return { error: '该手机号已注册，请切换到登录' };
      }
      // Set password for existing phone-only account (from WeChat one-tap)
      await db.collection('users').doc(user._id).update({
        data: { password: hashPassword(password), openid },
      });
      return { phone, user: sanitizeUser(user) };
    }

    // Brand-new registration
    const data = {
      openid, phone, password: hashPassword(password),
      nickname: '', avatar: '', investorType: '', riskScore: 0,
      createdAt: new Date(),
    };
    const result = await db.collection('users').add({ data });
    return { phone, user: { _id: result._id, ...data } };
  } catch (e) {
    return { error: '注册失败: ' + (e.message || '数据库错误') };
  }
}

async function loginByPassword(phone, openid, password) {
  try {
    const userRes = await db.collection('users').where({ phone }).get();

    if (userRes.data.length === 0) {
      return { error: '该手机号未注册，请先注册' };
    }

    const user = userRes.data[0];

    if (!user.password) {
      return { error: '该账号未设置密码，请使用微信一键登录' };
    }

    if (user.password !== hashPassword(password)) {
      return { error: '密码错误' };
    }

    if (!user.openid) {
      await db.collection('users').doc(user._id).update({ data: { openid } });
    }

    return { phone, user: sanitizeUser(user) };
  } catch (e) {
    return { error: '登录失败: ' + (e.message || '数据库错误') };
  }
}

function sanitizeUser(user) {
  return {
    _id: user._id,
    openid: user.openid || '',
    phone: user.phone || '',
    nickname: user.nickname || '',
    avatar: user.avatar || '',
    investorType: user.investorType || '',
    riskScore: user.riskScore || 0,
  };
}
