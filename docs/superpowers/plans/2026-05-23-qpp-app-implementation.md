# QPP App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WeChat Mini Program for personal finance — risk assessment questionnaire, asset allocation display, and lightweight investment community.

**Architecture:** WeChat Mini Program frontend (WXML + WXSS + JS) with WeChat Cloud Development backend (cloud database for user/assessment/post/comment data, cloud storage for images, cloud functions for login, content check, and CRUD operations).

**Tech Stack:** WeChat Mini Program native framework, WeChat Cloud Development (serverless), SVG inline icons.

**Source spec:** `docs/superpowers/specs/2026-05-23-qpp-app-design.md`

---

## File Structure Map

```
qpp-miniprogram/
├── miniprogram/
│   ├── app.js                          # App lifecycle, global data
│   ├── app.json                        # Window config, tabBar, page routes
│   ├── app.wxss                        # Global styles, design tokens
│   ├── styles/
│   │   └── design-tokens.wxss          # CSS variables: colors, spacing, fonts
│   ├── utils/
│   │   ├── icons.js                    # SVG icon strings (5 tab icons + asset pie)
│   │   ├── quiz-data.js               # Question bank (10 questions, 4 options each)
│   │   └── api.js                      # Cloud function call wrappers
│   ├── components/
│   │   ├── post-card/                  # Reusable post card for feed
│   │   │   ├── post-card.wxml
│   │   │   ├── post-card.wxss
│   │   │   ├── post-card.js
│   │   │   └── post-card.json
│   │   └── allocation-bar/             # Single allocation row bar
│   │       ├── allocation-bar.wxml
│   │       ├── allocation-bar.wxss
│   │       ├── allocation-bar.js
│   │       └── allocation-bar.json
│   ├── pages/
│   │   ├── index/                      # Tab 1: Home
│   │   ├── quiz/                       # Tab 2: Questionnaire
│   │   ├── quiz-result/               # Sub-page: Assessment result
│   │   ├── feed/                       # Tab 3: Community feed
│   │   ├── post-create/               # Sub-page: Create post
│   │   ├── post-detail/               # Sub-page: Post + comments
│   │   └── mine/                       # Tab 4: Profile
│   └── images/                         # Tab bar icon PNGs (placeholder)
├── cloudfunctions/
│   ├── login/                          # wx.login → openid
│   ├── contentCheck/                   # security.msgSecCheck
│   ├── getPosts/                       # List posts with user info
│   ├── createPost/                     # Create post + content check
│   ├── toggleLike/                     # Like/unlike a post
│   ├── getComments/                    # List comments for a post
│   ├── createComment/                  # Add comment
│   ├── saveAssessment/                 # Save quiz result
│   ├── getAssessments/                 # Get user's quiz history
│   └── getUserProfile/                 # Get/update user profile
└── project.config.json                 # Mini program project config
```

---

### Task 1: Project Scaffolding & Design Tokens

**Files:**
- Create: `miniprogram/app.js`, `miniprogram/app.json`, `miniprogram/app.wxss`
- Create: `miniprogram/styles/design-tokens.wxss`
- Create: `project.config.json`

- [ ] **Step 1: Create project.config.json**

```json
{
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.6.0",
  "appid": "YOUR_APPID_HERE",
  "projectname": "qpp"
}
```

- [ ] **Step 2: Create design tokens WXSS**

```css
/* miniprogram/styles/design-tokens.wxss */
page {
  --color-primary: #007AFF;
  --color-primary-dark: #0056CC;
  --color-bg: #F2F2F7;
  --color-card: #FFFFFF;
  --color-text-primary: #000000;
  --color-text-body: #3C3C43;
  --color-text-secondary: #8E8E93;
  --color-border: #E5E5EA;
  --color-success: #34C759;

  --font-title: 28px;
  --font-headline: 17px;
  --font-body: 14px;
  --font-caption: 12px;
  --font-small: 10px;

  --radius-card: 12px;
  --radius-button: 10px;
  --radius-tag: 8px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;

  background-color: var(--color-bg);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  color: var(--color-text-body);
  font-size: var(--font-body);
}
```

- [ ] **Step 3: Create app.js with cloud init**

```javascript
// miniprogram/app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'YOUR_ENV_ID',
        traceUser: true,
      });
    }
  },

  globalData: {
    userInfo: null,
    openid: null,
  },
});
```

- [ ] **Step 4: Create app.json with tabBar config**

```json
{
  "pages": [
    "pages/index/index",
    "pages/quiz/quiz",
    "pages/quiz-result/quiz-result",
    "pages/feed/feed",
    "pages/post-create/post-create",
    "pages/post-detail/post-detail",
    "pages/mine/mine"
  ],
  "window": {
    "navigationBarTitleText": "QPP",
    "navigationBarBackgroundColor": "#F2F2F7",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F2F2F7"
  },
  "tabBar": {
    "color": "#8E8E93",
    "selectedColor": "#007AFF",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/quiz/quiz",
        "text": "测评"
      },
      {
        "pagePath": "pages/feed/feed",
        "text": "社区"
      },
      {
        "pagePath": "pages/mine/mine",
        "text": "我的"
      }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 5: Commit**

```bash
git add project.config.json miniprogram/
git commit -m "feat: scaffold project with design tokens and tab bar config"
```

---

### Task 2: SVG Icon System

**Files:**
- Create: `miniprogram/utils/icons.js`

- [ ] **Step 1: Create icon utility with all 5 tab icons**

```javascript
// miniprogram/utils/icons.js

/**
 * SVG icon definitions. Each returns raw SVG markup.
 * selected=true returns filled variant, false returns stroked outline.
 */

const icons = {
  home: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`;
  },

  quiz: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/></svg>`;
  },

  feed: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>`;
  },

  mine: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/></svg>`;
  },

  /** Pie chart icon. segments = [{pct: 40, color: '#007AFF'}, ...] */
  allocation: (selected, segments) => {
    const strokeColor = selected ? '#007AFF' : '#8E8E93';
    if (!segments || segments.length === 0) {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`;
    }
    const slices = buildPieSlices(segments);
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="1.5">${slices}</svg>`;
  },
};

function buildPieSlices(segments) {
  const cx = 12, cy = 12, r = 9;
  let startAngle = -Math.PI / 2;
  let paths = '';
  for (const seg of segments) {
    const sliceAngle = (seg.pct / 100) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    paths += `<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${seg.color}" stroke="${seg.color}" stroke-width="0.5"/>`;
    startAngle = endAngle;
  }
  return paths;
}

module.exports = { icons };
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/utils/icons.js
git commit -m "feat: add SVG icon system with dynamic pie chart"
```

---

### Task 3: Question Bank Data

**Files:**
- Create: `miniprogram/utils/quiz-data.js`

- [ ] **Step 1: Define the 10-question bank**

```javascript
// miniprogram/utils/quiz-data.js

const questions = [
  {
    id: 1,
    dimension: 'risk',
    text: '市场下跌 20% 的情况下，你最接近哪种反应？',
    options: [
      { label: 'A', text: '立即全部卖出，规避进一步损失', score: 1 },
      { label: 'B', text: '先卖出一半，观察后续走势', score: 2 },
      { label: 'C', text: '分析下跌原因后再做决定', score: 3 },
      { label: 'D', text: '继续持有，考虑分批加仓', score: 4 },
    ],
  },
  {
    id: 2,
    dimension: 'risk',
    text: '你最多能接受一年的投资亏损是多少？',
    options: [
      { label: 'A', text: '完全不能接受亏损', score: 1 },
      { label: 'B', text: '5% 以内', score: 2 },
      { label: 'C', text: '10%-20%', score: 3 },
      { label: 'D', text: '20% 以上，追求高回报', score: 4 },
    ],
  },
  {
    id: 3,
    dimension: 'knowledge',
    text: '你对以下哪种投资产品最了解？',
    options: [
      { label: 'A', text: '银行存款和货币基金', score: 1 },
      { label: 'B', text: '债券和固收类产品', score: 2 },
      { label: 'C', text: '股票和指数基金', score: 3 },
      { label: 'D', text: '期货、期权等衍生品', score: 4 },
    ],
  },
  {
    id: 4,
    dimension: 'knowledge',
    text: '你关注财经新闻和市场的频率是？',
    options: [
      { label: 'A', text: '几乎不关注', score: 1 },
      { label: 'B', text: '偶尔看到相关新闻', score: 2 },
      { label: 'C', text: '每周主动了解', score: 3 },
      { label: 'D', text: '每天保持跟踪', score: 4 },
    ],
  },
  {
    id: 5,
    dimension: 'liquidity',
    text: '你投入的这笔资金，预计多久不需要动用？',
    options: [
      { label: 'A', text: '随时可能需要', score: 1 },
      { label: 'B', text: '6 个月到 1 年', score: 2 },
      { label: 'C', text: '1 到 3 年', score: 3 },
      { label: 'D', text: '3 年以上', score: 4 },
    ],
  },
  {
    id: 6,
    dimension: 'liquidity',
    text: '如果急需用钱，你会动用投资资金吗？',
    options: [
      { label: 'A', text: '没有其他来源，只能靠投资资金', score: 1 },
      { label: 'B', text: '有一部分应急储备', score: 2 },
      { label: 'C', text: '有较充足的应急储备', score: 3 },
      { label: 'D', text: '应急储备充足，投资和日常完全分开', score: 4 },
    ],
  },
  {
    id: 7,
    dimension: 'term',
    text: '你理想的投资周期是？',
    options: [
      { label: 'A', text: '短期获利，几天到几周', score: 1 },
      { label: 'B', text: '几个月到半年', score: 2 },
      { label: 'C', text: '1 到 3 年的中长期', score: 3 },
      { label: 'D', text: '5 年以上长期持有', score: 4 },
    ],
  },
  {
    id: 8,
    dimension: 'term',
    text: '看到朋友短期赚了钱，你会？',
    options: [
      { label: 'A', text: '立刻跟进买入', score: 1 },
      { label: 'B', text: '先了解再小仓位试试', score: 2 },
      { label: 'C', text: '不受影响，坚持自己的策略', score: 3 },
      { label: 'D', text: '分析朋友的操作逻辑后再评估', score: 4 },
    ],
  },
  {
    id: 9,
    dimension: 'risk',
    text: '哪种投资结果最让你难受？',
    options: [
      { label: 'A', text: '亏损本金', score: 1 },
      { label: 'B', text: '跑输通胀', score: 2 },
      { label: 'C', text: '跑输大盘', score: 3 },
      { label: 'D', text: '错过别人赚到的机会', score: 4 },
    ],
  },
  {
    id: 10,
    dimension: 'knowledge',
    text: '你对"分散投资"的理解是？',
    options: [
      { label: 'A', text: '不太清楚是什么意思', score: 1 },
      { label: 'B', text: '知道概念，但不知道具体怎么做', score: 2 },
      { label: 'C', text: '了解基本方法，正在实践', score: 3 },
      { label: 'D', text: '有系统的资产配置策略', score: 4 },
    ],
  },
];

/**
 * Calculate assessment result from answers.
 * answers: [{questionId, selectedScore}, ...]
 */
function calculateResult(answers) {
  const dimScores = { risk: 0, knowledge: 0, liquidity: 0, term: 0 };
  const dimCounts = { risk: 0, knowledge: 0, liquidity: 0, term: 0 };

  for (const a of answers) {
    const q = questions.find((q) => q.id === a.questionId);
    if (q) {
      dimScores[q.dimension] += a.selectedScore;
      dimCounts[q.dimension] += 1;
    }
  }

  // Normalize each dimension to 0-100
  const maxPerDim = 4; // max score per question
  const dimensions = {};
  for (const dim of Object.keys(dimScores)) {
    const raw = dimScores[dim];
    const max = dimCounts[dim] * maxPerDim;
    const min = dimCounts[dim] * 1;
    dimensions[dim] = Math.round(((raw - min) / (max - min)) * 100);
  }

  // Overall risk score: weighted average
  const overall = Math.round(
    Object.values(dimensions).reduce((s, v) => s + v, 0) /
      Object.keys(dimensions).length
  );

  // Determine investor type
  let investorType;
  if (overall <= 33) investorType = '保守型';
  else if (overall <= 66) investorType = '稳健型';
  else investorType = '进取型';

  // Suggest allocation based on type
  const allocations = {
    '保守型': [
      { name: '货币基金', pct: 50, color: '#007AFF' },
      { name: '债券基金', pct: 30, color: '#5856D6' },
      { name: '指数基金', pct: 10, color: '#FF9500' },
      { name: '现金储备', pct: 10, color: '#FF3B30' },
    ],
    '稳健型': [
      { name: '货币基金', pct: 30, color: '#007AFF' },
      { name: '指数基金', pct: 40, color: '#FF9500' },
      { name: '债券基金', pct: 20, color: '#5856D6' },
      { name: '现金储备', pct: 10, color: '#FF3B30' },
    ],
    '进取型': [
      { name: '指数基金', pct: 50, color: '#FF9500' },
      { name: '货币基金', pct: 15, color: '#007AFF' },
      { name: '债券基金', pct: 20, color: '#5856D6' },
      { name: '现金储备', pct: 15, color: '#FF3B30' },
    ],
  };

  const expectedVolatility = {
    '保守型': '2% - 5%',
    '稳健型': '5% - 10%',
    '进取型': '10% - 20%',
  };

  return {
    dimensions,
    riskScore: overall,
    investorType,
    allocation: allocations[investorType],
    expectedVolatility: expectedVolatility[investorType],
  };
}

module.exports = { questions, calculateResult };
```

- [ ] **Step 2: Commit**

```bash
git add miniprogram/utils/quiz-data.js
git commit -m "feat: add question bank and scoring algorithm"
```

---

### Task 4: Tab Bar Icon Assets

**Files:**
- Create: `miniprogram/pages/index/index.json`, `index.wxml`, `index.wxss`, `index.js`
- Create: `miniprogram/pages/quiz/quiz.json`, `quiz.wxml`, `quiz.wxss`, `quiz.js`
- Create: `miniprogram/pages/feed/feed.json`, `feed.wxml`, `feed.wxss`, `feed.js`
- Create: `miniprogram/pages/mine/mine.json`, `mine.wxml`, `mine.wxss`, `mine.js`

- [ ] **Step 1: Create placeholder pages for all 4 tabs**

```bash
mkdir -p miniprogram/pages/index miniprogram/pages/quiz miniprogram/pages/quiz-result miniprogram/pages/feed miniprogram/pages/post-create miniprogram/pages/post-detail miniprogram/pages/mine
```

- [ ] **Step 2: Create index page — stubbed**

```javascript
// miniprogram/pages/index/index.js
Page({
  data: {
    marketIndex: { name: '上证指数', value: '3,258.63', change: '+0.82%' },
    entries: [
      { type: 'quiz', label: '风险评估', desc: '了解你的投资偏好', icon: 'quiz' },
      { type: 'allocation', label: '资产配置', desc: '查看你的配置方案', icon: 'allocation' },
    ],
    posts: [],
  },
  onLoad() {
    this.fetchPosts();
  },
  fetchPosts() {
    // Stub: will call cloud function in Task 8
    this.setData({ posts: [] });
  },
  onEntryTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'quiz') wx.switchTab({ url: '/pages/quiz/quiz' });
  },
});
```

```html
<!-- miniprogram/pages/index/index.wxml -->
<view class="page">
  <view class="header">
    <text class="title">理财</text>
    <text class="subtitle">今日市场概览</text>
  </view>

  <view class="market-card">
    <view class="market-info">
      <text class="market-name">{{marketIndex.name}}</text>
      <text class="market-value">{{marketIndex.value}}</text>
      <text class="market-change up">{{marketIndex.change}}</text>
    </view>
  </view>

  <view class="entry-grid">
    <view class="entry-card" wx:for="{{entries}}" wx:key="type" bindtap="onEntryTap" data-type="{{item.type}}">
      <text class="entry-label">{{item.label}}</text>
      <text class="entry-desc">{{item.desc}}</text>
    </view>
  </view>

  <view class="section-header">
    <text>社区动态</text>
    <text class="link" bindtap="onViewAll">全部</text>
  </view>

  <view class="post-list">
    <block wx:for="{{posts}}" wx:key="_id">
      <view class="post-preview">...</view>
    </block>
    <view wx:if="{{posts.length === 0}}" class="empty">暂无动态</view>
  </view>
</view>
```

- [ ] **Step 3: Stub the remaining 3 tab pages similarly**

Create `quiz.js`, `quiz.wxml` — stubbed with page structure.
Create `feed.js`, `feed.wxml` — stubbed with page structure.
Create `mine.js`, `mine.wxml` — stubbed with page structure.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/
git commit -m "feat: stub all 4 tab pages with basic structure"
```

---

### Task 5: Cloud Database Setup

**Files:**
- Create: Database collections via cloud console (manual step)
- Create: `miniprogram/utils/api.js`

- [ ] **Step 1: Create api.js with cloud database helpers**

```javascript
// miniprogram/utils/api.js
const db = wx.cloud.database();
const _ = db.command;

/** Get the posts collection */
function getPostsCollection() {
  return db.collection('posts');
}

/** Get the assessments collection */
function getAssessmentsCollection() {
  return db.collection('assessments');
}

/** Get the users collection */
function getUsersCollection() {
  return db.collection('users');
}

/** Get the comments collection */
function getCommentsCollection() {
  return db.collection('comments');
}

/** Call a cloud function by name */
function callFunction(name, data = {}) {
  return wx.cloud.callFunction({ name, data });
}

module.exports = {
  db,
  _,
  getPostsCollection,
  getAssessmentsCollection,
  getUsersCollection,
  getCommentsCollection,
  callFunction,
};
```

- [ ] **Step 2: Create database collections (documented manual step)**

Document these 4 collections to create in WeChat Cloud Console:
- `users` — `_id` (auto), `openid`, `nickname`, `avatar`, `investorType`, `riskScore`, `createdAt`
- `assessments` — `_id` (auto), `userId`, `answers`, `dimensions`, `riskScore`, `investorType`, `allocation`, `createdAt`
- `posts` — `_id` (auto), `userId`, `content`, `images`, `tags`, `likes`, `comments`, `createdAt`
- `comments` — `_id` (auto), `postId`, `userId`, `content`, `createdAt`

Set permission for each: "All users can read, creator can write" or use cloud functions for all access.

- [ ] **Step 3: Commit**

```bash
git add miniprogram/utils/api.js
git commit -m "feat: add cloud database API helpers"
```

---

### Task 6: Login Cloud Function & Auth Flow

**Files:**
- Create: `cloudfunctions/login/index.js`, `cloudfunctions/login/package.json`

- [ ] **Step 1: Create login cloud function**

```json
// cloudfunctions/login/package.json
{
  "name": "login",
  "version": "1.0.0",
  "main": "index.js"
}
```

```javascript
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // Check if user exists
  const user = await db.collection('users').where({ openid }).get();

  if (user.data.length === 0) {
    // Create new user
    await db.collection('users').add({
      data: {
        openid,
        nickname: '',
        avatar: '',
        investorType: '',
        riskScore: 0,
        createdAt: db.serverDate(),
      },
    });
  }

  return {
    openid,
    user: user.data[0] || null,
  };
};
```

- [ ] **Step 2: Wire login into app.js onLaunch**

```javascript
// Update miniprogram/app.js onLaunch to call login after cloud init
onLaunch: function () {
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力');
  } else {
    wx.cloud.init({ env: 'YOUR_ENV_ID', traceUser: true });
  }

  // Login and get openid
  wx.cloud.callFunction({ name: 'login' }).then((res) => {
    this.globalData.openid = res.result.openid;
    this.globalData.userInfo = res.result.user;
  }).catch(console.error);
},
```

- [ ] **Step 3: Commit**

```bash
git add cloudfunctions/login/ miniprogram/app.js
git commit -m "feat: add login cloud function and app-level auth"
```

---

### Task 7: Home Page — Full Implementation

**Files:**
- Modify: `miniprogram/pages/index/index.wxml`, `index.wxss`, `index.js`

- [ ] **Step 1: Build index.wxss with iOS-inspired layout**

```css
/* miniprogram/pages/index/index.wxss */
@import '/styles/design-tokens.wxss';

.page {
  padding: var(--space-lg);
  min-height: 100vh;
}

.header {
  margin-bottom: var(--space-lg);
}

.title {
  font-size: 34px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: var(--font-body);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}

.market-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
}

.market-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.market-name {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
}

.market-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.market-change.up {
  font-size: var(--font-body);
  color: var(--color-success);
}

.entry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.entry-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-lg);
  text-align: center;
}

.entry-label {
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
}

.entry-desc {
  font-size: var(--font-caption);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.link {
  color: var(--color-primary);
  font-size: var(--font-caption);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.post-preview {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: var(--space-md);
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-caption);
  padding: var(--space-xl);
}
```

- [ ] **Step 2: Update index.js to fetch recent posts**

```javascript
// miniprogram/pages/index/index.js
const { getPostsCollection } = require('../../utils/api');

Page({
  data: {
    marketIndex: { name: '上证指数', value: '3,258.63', change: '+0.82%' },
    entries: [
      { type: 'quiz', label: '风险评估', desc: '了解你的投资偏好' },
      { type: 'allocation', label: '资产配置', desc: '查看你的配置方案' },
    ],
    posts: [],
  },

  onShow() {
    this.fetchPosts();
  },

  fetchPosts() {
    getPostsCollection()
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get()
      .then((res) => {
        this.setData({ posts: res.data });
      })
      .catch(console.error);
  },

  onEntryTap(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'quiz') wx.switchTab({ url: '/pages/quiz/quiz' });
  },

  onViewAll() {
    wx.switchTab({ url: '/pages/feed/feed' });
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/index/
git commit -m "feat: implement home page with market card and post preview"
```

---

### Task 8: Quiz Page — Questionnaire Flow

**Files:**
- Modify: `miniprogram/pages/quiz/quiz.wxml`, `quiz.wxss`, `quiz.js`

- [ ] **Step 1: Build quiz.js — question navigation and answer tracking**

```javascript
// miniprogram/pages/quiz/quiz.js
const { questions, calculateResult } = require('../../utils/quiz-data');
const { getAssessmentsCollection } = require('../../utils/api');

Page({
  data: {
    currentIndex: 0,
    totalQuestions: questions.length,
    currentQuestion: null,
    answers: [],
    selectedOption: null,
    progress: 0,
    completed: false,
    result: null,
  },

  onLoad() {
    this.resetQuiz();
  },

  resetQuiz() {
    this.setData({
      currentIndex: 0,
      answers: [],
      selectedOption: null,
      progress: 0,
      completed: false,
      result: null,
      currentQuestion: questions[0],
    });
  },

  onOptionTap(e) {
    const score = e.currentTarget.dataset.score;
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedOption: index });

    // Record answer after brief delay for visual feedback
    setTimeout(() => {
      const answers = [...this.data.answers];
      const existing = answers.findIndex(
        (a) => a.questionId === this.data.currentQuestion.id
      );
      if (existing >= 0) {
        answers[existing] = { questionId: this.data.currentQuestion.id, selectedScore: score };
      } else {
        answers.push({ questionId: this.data.currentQuestion.id, selectedScore: score });
      }
      this.setData({ answers });
      this.nextQuestion();
    }, 200);
  },

  nextQuestion() {
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= questions.length) {
      this.finishQuiz();
    } else {
      const prevAnswer = this.data.answers.find(
        (a) => a.questionId === questions[nextIndex].id
      );
      this.setData({
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        progress: Math.round((nextIndex / questions.length) * 100),
        selectedOption: prevAnswer ? this.findOptionIndex(nextIndex, prevAnswer.selectedScore) : null,
      });
    }
  },

  prevQuestion() {
    if (this.data.currentIndex <= 0) return;
    const prevIndex = this.data.currentIndex - 1;
    const prevAnswer = this.data.answers.find(
      (a) => a.questionId === questions[prevIndex].id
    );
    this.setData({
      currentIndex: prevIndex,
      currentQuestion: questions[prevIndex],
      progress: Math.round((prevIndex / questions.length) * 100),
      selectedOption: prevAnswer ? this.findOptionIndex(prevIndex, prevAnswer.selectedScore) : null,
    });
  },

  findOptionIndex(questionIndex, score) {
    return questions[questionIndex].options.findIndex((o) => o.score === score);
  },

  finishQuiz() {
    const result = calculateResult(this.data.answers);
    this.setData({ completed: true, progress: 100, result });
    this.saveResult(result);
  },

  saveResult(result) {
    getAssessmentsCollection()
      .add({
        data: {
          userId: getApp().globalData.openid,
          answers: this.data.answers,
          dimensions: result.dimensions,
          riskScore: result.riskScore,
          investorType: result.investorType,
          allocation: result.allocation,
          createdAt: new Date(),
        },
      })
      .then(() => console.log('Assessment saved'))
      .catch(console.error);
  },

  onRetake() {
    this.resetQuiz();
  },
});
```

- [ ] **Step 2: Build quiz.wxml — question display with options**

```html
<!-- miniprogram/pages/quiz/quiz.wxml -->
<view class="page">
  <!-- Quiz in progress -->
  <block wx:if="{{!completed}}">
    <view class="quiz-header">
      <text class="progress-label">第 {{currentIndex + 1}} 题 / 共 {{totalQuestions}} 题</text>
      <view class="progress-bar">
        <view class="progress-fill" style="width:{{progress}}%"></view>
      </view>
    </view>

    <view class="question-card">
      <text class="question-text">{{currentQuestion.text}}</text>
    </view>

    <view class="options-list">
      <view
        class="option {{selectedOption === index ? 'selected' : ''}}"
        wx:for="{{currentQuestion.options}}"
        wx:key="label"
        data-score="{{item.score}}"
        data-index="{{index}}"
        bindtap="onOptionTap"
      >
        <text class="option-label">{{item.label}}</text>
        <text class="option-text">{{item.text}}</text>
      </view>
    </view>

    <view class="quiz-nav">
      <text class="nav-btn {{currentIndex === 0 ? 'disabled' : ''}}" bindtap="prevQuestion">上一题</text>
      <text class="nav-btn" bindtap="nextQuestion">跳过</text>
    </view>
  </block>

  <!-- Result display -->
  <block wx:else>
    <view class="result-page">
      <text class="result-type">{{result.investorType}}</text>
      <text class="result-desc">重视资产安全，但愿意为长期收益承担适度风险</text>

      <view class="result-score">
        <text class="score-label">风险评分</text>
        <text class="score-value">{{result.riskScore}}<text class="score-unit">/100</text></text>
      </view>

      <view class="allocation-section">
        <text class="section-title">建议配置</text>
        <view class="allocation-bar" wx:for="{{result.allocation}}" wx:key="name">
          <view class="bar-header">
            <text>{{item.name}}</text>
            <text>{{item.pct}}%</text>
          </view>
          <view class="bar-track">
            <view class="bar-fill" style="width:{{item.pct}}%;background:{{item.color}}"></view>
          </view>
        </view>
      </view>

      <view class="result-meta">
        <text>预期年化波动：{{result.expectedVolatility}}</text>
      </view>

      <button class="retake-btn" bindtap="onRetake">重新测评</button>
    </view>
  </block>
</view>
```

- [ ] **Step 3: Build quiz.wxss**

```css
@import '/styles/design-tokens.wxss';

.page { padding: var(--space-lg); min-height: 100vh; }

.quiz-header { margin-bottom: var(--space-xl); }
.progress-label { font-size: var(--font-caption); color: var(--color-text-secondary); }
.progress-bar { height: 3px; background: var(--color-border); border-radius: 1.5px; margin-top: var(--space-sm); }
.progress-fill { height: 3px; background: var(--color-primary); border-radius: 1.5px; transition: width 0.3s ease; }

.question-card { margin-bottom: var(--space-xl); }
.question-text { font-size: 17px; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }

.options-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.option {
  background: var(--color-card); border-radius: var(--radius-button); padding: var(--space-md);
  border: 1px solid var(--color-border); display: flex; gap: var(--space-sm); align-items: flex-start;
}
.option.selected { background: #EBF2FF; border-color: var(--color-primary); }
.option-label { font-size: var(--font-body); font-weight: 600; color: var(--color-primary); min-width: 20px; }
.option-text { font-size: var(--font-body); color: var(--color-text-body); }

.quiz-nav { display: flex; justify-content: space-between; margin-top: var(--space-lg); }
.nav-btn { font-size: var(--font-body); color: var(--color-primary); }
.nav-btn.disabled { color: var(--color-border); }

/* Result styles */
.result-page { text-align: center; }
.result-type { font-size: 26px; font-weight: 700; color: var(--color-text-primary); display: block; }
.result-desc { font-size: var(--font-body); color: var(--color-text-body); margin-top: var(--space-sm); display: block; line-height: 1.5; }
.result-score { margin: var(--space-xl) 0; padding: var(--space-lg); background: var(--color-card); border-radius: var(--radius-card); }
.score-label { font-size: var(--font-caption); color: var(--color-text-secondary); display: block; }
.score-value { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.score-unit { font-size: 16px; font-weight: 400; }

.allocation-section { background: var(--color-card); border-radius: var(--radius-card); padding: var(--space-lg); margin-bottom: var(--space-md); text-align: left; }
.section-title { font-size: var(--font-caption); color: var(--color-text-secondary); margin-bottom: var(--space-md); display: block; }
.allocation-bar { margin-bottom: var(--space-sm); }
.bar-header { display: flex; justify-content: space-between; font-size: var(--font-body); margin-bottom: var(--space-xs); }
.bar-track { height: 5px; background: var(--color-border); border-radius: 2.5px; }
.bar-fill { height: 5px; border-radius: 2.5px; transition: width 0.5s ease; }

.result-meta { font-size: var(--font-caption); color: var(--color-text-secondary); margin-bottom: var(--space-lg); }
.retake-btn { background: var(--color-primary); color: white; border-radius: var(--radius-button); font-size: var(--font-body); padding: var(--space-md); border: none; }
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/quiz/
git commit -m "feat: implement quiz page with 10-question flow and result display"
```

---

### Task 9: Save Assessment Cloud Function

**Files:**
- Create: `cloudfunctions/saveAssessment/index.js`, `cloudfunctions/saveAssessment/package.json`

- [ ] **Step 1: Create saveAssessment cloud function**

```json
{
  "name": "saveAssessment",
  "version": "1.0.0",
  "main": "index.js"
}
```

```javascript
// cloudfunctions/saveAssessment/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { answers, dimensions, riskScore, investorType, allocation } = event;

  // Save assessment record
  const result = await db.collection('assessments').add({
    data: {
      userId: openid,
      answers,
      dimensions,
      riskScore,
      investorType,
      allocation,
      createdAt: db.serverDate(),
    },
  });

  // Update user profile with latest result
  await db.collection('users').where({ openid }).update({
    data: {
      investorType,
      riskScore,
    },
  });

  return { id: result._id };
};
```

- [ ] **Step 2: Update quiz.js to use cloud function instead of direct DB call**

Replace the `saveResult` method in `quiz.js`:

```javascript
saveResult(result) {
  wx.cloud.callFunction({
    name: 'saveAssessment',
    data: {
      answers: this.data.answers,
      dimensions: result.dimensions,
      riskScore: result.riskScore,
      investorType: result.investorType,
      allocation: result.allocation,
    },
  }).catch(console.error);
},
```

- [ ] **Step 3: Commit**

```bash
git add cloudfunctions/saveAssessment/ miniprogram/pages/quiz/quiz.js
git commit -m "feat: add saveAssessment cloud function with user profile update"
```

---

### Task 10: Community Feed Page

**Files:**
- Modify: `miniprogram/pages/feed/feed.wxml`, `feed.wxss`, `feed.js`
- Create: `miniprogram/components/post-card/post-card.wxml`, `post-card.wxss`, `post-card.js`, `post-card.json`

- [ ] **Step 1: Build post-card component**

```json
// miniprogram/components/post-card/post-card.json
{
  "component": true,
  "usingComponents": {}
}
```

```javascript
// miniprogram/components/post-card/post-card.js
Component({
  properties: {
    post: Object,
  },
  methods: {
    onTap() {
      wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${this.properties.post._id}` });
    },
    onLike() {
      this.triggerEvent('like', { postId: this.properties.post._id });
    },
  },
});
```

```html
<!-- miniprogram/components/post-card/post-card.wxml -->
<view class="post-card" bindtap="onTap">
  <view class="post-header">
    <image class="avatar" src="{{post.userAvatar || '/images/default-avatar.png'}}" mode="aspectFill" />
    <view class="post-meta">
      <text class="user-name">{{post.userName || '用户'}}</text>
      <text class="post-time">{{post.createdAt}}</text>
    </view>
  </view>
  <text class="post-content">{{post.content}}</text>
  <view class="post-images" wx:if="{{post.images && post.images.length}}">
    <image wx:for="{{post.images}}" wx:key="index" src="{{item}}" mode="aspectFill" class="post-image" />
  </view>
  <view class="post-tags" wx:if="{{post.tags && post.tags.length}}">
    <text class="tag" wx:for="{{post.tags}}" wx:key="*this">{{item}}</text>
  </view>
  <view class="post-actions">
    <text class="action" bindtap="onLike">❤ {{post.likes || 0}}</text>
    <text class="action">💬 {{post.comments || 0}}</text>
  </view>
</view>
```

- [ ] **Step 2: Build feed page**

```javascript
// miniprogram/pages/feed/feed.js
const { getPostsCollection } = require('../../utils/api');

Page({
  data: {
    tags: ['理财故事', '每日打卡', '新手问答', '晒收益', '读书笔记'],
    activeTag: '',
    posts: [],
    loading: false,
  },

  onShow() {
    this.fetchPosts();
  },

  fetchPosts() {
    this.setData({ loading: true });
    let query = getPostsCollection().orderBy('createdAt', 'desc').limit(20);
    if (this.data.activeTag) {
      query = query.where({ tags: this.data.activeTag });
    }
    query.get().then((res) => {
      this.setData({ posts: res.data, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ activeTag: this.data.activeTag === tag ? '' : tag });
    this.fetchPosts();
  },

  onCreatePost() {
    wx.navigateTo({ url: '/pages/post-create/post-create' });
  },
});
```

- [ ] **Step 3: Build feed.wxss and feed.wxml**

Include the tag scroll header, post-card list, and a floating create button.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/components/post-card/ miniprogram/pages/feed/
git commit -m "feat: implement feed page with post-card component and tag filter"
```

---

### Task 11: Create Post Flow

**Files:**
- Create: `miniprogram/pages/post-create/post-create.js`, `post-create.wxml`, `post-create.wxss`, `post-create.json`
- Create: `cloudfunctions/createPost/index.js`, `cloudfunctions/createPost/package.json`
- Create: `cloudfunctions/contentCheck/index.js`, `cloudfunctions/contentCheck/package.json`

- [ ] **Step 1: Create contentCheck cloud function**

```javascript
// cloudfunctions/contentCheck/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event) => {
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: event.content,
    });
    return { pass: result.errCode === 0, detail: result };
  } catch (err) {
    // If openapi not configured, allow through (dev mode)
    return { pass: true, devFallback: true };
  }
};
```

- [ ] **Step 2: Create createPost cloud function**

```javascript
// cloudfunctions/createPost/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { content, images, tags } = event;

  // Content safety check
  const checkResult = await cloud.callFunction({
    name: 'contentCheck',
    data: { content },
  });

  if (!checkResult.result.pass) {
    return { success: false, error: '内容不符合安全规范' };
  }

  const result = await db.collection('posts').add({
    data: {
      userId: openid,
      content,
      images: images || [],
      tags: tags || [],
      likes: 0,
      comments: 0,
      createdAt: db.serverDate(),
    },
  });

  return { success: true, id: result._id };
};
```

- [ ] **Step 3: Build post-create page**

```javascript
// miniprogram/pages/post-create/post-create.js
Page({
  data: {
    content: '',
    images: [],
    tags: ['理财故事', '每日打卡', '新手问答', '晒收益', '读书笔记'],
    selectedTags: [],
    maxImages: 9,
  },

  onContentInput(e) { this.setData({ content: e.detail.value }); },

  onChooseImage() {
    const remaining = this.data.maxImages - this.data.images.length;
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ images: [...this.data.images, ...res.tempFilePaths] });
      },
    });
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  onTagToggle(e) {
    const tag = e.currentTarget.dataset.tag;
    let selected = [...this.data.selectedTags];
    const idx = selected.indexOf(tag);
    if (idx >= 0) selected.splice(idx, 1);
    else selected.push(tag);
    this.setData({ selectedTags: selected });
  },

  async onSubmit() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中' });

    // Upload images to cloud storage first
    const imageUrls = [];
    for (const img of this.data.images) {
      const cloudPath = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: img });
      imageUrls.push(uploadRes.fileID);
    }

    const res = await wx.cloud.callFunction({
      name: 'createPost',
      data: {
        content: this.data.content,
        images: imageUrls,
        tags: this.data.selectedTags,
      },
    });

    wx.hideLoading();

    if (res.result.success) {
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } else {
      wx.showToast({ title: res.result.error || '发布失败', icon: 'none' });
    }
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/post-create/ cloudfunctions/createPost/ cloudfunctions/contentCheck/
git commit -m "feat: implement post creation with image upload and content safety check"
```

---

### Task 12: Post Detail & Comments

**Files:**
- Create: `miniprogram/pages/post-detail/post-detail.js`, `post-detail.wxml`, `post-detail.wxss`, `post-detail.json`
- Create: `cloudfunctions/getComments/index.js`, `cloudfunctions/createComment/index.js`

- [ ] **Step 1: Create getComments & createComment cloud functions**

```javascript
// cloudfunctions/getComments/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { postId } = event;
  const res = await db.collection('comments')
    .where({ postId })
    .orderBy('createdAt', 'asc')
    .get();
  return { comments: res.data };
};
```

```javascript
// cloudfunctions/createComment/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const { postId, content } = event;

  const checkResult = await cloud.callFunction({
    name: 'contentCheck', data: { content },
  });
  if (!checkResult.result.pass) {
    return { success: false, error: '评论内容不符合规范' };
  }

  await db.collection('comments').add({
    data: {
      postId,
      userId: wxContext.OPENID,
      content,
      createdAt: db.serverDate(),
    },
  });

  // Increment comment count
  await db.collection('posts').doc(postId).update({
    data: { comments: db.command.inc(1) },
  });

  return { success: true };
};
```

- [ ] **Step 2: Build post-detail page** with post content display, comments list, and a comment input bar at the bottom.

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/post-detail/ cloudfunctions/getComments/ cloudfunctions/createComment/
git commit -m "feat: implement post detail page with comments"
```

---

### Task 13: Like Toggle Cloud Function

**Files:**
- Create: `cloudfunctions/toggleLike/index.js`, `toggleLike/package.json`

- [ ] **Step 1: Create toggleLike cloud function**

```javascript
// cloudfunctions/toggleLike/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { postId } = event;

  // Check if user already liked
  const likesRef = db.collection('likes');
  const existing = await likesRef.where({ postId, userId: openid }).get();

  if (existing.data.length > 0) {
    await likesRef.doc(existing.data[0]._id).remove();
    await db.collection('posts').doc(postId).update({
      data: { likes: db.command.inc(-1) },
    });
    return { liked: false };
  } else {
    await likesRef.add({ data: { postId, userId: openid, createdAt: db.serverDate() } });
    await db.collection('posts').doc(postId).update({
      data: { likes: db.command.inc(1) },
    });
    return { liked: true };
  }
};
```

- [ ] **Step 2: Wire like button in post-card component**

```javascript
// Update post-card.js onLike method
onLike() {
  wx.cloud.callFunction({
    name: 'toggleLike',
    data: { postId: this.properties.post._id },
  }).then((res) => {
    const post = { ...this.properties.post };
    post.likes += res.result.liked ? 1 : -1;
    this.setData({ post });
  }).catch(console.error);
},
```

- [ ] **Step 3: Commit**

```bash
git add cloudfunctions/toggleLike/
git commit -m "feat: add like/unlike toggle with cloud function"
```

---

### Task 14: Profile Page — 我的

**Files:**
- Modify: `miniprogram/pages/mine/mine.js`, `mine.wxml`, `mine.wxss`

- [ ] **Step 1: Build mine.js with assessment history**

```javascript
// miniprogram/pages/mine/mine.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    assessmentCount: 0,
    menuItems: [
      { icon: 'posts', label: '我的动态', key: 'posts' },
      { icon: 'history', label: '测评记录', key: 'history' },
      { icon: 'favorites', label: '我的收藏', key: 'favorites' },
    ],
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    wx.cloud.callFunction({ name: 'getUserProfile' }).then((res) => {
      this.setData({
        userInfo: res.result.user || {},
      });
    });

    // Get assessment count
    wx.cloud.callFunction({ name: 'getAssessments' }).then((res) => {
      this.setData({ assessmentCount: res.result.total || 0 });
    });
  },

  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({ 'userInfo.nickname': e.detail.userInfo.nickName });
      wx.cloud.callFunction({
        name: 'getUserProfile',
        data: { nickname: e.detail.userInfo.nickName },
      });
    }
  },

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key;
    if (key === 'history') {
      wx.navigateTo({ url: '/pages/quiz-result/quiz-result?mode=history' });
    }
  },
});
```

- [ ] **Step 2: Create getUserProfile & getAssessments cloud functions**

```javascript
// cloudfunctions/getUserProfile/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (event.nickname) {
    await db.collection('users').where({ openid }).update({
      data: { nickname: event.nickname },
    });
  }

  const user = await db.collection('users').where({ openid }).get();
  return { user: user.data[0] || null };
};
```

```javascript
// cloudfunctions/getAssessments/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const res = await db.collection('assessments')
    .where({ userId: openid })
    .orderBy('createdAt', 'desc')
    .get();

  return { assessments: res.data, total: res.data.length };
};
```

- [ ] **Step 3: Build mine.wxml and mine.wxss** with profile header (avatar + name + investor type tag) and menu list.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/mine/ cloudfunctions/getUserProfile/ cloudfunctions/getAssessments/
git commit -m "feat: implement profile page with assessment history"
```

---

### Task 15: Dynamic Pie Icon on Home Page

**Files:**
- Modify: `miniprogram/pages/index/index.js`, `index.wxml`

- [ ] **Step 1: Update home page entry cards with dynamic pie icon**

```javascript
// Add to index.js
data: {
  allocation: null, // Latest allocation data
},

fetchAllocation() {
  wx.cloud.callFunction({ name: 'getAssessments' }).then((res) => {
    if (res.result.assessments && res.result.assessments.length > 0) {
      const latest = res.result.assessments[0];
      this.setData({ allocation: latest.allocation || null });
    }
  });
},
```

Render the allocation pie icon in the entry card using the `icons.allocation()` function with the user's actual segment data. If no assessment exists, show the default empty pie.

- [ ] **Step 2: Commit**

```bash
git add miniprogram/pages/index/
git commit -m "feat: add dynamic pie icon reflecting user portfolio"
```

---

### Task 16: Polish & Edge Cases

**Files:**
- Modify: various pages

- [ ] **Step 1: Add loading states** — `wx.showLoading()` / `wx.hideLoading()` in all async operations.

- [ ] **Step 2: Add empty states** — Show meaningful empty messages for: no posts, no assessment history, no comments.

- [ ] **Step 3: Error handling** — Wrap all cloud calls in try/catch, show toast on failure.

- [ ] **Step 4: Post card time formatting** — Convert ISO dates to relative time ("2小时前", "昨天").

```javascript
// Add to utils: miniprogram/utils/time.js
function formatTime(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString();
}

module.exports = { formatTime };
```

- [ ] **Step 5: Commit**

```bash
git add miniprogram/
git commit -m "chore: polish loading states, empty states, error handling, and time formatting"
```

---

## Verification

After completing all tasks, verify the app works end-to-end:

1. **Open mini program in WeChat DevTools** — tab bar should show 4 tabs with correct icons.
2. **Login flow** — first launch should create user record silently via `wx.login`.
3. **Take quiz** — navigate to 测评 tab, answer all 10 questions, verify result page shows correct type and allocation.
4. **Retake quiz** — click "重新测评", verify new answers replace result.
5. **View home page** — verify market data card and latest posts appear.
6. **Create a post** — from 社区 tab, upload an image, add text and tags, submit.
7. **View post** — verify post appears in feed, tap to see detail.
8. **Comment** — add a comment on a post, verify it appears.
9. **Like** — toggle like on a post, verify count updates.
10. **Profile** — visit 我的 tab, verify nickname, investor type, and assessment count display correctly.

---

## Project-Level Rules

For `CLAUDE.md` at repo root:

```markdown
# QPP App

## Commands
- No build/lint/test scripts (WeChat Mini Program uses DevTools GUI).
- Use WeChat DevTools to preview, compile, and upload.

## Architecture
- Frontend: WeChat Mini Program (WXML + WXSS + JS)
- Backend: WeChat Cloud Development (serverless)
- Cloud functions in `cloudfunctions/`, each is a standalone Node.js module.
- Utils in `miniprogram/utils/` for shared logic (icons, quiz data, API helpers).
- Reusable components in `miniprogram/components/`.

## Design System
- Colors: Primary #007AFF, Background #F2F2F7, Card #FFFFFF
- Spacing rhythm: 4/8/12/16/20px
- Card radius: 12px; Button radius: 10px; Tag radius: 8px
- Icons: SVG inline, 1.5px stroke, 24x24 viewBox

## Key Rules
- Always use cloud functions for DB writes; direct collection access OK for reads during dev.
- All user-generated content must pass through `contentCheck` cloud function.
- Quiz scoring algorithm lives in `utils/quiz-data.js` — questions and logic co-located.
```
