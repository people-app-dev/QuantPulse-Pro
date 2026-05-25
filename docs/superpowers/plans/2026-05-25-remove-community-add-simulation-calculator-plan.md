# Remove Community + Add Investment Simulation & Calculator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all community features (feed, posts, comments, likes, favorites). Expand Tab 2 into an "Invest" tab with risk assessment + paper trading simulation using real stock prices. Add financial calculator. Update "Mine" page menu.

**Architecture:** 3-tab mini program (Market / Invest / Mine). Simulation uses EastMoney API for stock search and Sina API for real-time quotes, both called from cloud functions. Portfolio data stored in a new `simulations` Cloud Database collection. Calculator is pure client-side.

**Tech Stack:** WeChat Mini Program (WXML + WXSS + JS), WeChat Cloud Functions (Node.js), wx-server-sdk

---

## File Structure Map

```
DELETE:
  miniprogram/pages/feed/              (entire dir)
  miniprogram/pages/post-create/       (entire dir)
  miniprogram/pages/post-detail/       (entire dir)
  miniprogram/pages/my-posts/          (entire dir)
  miniprogram/pages/my-favorites/      (entire dir)
  miniprogram/pages/my-likes/          (entire dir)
  miniprogram/pages/user-posts/        (entire dir)
  miniprogram/components/post-card/    (entire dir)
  cloudfunctions/createPost/           (entire dir)
  cloudfunctions/createComment/        (entire dir)
  cloudfunctions/getComments/          (entire dir)
  cloudfunctions/toggleLike/           (entire dir)
  cloudfunctions/toggleFavorite/       (entire dir)
  cloudfunctions/getMyPosts/           (entire dir)
  cloudfunctions/getMyFavorites/       (entire dir)
  cloudfunctions/getMyLikes/           (entire dir)
  cloudfunctions/getUserPosts/         (entire dir)
  cloudfunctions/contentCheck/         (entire dir)
  cloudfunctions/clearAllPosts/        (entire dir)

CREATE:
  cloudfunctions/searchStock/          (package.json + index.js)
  cloudfunctions/getStockPrice/        (package.json + index.js)
  cloudfunctions/initSimulation/       (package.json + index.js)
  cloudfunctions/getSimulation/        (package.json + index.js)
  cloudfunctions/tradeStock/           (package.json + index.js)
  miniprogram/pages/invest/            (invest.js + invest.wxml + invest.wxss + invest.json)
  miniprogram/pages/simulation/        (simulation.js + simulation.wxml + simulation.wxss + simulation.json)
  miniprogram/pages/calculator/        (calculator.js + calculator.wxml + calculator.wxss + calculator.json)

MODIFY:
  miniprogram/app.json                 (remove community pages, restructure tabBar to 3 tabs, add new pages)
  miniprogram/custom-tab-bar/          (reduce to 3 tabs, update icons)
  miniprogram/pages/quiz-result/       (rewrite from stub)
  miniprogram/pages/mine/mine.js       (replace menu items)
  miniprogram/pages/mine/mine.wxml     (replace menu items)
  miniprogram/pages/mine/mine.wxss     (style updates for simulation card)
  miniprogram/utils/icons.js           (remove unused icons, add invest icon)
```

---

### Task 1: Delete community cloud functions

**Files:**
- Delete: all 11 community cloud function directories listed above

- [ ] **Step 1: Delete cloud function directories**

```bash
rm -rf cloudfunctions/createPost cloudfunctions/createComment cloudfunctions/getComments \
       cloudfunctions/toggleLike cloudfunctions/toggleFavorite cloudfunctions/getMyPosts \
       cloudfunctions/getMyFavorites cloudfunctions/getMyLikes cloudfunctions/getUserPosts \
       cloudfunctions/contentCheck cloudfunctions/clearAllPosts
```

### Task 2: Delete community pages and component

**Files:**
- Delete: all 7 community page directories + post-card component

- [ ] **Step 1: Delete page and component directories**

```bash
rm -rf miniprogram/pages/feed miniprogram/pages/post-create miniprogram/pages/post-detail \
       miniprogram/pages/my-posts miniprogram/pages/my-favorites miniprogram/pages/my-likes \
       miniprogram/pages/user-posts miniprogram/components/post-card
```

### Task 3: Create searchStock cloud function

**Files:**
- Create: `cloudfunctions/searchStock/package.json`
- Create: `cloudfunctions/searchStock/index.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "searchStock",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": { "wx-server-sdk": "latest" }
}
```

- [ ] **Step 2: Create index.js**

```javascript
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
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('解析搜索结果失败'));
          }
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
```

### Task 4: Create getStockPrice cloud function

**Files:**
- Create: `cloudfunctions/getStockPrice/package.json`
- Create: `cloudfunctions/getStockPrice/index.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "getStockPrice",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": { "wx-server-sdk": "latest" }
}
```

- [ ] **Step 2: Create index.js**

```javascript
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const priceCache = {};

exports.main = async (event) => {
  const { codes } = event; // e.g. ["sh600519", "sz000858"]
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
```

### Task 5: Create initSimulation cloud function

**Files:**
- Create: `cloudfunctions/initSimulation/package.json`
- Create: `cloudfunctions/initSimulation/index.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "initSimulation",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": { "wx-server-sdk": "latest" }
}
```

- [ ] **Step 2: Create index.js**

```javascript
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
```

### Task 6: Create getSimulation cloud function

**Files:**
- Create: `cloudfunctions/getSimulation/package.json`
- Create: `cloudfunctions/getSimulation/index.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "getSimulation",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": { "wx-server-sdk": "latest" }
}
```

- [ ] **Step 2: Create index.js**

```javascript
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
    sim.totalMarketValue = totalCost; // will be recalculated on frontend with live prices
    sim.totalAssets = sim.cash + totalCost;

    return { success: true, data: sim };
  } catch (err) {
    console.error('getSimulation error:', err);
    return { success: false, error: err.message };
  }
};
```

### Task 7: Create tradeStock cloud function

**Files:**
- Create: `cloudfunctions/tradeStock/package.json`
- Create: `cloudfunctions/tradeStock/index.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tradeStock",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": { "wx-server-sdk": "latest" }
}
```

- [ ] **Step 2: Create index.js**

```javascript
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
    } else { // sell
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
```

### Task 8: Update app.json — remove community pages, add new pages, restructure tab bar

**Files:**
- Modify: `miniprogram/app.json`

- [ ] **Step 1: Read current app.json**

Read `miniprogram/app.json` to get current content.

- [ ] **Step 2: Update app.json**

Remove these pages from `pages` array:
- `pages/feed/feed`
- `pages/post-create/post-create`
- `pages/post-detail/post-detail`
- `pages/my-posts/my-posts`
- `pages/my-favorites/my-favorites`
- `pages/my-likes/my-likes`
- `pages/user-posts/user-posts`

Add these pages to `pages` array:
- `pages/invest/invest`
- `pages/simulation/simulation`
- `pages/calculator/calculator`

Update `tabBar.list` to 3 tabs:
```json
"tabBar": {
  "custom": true,
  "list": [
    { "pagePath": "pages/index/index", "text": "市场" },
    { "pagePath": "pages/invest/invest", "text": "投资" },
    { "pagePath": "pages/mine/mine", "text": "我的" }
  ]
}
```

### Task 9: Update custom tab bar to 3 tabs

**Files:**
- Modify: `miniprogram/custom-tab-bar/index.js`
- Modify: `miniprogram/custom-tab-bar/index.wxml`
- Modify: `miniprogram/custom-tab-bar/index.wxss`

- [ ] **Step 1: Read current tab bar files**

Read all three files in `miniprogram/custom-tab-bar/`.

- [ ] **Step 2: Update index.js**

Change `list` to 3 items with updated page paths:
```javascript
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '市场' },
      { pagePath: '/pages/invest/invest', text: '投资' },
      { pagePath: '/pages/mine/mine', text: '我的' },
    ],
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (this.data.selected === index) return;
      wx.switchTab({ url: path });
    },
  },
});
```

The icon handling needs to match — use the same getTabIconUris pattern but with 3 tabs. Import icons at the top:
```javascript
const { getTabIconUris } = require('../../utils/icons');
```

Then in `attached` or a computed property, set icon URIs for the selected/unselected states.

- [ ] **Step 3: Update index.wxml**

Reduce to 3 tab items:
```html
<view class="tab-bar">
  <view class="tab-item" wx:for="{{list}}" wx:key="index"
    data-path="{{item.pagePath}}" data-index="{{index}}"
    bindtap="switchTab">
    <image class="tab-icon" src="{{selected === index ? item.iconOn : item.iconOff}}" />
    <text class="tab-text {{selected === index ? 'active' : ''}}">{{item.text}}</text>
  </view>
</view>
```

- [ ] **Step 4: Update icons.js tab icon functions**

Update `getTabIconUris()` to return URIs for 3 tabs:

```javascript
getTabIconUris() {
  return {
    home: { on: toDataUri(icons.home(true)), off: toDataUri(icons.home(false)) },
    invest: { on: toDataUri(icons.invest(true)), off: toDataUri(icons.invest(false)) },
    mine: { on: toDataUri(icons.mine(true)), off: toDataUri(icons.mine(false)) },
  };
}
```

Add `invest` icon to the icons object:
```javascript
invest: (selected) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${selected ? '#007AFF' : '#8E8E93'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
```

### Task 10: Rewrite quiz-result page from stub

**Files:**
- Modify: `miniprogram/pages/quiz-result/quiz-result.js`
- Modify: `miniprogram/pages/quiz-result/quiz-result.wxml`
- Modify: `miniprogram/pages/quiz-result/quiz-result.wxss`
- Modify: `miniprogram/pages/quiz-result/quiz-result.json`

- [ ] **Step 1: Write quiz-result.js**

```javascript
Page({
  data: {
    investorType: '',
    riskScore: 0,
    allocation: [],
  },

  onLoad(options) {
    if (options.type && options.score) {
      const allocation = JSON.parse(decodeURIComponent(options.allocation || '[]'));
      this.setData({
        investorType: options.type,
        riskScore: parseInt(options.score) || 0,
        allocation,
      });
    }
  },

  onStartSimulation() {
    wx.showLoading({ title: '开通中' });
    wx.cloud.callFunction({ name: 'initSimulation' }).then((res) => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.switchTab({ url: '/pages/invest/invest' });
      } else {
        wx.showToast({ title: '开通失败', icon: 'none' });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('initSimulation error:', err);
      wx.showToast({ title: '开通失败', icon: 'none' });
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
```

- [ ] **Step 2: Write quiz-result.wxml**

```html
<view class="page">
  <view class="result-card">
    <text class="result-title">测评结果</text>
    <view class="result-type-row">
      <text class="result-type">{{investorType}}</text>
    </view>
    <view class="result-score-row">
      <text class="result-score">{{riskScore}}</text>
      <text class="result-unit">分</text>
    </view>
    <view class="risk-bar">
      <view class="risk-fill" style="width: {{riskScore}}%;"></view>
    </view>
  </view>

  <view class="allocation-card" wx:if="{{allocation.length}}">
    <text class="section-title">建议资产配置</text>
    <view class="alloc-item" wx:for="{{allocation}}" wx:key="name">
      <text class="alloc-name">{{item.name}}</text>
      <text class="alloc-pct">{{item.pct}}%</text>
    </view>
  </view>

  <button class="sim-btn" bindtap="onStartSimulation">开始投资模拟</button>
</view>
```

- [ ] **Step 3: Write quiz-result.wxss**

```css
@import '/styles/design-tokens.wxss';

.page {
  padding: var(--space-lg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
}

.result-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-xl);
  width: 100%;
  text-align: center;
  margin-bottom: var(--space-md);
}

.result-title { font-size: var(--font-caption); color: var(--color-text-secondary); }

.result-type-row { margin: var(--space-sm) 0; }
.result-type { font-size: 28px; font-weight: 700; color: var(--color-primary); }

.result-score-row { display: flex; align-items: baseline; justify-content: center; gap: 4px; }
.result-score { font-size: 40px; font-weight: 700; color: var(--color-primary); }
.result-unit { font-size: var(--font-caption); color: var(--color-text-secondary); }

.risk-bar { height: 4px; background: var(--color-bg); border-radius: 2px; overflow: hidden; margin: var(--space-md) 0; width: 100%; }
.risk-fill { height: 100%; background: var(--color-primary); border-radius: 2px; }

.allocation-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  width: 100%;
  margin-bottom: var(--space-md);
}

.section-title { font-size: var(--font-headline); font-weight: 600; color: var(--color-text-primary); display: block; margin-bottom: var(--space-md); }

.alloc-item { display: flex; justify-content: space-between; padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-bg); }
.alloc-item:last-child { border-bottom: none; }
.alloc-name { font-size: var(--font-body); color: var(--color-text-primary); }
.alloc-pct { font-size: var(--font-body); font-weight: 600; color: var(--color-primary); }

.sim-btn {
  width: 100%;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-button);
  font-size: var(--font-headline);
  padding: 12px;
  margin-top: var(--space-xl);
}
```

- [ ] **Step 4: Write quiz-result.json**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "测评结果"
}
```

### Task 11: Update quiz page — pass allocation data to quiz-result

**Files:**
- Modify: `miniprogram/pages/quiz/quiz.js`

- [ ] **Step 1: Update navigateTo result**

Find the `wx.navigateTo` call to quiz-result and update it to pass allocation data. The current quiz.js likely navigates to quiz-result with type and score. Add the allocation parameter as a JSON-encoded string.

In the submit/completion handler, change the navigation to:
```javascript
wx.navigateTo({
  url: `/pages/quiz-result/quiz-result?type=${encodeURIComponent(investorType)}&score=${riskScore}&allocation=${encodeURIComponent(JSON.stringify(allocation))}`
});
```

The `investorType`, `riskScore`, and `allocation` values should come from the saveAssessment cloud function response or from the quiz scoring logic.

### Task 12: Create invest tab page (Tab 2 entry point)

**Files:**
- Create: `miniprogram/pages/invest/invest.js`
- Create: `miniprogram/pages/invest/invest.wxml`
- Create: `miniprogram/pages/invest/invest.wxss`
- Create: `miniprogram/pages/invest/invest.json`

- [ ] **Step 1: Write invest.js**

```javascript
Page({
  data: {
    hasAssessment: false,
    investorType: '',
    riskScore: 0,
    hasSimulation: false,
    simData: null,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.loadData();
  },

  loadData() {
    wx.cloud.callFunction({ name: 'getUserProfile' }).then((res) => {
      const user = res.result.user || {};
      const hasAssessment = !!user.investorType;
      this.setData({
        hasAssessment,
        investorType: user.investorType || '',
        riskScore: user.riskScore || 0,
      });
      if (hasAssessment) this.loadSimulation();
    }).catch(console.error);
  },

  loadSimulation() {
    wx.cloud.callFunction({ name: 'getSimulation' }).then((res) => {
      if (res.result.success && res.result.data) {
        this.setData({ hasSimulation: true, simData: res.result.data });
      }
    }).catch(() => {});
  },

  onGoQuiz() {
    wx.navigateTo({ url: '/pages/quiz/quiz' });
  },

  onGoSimulation() {
    if (this.data.hasSimulation) {
      wx.navigateTo({ url: '/pages/simulation/simulation' });
    } else {
      wx.cloud.callFunction({ name: 'initSimulation' }).then((res) => {
        if (res.result && res.result.success) {
          this.setData({ hasSimulation: true, simData: res.result.data });
          wx.navigateTo({ url: '/pages/simulation/simulation' });
        } else {
          wx.showToast({ title: '开通失败', icon: 'none' });
        }
      });
    }
  },

  onShareAppMessage() {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
```

- [ ] **Step 2: Write invest.wxml**

```html
<view class="page">
  <!-- No assessment: show invitation -->
  <view class="card" wx:if="{{!hasAssessment}}">
    <text class="card-title">风险测评</text>
    <text class="card-desc">完成风险测评，了解你的投资风险偏好，开启模拟投资之旅</text>
    <button class="primary-btn" bindtap="onGoQuiz">开始测评</button>
  </view>

  <!-- Has assessment: show risk summary + simulation -->
  <block wx:else>
    <view class="card risk-summary">
      <text class="card-label">我的风险画像</text>
      <view class="risk-row">
        <text class="risk-type">{{investorType}}</text>
        <text class="risk-score">{{riskScore}}分</text>
      </view>
    </view>

    <view class="card sim-card">
      <text class="card-title">投资模拟盘</text>
      <view wx:if="{{hasSimulation && simData}}" class="sim-overview">
        <view class="sim-stat">
          <text class="sim-stat-value">{{simData.cash}}</text>
          <text class="sim-stat-label">可用资金</text>
        </view>
        <view class="sim-stat">
          <text class="sim-stat-value">{{simData.totalAssets}}</text>
          <text class="sim-stat-label">总资产</text>
        </view>
      </view>
      <view wx:else class="sim-empty">
        <text class="sim-empty-text">尚未开通模拟账户</text>
      </view>
      <button class="primary-btn" bindtap="onGoSimulation">进入模拟盘</button>
    </view>
  </block>
</view>
```

- [ ] **Step 3: Write invest.wxss**

```css
@import '/styles/design-tokens.wxss';

.page { padding: var(--space-lg); min-height: 100vh; padding-bottom: 100px; }

.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
}

.card-title { font-size: var(--font-headline); font-weight: 600; color: var(--color-text-primary); display: block; }
.card-label { font-size: var(--font-caption); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-xs); }
.card-desc { font-size: var(--font-body); color: var(--color-text-secondary); display: block; margin: var(--space-sm) 0 var(--space-md); }

.primary-btn {
  width: 100%;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-button);
  font-size: var(--font-body);
  padding: 10px;
  margin-top: var(--space-md);
}

.risk-row { display: flex; justify-content: space-between; align-items: baseline; }
.risk-type { font-size: 22px; font-weight: 700; color: var(--color-primary); }
.risk-score { font-size: var(--font-headline); font-weight: 600; color: var(--color-text-primary); }

.sim-overview { display: flex; gap: var(--space-md); margin: var(--space-md) 0; }
.sim-stat { flex: 1; text-align: center; }
.sim-stat-value { font-size: 22px; font-weight: 700; color: var(--color-text-primary); display: block; }
.sim-stat-label { font-size: var(--font-small); color: var(--color-text-secondary); }

.sim-empty { margin: var(--space-md) 0; }
.sim-empty-text { font-size: var(--font-body); color: var(--color-text-secondary); }
```

- [ ] **Step 4: Write invest.json**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "投资"
}
```

### Task 13: Create simulation page (paper trading)

**Files:**
- Create: `miniprogram/pages/simulation/simulation.js`
- Create: `miniprogram/pages/simulation/simulation.wxml`
- Create: `miniprogram/pages/simulation/simulation.wxss`
- Create: `miniprogram/pages/simulation/simulation.json`

- [ ] **Step 1: Write simulation.js**

```javascript
Page({
  data: {
    cash: 100000,
    holdings: [],
    totalMarketValue: 0,
    totalAssets: 100000,
    totalProfit: 0,
    totalProfitPercent: '0.00',

    // Search state
    searching: false,
    searchKeyword: '',
    searchResults: [],

    // Order state
    ordering: false,
    orderStock: null,
    orderType: '',
    orderPrice: 0,
    orderShares: 0,
  },

  onShow() { this.loadData(); },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  loadData() {
    return wx.cloud.callFunction({ name: 'getSimulation' }).then((res) => {
      if (!res.result.success || !res.result.data) {
        this.setData({ cash: 100000, holdings: [], totalAssets: 100000 });
        return;
      }
      const sim = res.result.data;
      this.setData({
        cash: sim.cash,
        holdings: sim.holdings || [],
        totalAssets: sim.cash + sim.totalCost,
        totalMarketValue: sim.totalCost,
      });
      if (sim.holdings && sim.holdings.length) {
        this.refreshPrices(sim.holdings.map(h => h.code));
      }
    }).catch(console.error);
  },

  refreshPrices(codes) {
    wx.cloud.callFunction({ name: 'getStockPrice', data: { codes } }).then((res) => {
      if (!res.result.success) return;
      const prices = res.result.data;
      const priceMap = {};
      prices.forEach(p => priceMap[p.code] = p.price);

      let totalMarketValue = 0;
      let totalCost = 0;
      const holdings = this.data.holdings.map(h => {
        const currentPrice = priceMap[h.code] || h.costPrice;
        const marketValue = currentPrice * h.shares;
        totalMarketValue += marketValue;
        totalCost += h.costPrice * h.shares;
        return { ...h, currentPrice, marketValue: marketValue.toFixed(2) };
      });

      const totalProfit = totalMarketValue - totalCost;
      const totalProfitPercent = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0.00';

      this.setData({
        holdings,
        totalMarketValue: totalMarketValue.toFixed(2),
        totalAssets: (this.data.cash + totalMarketValue).toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        totalProfitPercent,
      });
    }).catch(() => {});
  },

  onStartBuy() {
    this.setData({ searching: true, ordering: false, searchKeyword: '', searchResults: [] });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    const kw = this.data.searchKeyword.trim();
    if (!kw) return;
    wx.cloud.callFunction({ name: 'searchStock', data: { keyword: kw } }).then((res) => {
      if (res.result.success) {
        this.setData({ searchResults: res.result.data || [] });
      }
    }).catch(console.error);
  },

  onPickStock(e) {
    const idx = e.currentTarget.dataset.index;
    const stock = this.data.searchResults[idx];
    this.setData({
      searching: false,
      ordering: true,
      orderStock: stock,
      orderType: 'buy',
      orderPrice: 0,
      orderShares: 0,
    });
    // Fetch real-time price
    wx.cloud.callFunction({ name: 'getStockPrice', data: { codes: [stock.fullCode] } }).then((res) => {
      if (res.result.success && res.result.data.length) {
        this.setData({ orderPrice: res.result.data[0].price });
      }
    });
  },

  onSellStock(e) {
    const idx = e.currentTarget.dataset.index;
    const h = this.data.holdings[idx];
    this.setData({
      ordering: true,
      searching: false,
      orderStock: { fullCode: h.code, name: h.name },
      orderType: 'sell',
      orderPrice: h.currentPrice || h.costPrice,
      orderShares: 0,
      maxShares: h.shares,
    });
  },

  onOrderSharesInput(e) {
    const v = parseInt(e.detail.value) || 0;
    this.setData({ orderShares: Math.max(0, v) });
  },

  onSubmitOrder() {
    const { orderType, orderStock, orderPrice, orderShares } = this.data;
    if (orderShares <= 0) {
      wx.showToast({ title: '请输入有效数量', icon: 'none' }); return;
    }
    if (orderPrice <= 0) {
      wx.showToast({ title: '获取价格失败，请重试', icon: 'none' }); return;
    }

    wx.showLoading({ title: '交易中' });
    wx.cloud.callFunction({
      name: 'tradeStock',
      data: {
        type: orderType,
        code: orderStock.fullCode,
        name: orderStock.name,
        price: orderPrice,
        shares: orderShares,
      },
    }).then((res) => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({ title: orderType === 'buy' ? '买入成功' : '卖出成功', icon: 'success' });
        this.setData({ ordering: false, searching: false });
        this.loadData();
      } else {
        wx.showToast({ title: res.result.error || '交易失败', icon: 'none' });
      }
    }).catch((err) => {
      wx.hideLoading();
      console.error('tradeStock error:', err);
      wx.showToast({ title: '交易失败', icon: 'none' });
    });
  },

  onCancel() {
    this.setData({ searching: false, ordering: false });
  },

  onShareAppMessage() {
    return { title: 'QPP - 投资模拟盘', path: '/pages/invest/invest' };
  },
});
```

- [ ] **Step 2: Write simulation.wxml**

```html
<view class="page">
  <!-- Asset Overview -->
  <view class="asset-card">
    <text class="asset-label">总资产</text>
    <text class="asset-value">{{totalAssets}}</text>
    <view class="asset-sub-row">
      <text class="asset-sub">现金 {{cash}}</text>
      <text class="asset-sub {{totalProfit >= 0 ? 'profit-up' : 'profit-down'}}">
        盈亏 {{totalProfit >= 0 ? '+' : ''}}{{totalProfit}}（{{totalProfitPercent}}%）
      </text>
    </view>
  </view>

  <!-- Holdings -->
  <view class="section" wx:if="{{!searching && !ordering}}">
    <view class="section-header">
      <text class="section-title">持仓</text>
      <text class="section-action" bindtap="onStartBuy">+ 买入</text>
    </view>
    <view wx:if="{{holdings.length === 0}}" class="empty">
      <text class="empty-text">暂无持仓，点击上方「买入」开始投资</text>
    </view>
    <view wx:else class="holding-list">
      <view class="holding-item" wx:for="{{holdings}}" wx:key="code">
        <view class="holding-info">
          <text class="holding-name">{{item.name}}</text>
          <text class="holding-code">{{item.code}}</text>
          <text class="holding-detail">{{item.shares}}股 · 成本 {{item.costPrice}}</text>
        </view>
        <view class="holding-right">
          <text class="holding-price">{{item.currentPrice || item.costPrice}}</text>
          <text class="holding-pnl {{item.marketValue > item.costPrice * item.shares ? 'profit-up' : 'profit-down'}}">
            {{item.marketValue || '--'}}
          </text>
          <button class="sell-btn" size="mini" bindtap="onSellStock" data-index="{{index}}">卖出</button>
        </view>
      </view>
    </view>
  </view>

  <!-- Search -->
  <view class="section" wx:if="{{searching}}">
    <view class="search-header">
      <text class="section-title">搜索股票</text>
      <text class="cancel-link" bindtap="onCancel">取消</text>
    </view>
    <view class="search-bar">
      <input class="search-input" placeholder="输入股票代码或名称" value="{{searchKeyword}}" bindinput="onSearchInput" confirm-type="search" bindconfirm="onSearch" />
      <button class="search-btn" size="mini" bindtap="onSearch">搜索</button>
    </view>
    <view class="search-results">
      <view class="search-item" wx:for="{{searchResults}}" wx:key="code" bindtap="onPickStock" data-index="{{index}}">
        <text class="search-name">{{item.name}}</text>
        <text class="search-code">{{item.code}}</text>
      </view>
    </view>
  </view>

  <!-- Order -->
  <view class="section" wx:if="{{ordering}}">
    <view class="search-header">
      <text class="section-title">{{orderType === 'buy' ? '买入' : '卖出'}} {{orderStock.name}}</text>
      <text class="cancel-link" bindtap="onCancel">取消</text>
    </view>
    <view class="order-info">
      <text class="order-code">{{orderStock.fullCode}}</text>
      <text class="order-price">当前价 {{orderPrice || '加载中...'}}</text>
      <view wx:if="{{orderType === 'sell'}}">
        <text class="order-max">可卖: {{maxShares}}股</text>
      </view>
    </view>
    <view class="order-input-row">
      <text class="order-label">数量（股）</text>
      <input class="order-input" type="number" placeholder="请输入数量" bindinput="onOrderSharesInput" />
    </view>
    <view wx:if="{{orderShares > 0 && orderPrice > 0}}" class="order-total">
      <text>{{orderType === 'buy' ? '应付' : '应收'}}: {{(orderPrice * orderShares).toFixed(2)}} 元</text>
    </view>
    <button class="primary-btn" bindtap="onSubmitOrder">{{orderType === 'buy' ? '确认买入' : '确认卖出'}}</button>
  </view>
</view>
```

- [ ] **Step 3: Write simulation.wxss**

```css
@import '/styles/design-tokens.wxss';

.page { padding: var(--space-lg); min-height: 100vh; padding-bottom: 40px; }

.asset-card {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  border-radius: var(--radius-card);
  padding: var(--space-xl);
  margin-bottom: var(--space-md);
  color: #fff;
}
.asset-label { font-size: var(--font-caption); opacity: 0.8; display: block; }
.asset-value { font-size: 36px; font-weight: 700; display: block; margin: var(--space-xs) 0; }
.asset-sub-row { display: flex; justify-content: space-between; margin-top: var(--space-sm); }
.asset-sub { font-size: var(--font-caption); opacity: 0.9; }
.profit-up { color: #34C759; }
.profit-down { color: #FF3B30; }

.section { background: var(--color-card); border-radius: var(--radius-card); padding: var(--space-lg); margin-bottom: var(--space-md); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
.section-title { font-size: var(--font-headline); font-weight: 600; color: var(--color-text-primary); }
.section-action { font-size: var(--font-body); color: var(--color-primary); }
.cancel-link { font-size: var(--font-body); color: var(--color-text-secondary); }

.empty { padding: 24px 0; text-align: center; }
.empty-text { font-size: var(--font-body); color: var(--color-text-secondary); }

.holding-item { display: flex; justify-content: space-between; padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-bg); }
.holding-item:last-child { border-bottom: none; }
.holding-info { flex: 1; }
.holding-name { font-size: var(--font-body); font-weight: 600; color: var(--color-text-primary); display: block; }
.holding-code { font-size: var(--font-small); color: var(--color-text-secondary); }
.holding-detail { font-size: var(--font-small); color: var(--color-text-secondary); display: block; }
.holding-right { text-align: right; }
.holding-price { font-size: var(--font-body); font-weight: 600; color: var(--color-text-primary); display: block; }
.holding-pnl { font-size: var(--font-small); display: block; margin-bottom: 4px; }
.sell-btn { font-size: var(--font-small); padding: 2px 8px; background: #FF3B30; color: #fff; border-radius: 4px; }

.search-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
.search-bar { display: flex; gap: var(--space-sm); margin-bottom: var(--space-md); }
.search-input { flex: 1; background: var(--color-bg); border-radius: 8px; padding: 8px 12px; font-size: var(--font-body); }
.search-btn { flex-shrink: 0; }
.search-item { padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-bg); }
.search-item:last-child { border-bottom: none; }
.search-name { font-size: var(--font-body); font-weight: 600; color: var(--color-text-primary); display: block; }
.search-code { font-size: var(--font-small); color: var(--color-text-secondary); }

.order-info { margin-bottom: var(--space-md); }
.order-code { font-size: var(--font-small); color: var(--color-text-secondary); display: block; }
.order-price { font-size: var(--font-headline); font-weight: 600; color: var(--color-primary); display: block; margin-top: 4px; }
.order-max { font-size: var(--font-caption); color: var(--color-text-secondary); }
.order-input-row { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md); }
.order-label { font-size: var(--font-body); color: var(--color-text-primary); white-space: nowrap; }
.order-input { flex: 1; background: var(--color-bg); border-radius: 8px; padding: 8px 12px; font-size: var(--font-body); }
.order-total { padding: var(--space-sm) 0; text-align: right; font-size: var(--font-body); font-weight: 600; color: var(--color-text-primary); }

.primary-btn {
  width: 100%;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-button);
  font-size: var(--font-body);
  padding: 10px;
}

.profit-up { color: #34C759; }
.profit-down { color: #FF3B30; }
```

- [ ] **Step 4: Write simulation.json**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "投资模拟盘",
  "enablePullDownRefresh": true
}
```

### Task 14: Create calculator page

**Files:**
- Create: `miniprogram/pages/calculator/calculator.js`
- Create: `miniprogram/pages/calculator/calculator.wxml`
- Create: `miniprogram/pages/calculator/calculator.wxss`
- Create: `miniprogram/pages/calculator/calculator.json`

- [ ] **Step 1: Write calculator.js**

```javascript
Page({
  data: {
    tab: 'compound', // compound | dca | loan

    // Compound interest
    principal: '', annualRate: '', years: '',
    compoundResult: null,

    // DCA
    dcaAmount: '', dcaRate: '', dcaYears: '',
    dcaResult: null,

    // Loan
    loanAmount: '', loanRate: '', loanMonths: '',
    loanResult: null,
  },

  onTabChange(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  // Compound: FV = P * (1 + r)^n
  onCalcCompound() {
    const P = parseFloat(this.data.principal);
    const r = parseFloat(this.data.annualRate) / 100;
    const n = parseInt(this.data.years);
    if (!P || !r || !n || P <= 0 || r <= 0 || n <= 0) {
      wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return;
    }
    const FV = P * Math.pow(1 + r, n);
    this.setData({
      compoundResult: { finalAmount: FV.toFixed(2), profit: (FV - P).toFixed(2) }
    });
  },

  // DCA: FV = A * ((1+r)^n - 1) / r  (annual contribution, compounded yearly)
  onCalcDCA() {
    const A = parseFloat(this.data.dcaAmount) * 12; // yearly
    const r = parseFloat(this.data.dcaRate) / 100;
    const n = parseInt(this.data.dcaYears);
    if (!A || !r || !n || A <= 0 || r <= 0 || n <= 0) {
      wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return;
    }
    const FV = A * (Math.pow(1 + r, n) - 1) / r;
    const totalInvested = A * n;
    this.setData({
      dcaResult: { finalAmount: FV.toFixed(2), totalInvested: totalInvested.toFixed(2), profit: (FV - totalInvested).toFixed(2) }
    });
  },

  // Loan: monthly = P * r * (1+r)^n / ((1+r)^n - 1)
  onCalcLoan() {
    const P = parseFloat(this.data.loanAmount);
    const r = parseFloat(this.data.loanRate) / 100 / 12; // monthly rate
    const n = parseInt(this.data.loanMonths);
    if (!P || !r || !n || P <= 0 || r <= 0 || n <= 0) {
      wx.showToast({ title: '请填写完整有效的数据', icon: 'none' }); return;
    }
    const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const total = monthly * n;
    this.setData({
      loanResult: { monthly: monthly.toFixed(2), totalPayment: total.toFixed(2), interest: (total - P).toFixed(2) }
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 理财计算器', path: '/pages/calculator/calculator' };
  },
});
```

- [ ] **Step 2: Write calculator.wxml**

```html
<view class="page">
  <view class="tabs">
    <view class="tab {{tab === 'compound' ? 'active' : ''}}" data-tab="compound" bindtap="onTabChange">复利</view>
    <view class="tab {{tab === 'dca' ? 'active' : ''}}" data-tab="dca" bindtap="onTabChange">定投</view>
    <view class="tab {{tab === 'loan' ? 'active' : ''}}" data-tab="loan" bindtap="onTabChange">贷款</view>
  </view>

  <!-- Compound Interest -->
  <view class="calc-body" wx:if="{{tab === 'compound'}}">
    <view class="form">
      <view class="field">
        <text class="field-label">本金（元）</text>
        <input class="field-input" type="digit" placeholder="例如 100000" value="{{principal}}" bindinput="onFieldInput" data-field="principal" />
      </view>
      <view class="field">
        <text class="field-label">年化收益率（%）</text>
        <input class="field-input" type="digit" placeholder="例如 8" value="{{annualRate}}" bindinput="onFieldInput" data-field="annualRate" />
      </view>
      <view class="field">
        <text class="field-label">投资年限</text>
        <input class="field-input" type="number" placeholder="例如 10" value="{{years}}" bindinput="onFieldInput" data-field="years" />
      </view>
      <button class="primary-btn" bindtap="onCalcCompound">计算</button>
    </view>
    <view class="result" wx:if="{{compoundResult}}">
      <view class="result-item"><text class="result-label">最终本息合计</text><text class="result-value">{{compoundResult.finalAmount}} 元</text></view>
      <view class="result-item"><text class="result-label">总收益</text><text class="result-value profit-up">{{compoundResult.profit}} 元</text></view>
    </view>
  </view>

  <!-- DCA -->
  <view class="calc-body" wx:if="{{tab === 'dca'}}">
    <view class="form">
      <view class="field">
        <text class="field-label">每月定投金额（元）</text>
        <input class="field-input" type="digit" placeholder="例如 1000" value="{{dcaAmount}}" bindinput="onFieldInput" data-field="dcaAmount" />
      </view>
      <view class="field">
        <text class="field-label">年化收益率（%）</text>
        <input class="field-input" type="digit" placeholder="例如 8" value="{{dcaRate}}" bindinput="onFieldInput" data-field="dcaRate" />
      </view>
      <view class="field">
        <text class="field-label">定投年限</text>
        <input class="field-input" type="number" placeholder="例如 10" value="{{dcaYears}}" bindinput="onFieldInput" data-field="dcaYears" />
      </view>
      <button class="primary-btn" bindtap="onCalcDCA">计算</button>
    </view>
    <view class="result" wx:if="{{dcaResult}}">
      <view class="result-item"><text class="result-label">总投入</text><text class="result-value">{{dcaResult.totalInvested}} 元</text></view>
      <view class="result-item"><text class="result-label">最终市值</text><text class="result-value">{{dcaResult.finalAmount}} 元</text></view>
      <view class="result-item"><text class="result-label">总收益</text><text class="result-value profit-up">{{dcaResult.profit}} 元</text></view>
    </view>
  </view>

  <!-- Loan -->
  <view class="calc-body" wx:if="{{tab === 'loan'}}">
    <view class="form">
      <view class="field">
        <text class="field-label">贷款总额（元）</text>
        <input class="field-input" type="digit" placeholder="例如 1000000" value="{{loanAmount}}" bindinput="onFieldInput" data-field="loanAmount" />
      </view>
      <view class="field">
        <text class="field-label">年利率（%）</text>
        <input class="field-input" type="digit" placeholder="例如 4.5" value="{{loanRate}}" bindinput="onFieldInput" data-field="loanRate" />
      </view>
      <view class="field">
        <text class="field-label">还款月数</text>
        <input class="field-input" type="number" placeholder="例如 360" value="{{loanMonths}}" bindinput="onFieldInput" data-field="loanMonths" />
      </view>
      <button class="primary-btn" bindtap="onCalcLoan">计算</button>
    </view>
    <view class="result" wx:if="{{loanResult}}">
      <view class="result-item"><text class="result-label">每月还款</text><text class="result-value">{{loanResult.monthly}} 元</text></view>
      <view class="result-item"><text class="result-label">还款总额</text><text class="result-value">{{loanResult.totalPayment}} 元</text></view>
      <view class="result-item"><text class="result-label">总利息</text><text class="result-value profit-down">{{loanResult.interest}} 元</text></view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: Write calculator.wxss**

```css
@import '/styles/design-tokens.wxss';

.page { padding: var(--space-lg); min-height: 100vh; }

.tabs { display: flex; gap: 0; margin-bottom: var(--space-lg); background: var(--color-card); border-radius: var(--radius-button); overflow: hidden; }
.tab { flex: 1; text-align: center; padding: 10px; font-size: var(--font-body); color: var(--color-text-secondary); }
.tab.active { background: var(--color-primary); color: #fff; }

.calc-body { background: var(--color-card); border-radius: var(--radius-card); padding: var(--space-lg); }

.form { margin-bottom: var(--space-lg); }
.field { margin-bottom: var(--space-md); }
.field-label { font-size: var(--font-caption); color: var(--color-text-secondary); display: block; margin-bottom: 4px; }
.field-input { width: 100%; background: var(--color-bg); border-radius: 8px; padding: 10px 12px; font-size: var(--font-body); box-sizing: border-box; }

.primary-btn {
  width: 100%;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-button);
  font-size: var(--font-body);
  padding: 10px;
  margin-top: var(--space-md);
}

.result { border-top: 1px solid var(--color-bg); padding-top: var(--space-md); }
.result-item { display: flex; justify-content: space-between; padding: var(--space-sm) 0; }
.result-label { font-size: var(--font-body); color: var(--color-text-secondary); }
.result-value { font-size: var(--font-body); font-weight: 600; color: var(--color-text-primary); }
.profit-up { color: #34C759; }
.profit-down { color: #FF3B30; }
```

- [ ] **Step 4: Add field input handler to calculator.js**

The WXML references `onFieldInput` — add this method to the JS:
```javascript
onFieldInput(e) {
  const { field } = e.currentTarget.dataset;
  this.setData({ [field]: e.detail.value });
},
```

- [ ] **Step 5: Write calculator.json**

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "理财计算器"
}
```

### Task 15: Update mine page

**Files:**
- Modify: `miniprogram/pages/mine/mine.js`
- Modify: `miniprogram/pages/mine/mine.wxml`
- Modify: `miniprogram/pages/mine/mine.wxss`

- [ ] **Step 1: Update mine.js**

Remove `getMenuIconUris` import (or keep it for updated icons). Replace menu items:

```javascript
Page({
  data: {
    userInfo: {},
    menuItems: [],
    simOverview: null,
  },

  onLoad() {
    this.setData({
      menuItems: [
        { key: 'simulation', label: '我的模拟盘', icon: '' },
        { key: 'calculator', label: '理财计算器', icon: '' },
      ],
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadProfile();
    this.loadSimOverview();
  },

  loadProfile() {
    wx.cloud.callFunction({ name: 'getUserProfile' }).then((res) => {
      this.setData({ userInfo: res.result.user || {} });
    }).catch(console.error);
  },

  loadSimOverview() {
    wx.cloud.callFunction({ name: 'getSimulation' }).then((res) => {
      if (res.result.success && res.result.data) {
        const sim = res.result.data;
        if (sim.holdings && sim.holdings.length) {
          // Get live prices
          const codes = sim.holdings.map(h => h.code);
          wx.cloud.callFunction({ name: 'getStockPrice', data: { codes } }).then((priceRes) => {
            if (priceRes.result.success) {
              const priceMap = {};
              priceRes.result.data.forEach(p => priceMap[p.code] = p.price);
              let marketValue = 0, totalCost = 0;
              sim.holdings.forEach(h => {
                const p = priceMap[h.code] || h.costPrice;
                marketValue += p * h.shares;
                totalCost += h.costPrice * h.shares;
              });
              this.setData({
                simOverview: {
                  totalAssets: (sim.cash + marketValue).toFixed(2),
                  totalProfit: (marketValue - totalCost).toFixed(2),
                  totalProfitPercent: totalCost > 0 ? ((marketValue - totalCost) / totalCost * 100).toFixed(2) : '0.00',
                }
              });
            }
          });
        } else {
          this.setData({ simOverview: { totalAssets: sim.cash, totalProfit: '0.00', totalProfitPercent: '0.00' } });
        }
      }
    }).catch(() => {});
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    wx.showLoading({ title: '上传中' });
    wx.cloud.uploadFile({
      cloudPath: 'avatars/' + Date.now() + '.png',
      filePath: avatarUrl,
    }).then((uploadRes) => {
      wx.hideLoading();
      return wx.cloud.callFunction({
        name: 'getUserProfile',
        data: { avatar: uploadRes.fileID },
      });
    }).then(() => {
      this.setData({ 'userInfo.avatar': avatarUrl });
    }).catch((err) => {
      wx.hideLoading();
      console.error('头像上传失败:', err);
      wx.showToast({ title: '头像上传失败', icon: 'none' });
    });
  },

  onNicknameBlur(e) {
    const nickname = e.detail.value;
    if (!nickname || nickname === this.data.userInfo.nickname) return;
    wx.cloud.callFunction({
      name: 'getUserProfile',
      data: { nickname },
    }).then(() => {
      this.setData({ 'userInfo.nickname': nickname });
    }).catch(console.error);
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'simulation') {
      wx.navigateTo({ url: '/pages/simulation/simulation' });
    } else if (key === 'calculator') {
      wx.navigateTo({ url: '/pages/calculator/calculator' });
    }
  },

  onRefreshLogin() {
    wx.showLoading({ title: '登录中' });
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading();
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
          return;
        }
        wx.cloud.callFunction({
          name: 'login',
          data: { code: loginRes.code },
        }).then((res) => {
          wx.hideLoading();
          if (res && res.result && res.result.user) {
            this.setData({ userInfo: res.result.user });
            wx.showToast({ title: '登录成功', icon: 'success' });
          } else {
            wx.showModal({
              title: '登录未完成',
              content: '请确保 login 云函数已部署',
              showCancel: false,
            });
          }
        }).catch((err) => {
          wx.hideLoading();
          console.error('登录失败:', err);
          wx.showModal({
            title: '登录失败',
            content: '错误: ' + (err.errMsg || err.message || JSON.stringify(err)),
            showCancel: false,
          });
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('wx.login 失败:', err);
        wx.showToast({ title: '微信登录调用失败', icon: 'none' });
      },
    });
  },

  onShareAppMessage() {
    return { title: 'QPP - 你的智能理财助手', path: '/pages/index/index' };
  },
});
```

- [ ] **Step 2: Update mine.wxml**

Replace the menu list section with the new menu items, and add simulation overview card:

```html
<view class="page">
  <view class="profile-card">
    <button class="avatar-btn" open-type="chooseAvatar" bindchooseavatar="onChooseAvatar">
      <image wx:if="{{userInfo.avatar}}" class="avatar" src="{{userInfo.avatar}}" mode="aspectFill" />
      <view wx:else class="avatar avatar-placeholder">
        <text class="avatar-text">{{userInfo.nickname ? userInfo.nickname[0] : '用'}}</text>
      </view>
    </button>
    <view class="profile-info">
      <input class="nickname-input" type="nickname" value="{{userInfo.nickname}}" placeholder="点击设置昵称" bindblur="onNicknameBlur" />
      <text class="investor-type" wx:if="{{userInfo.investorType}}">{{userInfo.investorType}}</text>
      <text class="investor-type empty" wx:else>未测评</text>
    </view>
  </view>

  <view class="risk-card" wx:if="{{userInfo.riskScore}}">
    <text class="risk-label">风险评分</text>
    <view class="risk-value-row">
      <text class="risk-value">{{userInfo.riskScore}}</text>
      <text class="risk-unit">分</text>
    </view>
    <view class="risk-bar">
      <view class="risk-fill" style="width: {{userInfo.riskScore}}%;"></view>
    </view>
    <view class="risk-range">
      <text>保守</text>
      <text>稳健</text>
      <text>进取</text>
    </view>
  </view>

  <view class="sim-summary-card" wx:if="{{simOverview}}">
    <view class="sim-summary-row">
      <view class="sim-summary-item">
        <text class="sim-summary-value">{{simOverview.totalAssets}}</text>
        <text class="sim-summary-label">模拟总资产</text>
      </view>
      <view class="sim-summary-item">
        <text class="sim-summary-value {{simOverview.totalProfit >= 0 ? 'profit-up' : 'profit-down'}}">{{simOverview.totalProfit >= 0 ? '+' : ''}}{{simOverview.totalProfit}}</text>
        <text class="sim-summary-label">总盈亏</text>
      </view>
    </view>
  </view>

  <view class="menu-list">
    <view class="menu-item" wx:for="{{menuItems}}" wx:key="key" bindtap="onMenuTap" data-key="{{item.key}}">
      <text class="menu-label">{{item.label}}</text>
      <text class="arrow">›</text>
    </view>
  </view>

  <view class="login-footer">
    <text class="login-link" bindtap="onRefreshLogin">重新登录</text>
  </view>
</view>
```

- [ ] **Step 3: Update mine.wxss — add simulation summary card styles**

Add after the `risk-range` rule:

```css
.sim-summary-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-md);
}
.sim-summary-row { display: flex; gap: var(--space-lg); }
.sim-summary-item { flex: 1; }
.sim-summary-value { font-size: 20px; font-weight: 700; color: var(--color-text-primary); display: block; }
.sim-summary-label { font-size: var(--font-small); color: var(--color-text-secondary); }
```

- [ ] **Step 4: Remove getMenuIconUris import and icon references from mine.js**

Since we no longer use custom icons in the menu (just text + arrow), the `getMenuIconUris` import can be removed. The icons.js file still needs to be updated for the tab bar (Task 9) but menu icon URIs are no longer needed in mine.js.

### Task 16: Final integration — verify and commit

- [ ] **Step 1: Verify app.json page paths are correct**

All pages in `miniprogram/app.json` should be:
- `pages/index/index`
- `pages/quiz/quiz`
- `pages/quiz-result/quiz-result`
- `pages/invest/invest`
- `pages/simulation/simulation`
- `pages/calculator/calculator`
- `pages/mine/mine`

- [ ] **Step 2: Verify custom-tab-bar selected indices**

Tab 0: index (市场), Tab 1: invest (投资), Tab 2: mine (我的)

- [ ] **Step 3: Verify quiz.js navigates to quiz-result with correct params**

Check that the quiz completion handler passes `type`, `score`, and `allocation` to quiz-result.

- [ ] **Step 4: Commit all changes**

```bash
git add -A
git commit -m "feat: remove community, add investment simulation and financial calculator"
```

---

## Post-Implementation Notes

1. **Deploy all 5 new cloud functions** via WeChat DevTools (right-click each → "Upload and Deploy: Install Dependencies in Cloud").
2. **Create `simulations` collection** in Cloud Development console. Permission: "Creator only" (仅创建者可读写).
3. **Delete old database collections** (posts, comments, likes, favorites) from Cloud Development console if desired.
4. **Test flow**: Quiz → quiz-result → init simulation → simulation page → buy/sell → mine page overview.
