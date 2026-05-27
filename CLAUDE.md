# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This repository contains two independent projects:

1. **QPP** — A WeChat Mini Program (personal finance app) with WeChat Cloud Development backend. Lives in `miniprogram/` and `cloudfunctions/`.
2. **PPT generator** — Standalone Node.js scripts using pptxgenjs v4.x to produce `.pptx` slide decks. Lives at the repo root.

---

## QPP WeChat Mini Program

### Architecture

- **Frontend**: Native WeChat Mini Program (WXML + WXSS + JS), no bundler/build step. Uses phone-number-based account system.
- **Backend**: WeChat Cloud Development (serverless) — Cloud Database (MongoDB-style), Cloud Storage (images), Cloud Functions (Node.js).
- **Cloud environment ID**: `cloud1-d1g89sxp75c39545d` (configured in `miniprogram/app.js`).
- **App ID**: `wx800c9911501eaa55` (in `project.config.json`).

### Directory layout

```
miniprogram/
  app.js, app.json, app.wxss        # App entry (cloud init + login gate), routing, global styles
  styles/design-tokens.wxss         # CSS custom properties (colors, spacing, fonts)
  utils/
    api.js                          # Cloud DB collection helpers
    icons.js                        # SVG tab bar icons → base64 data URIs for <image> tags
    quiz-data.js                    # 10 assessment questions + scoring algorithm + per-type investment advice
    time.js                         # Relative time formatter (中文)
  custom-tab-bar/                   # iOS-style custom tab bar (3 tabs, SVG icons)
  pages/
    index/                          # Tab 1: Global market brief (fetches getMarketBrief CF)
    invest/                         # Tab 2: Concept search + category chips + 2×3 popular grid (top) + always-visible financial calculators (bottom), split layout
    login/                          # Phone number login (entry page) — WeChat one-tap + manual phone input
    mine/                           # Tab 3: Centered avatar + nickname + phone display + investor type badge + allocation bars + full investment advice + menu (quiz, refresh login, logout) + quote footer
    quiz/                           # Assessment questionnaire (navigated from invest/mine)
    quiz-result/                    # Assessment result + allocation bars + detailed advice + retake button
    brief-detail/                   # Expanded market brief with takeaways, sections, related topics
    concept-detail/                 # Full concept explanation with dark gradient header + related concepts
cloudfunctions/                     # 8 Cloud Functions (see below)
```

### Tab bar (3 tabs)

| Tab | Page | Content |
|-----|------|---------|
| 市场 | `pages/index/index` | AI-generated daily market brief |
| 投资 | `pages/invest/invest` | Concept search + category-filtered popular grid + 5 always-visible financial calculators |
| 我的 | `pages/mine/mine` | Centered avatar header + phone display + investor type badge + allocation + full investment advice + menu (quiz, refresh, logout) + quote footer |

### Privacy compliance

- **app.js**: Listens to `wx.onNeedPrivacyAuthorization` (base library >= 2.32.3) — when WeChat triggers a privacy check, shows a modal explaining data usage and obtains user consent.
- **Login page**: Footer links `《用户协议》` and `《隐私政策》` are tappable, each opening a `wx.showModal` with the full policy text.
- **WeChat backend**: In 微信公众平台 → 设置 → 用户隐私保护指引, must check "收集手机号" and "存储用户数据". No other privacy items should be checked unless the app starts collecting that data.
- Privacy APIs used: `getPhoneNumber` (phone auth), `chooseAvatar` (avatar picker), `wx.login` (WeChat login). All are covered by the built-in privacy authorization flow.

### Authentication system

Phone-number-based account system with multi-account support:

- **Login page** (`pages/login/login`) is the entry page. On load, checks `wx.getStorageSync('accountPhone')` — if found, auto-redirects to index via `wx.reLaunch`.
- **WeChat one-tap login**: `<button open-type="getPhoneNumber">` returns `{ code }` → CF `login` with `{ phoneCode }` → `cloud.openapi.phonenumber.getPhoneNumber()` decrypts → lookup/create user by phone.
- **Phone + password login**: User enters phone + password → CF `login` with `{ phoneNumber, password }` → hash comparison.
- **Registration**: Toggle to register mode → enter phone + password + confirm → CF `login` with `{ phoneNumber, password, action: 'register' }` → create account with hashed password (SHA256 + salt).
- **Account isolation**: Each phone number has independent data (profile, assessments, investor type). The phone is stored in `wx.storage` as `accountPhone` and passed to all user-data CFs.
- **Logout**: Mine page → "退出登录" → clears `accountPhone` from storage → `wx.reLaunch` to login page. Data is preserved — re-login with same phone restores account.
- **Legacy support**: CFs fall back to OpenID-based lookup when no `phone` parameter is provided, preserving existing user data.
- All user-facing CFs (`getUserProfile`, `saveAssessment`, `getAssessments`) accept optional `phone` parameter for phone-based account lookup.

### User flow: Assessment → Advice

1. User enters **我的 tab** → taps "风险测评" menu → completes 10-question quiz
2. Quiz finishes → results + allocation + full investment advice shown inline on quiz page (no page jump)
3. User returns to **我的 tab** → sees investor type badge, allocation bars, and full investment advice directly on the page
4. **投资 tab** focuses on education + tools: concept search, category-filtered popular grid, 5 financial calculators always visible

### Data model (3 Cloud Database collections)

| Collection | Key fields | Notes |
|---|---|---|
| `users` | `openid`, `phone`, `password`, `nickname`, `avatar`, `investorType`, `riskScore` | Created on first login; phone is the account identifier; password is SHA256-hashed with salt |
| `assessments` | `userId`, `answers[]`, `dimensions{}`, `riskScore`, `investorType`, `allocation[]` | `userId` is phone number when available, otherwise OpenID |
| `market_briefs` | Fields from API response (date, forex, indices, highlights) | Cached 1 hour by getMarketBrief |

### Cloud Functions (all under `cloudfunctions/`)

Every cloud function:
- Uses `wx-server-sdk` with `cloud.DYNAMIC_CURRENT_ENV`
- Gets user identity via `cloud.getWXContext().OPENID`
- Has `"wx-server-sdk": "latest"` in `package.json`
- Has try/catch error handling returning `{ success/error }` or graceful fallback

| Function | Purpose |
|---|---|
| `login` | Phone login: `phoneCode` (WeChat getPhoneNumber) or `phoneNumber` (manual) → lookup/create user by phone. Fallback: OpenID-based login for legacy users |
| `getUserProfile` | Read or update (nickname/avatar) current user |
| `getAssessments` | Get current user's assessment history |
| `saveAssessment` | Save assessment + update user's investorType/riskScore |
| `getMarketBrief` | Fetch forex from open.er-api.com, generate brief, cache 1h |
| `searchStock` | Search stocks via EastMoney API, returns code/name/fullCode |
| `searchFund` | Search funds via EastMoney API, returns code/name/fullCode |
| `searchFinanceConcept` | Built-in knowledge base (~45 concepts, 5 categories) with keyword search + category filter + exactId lookup |

### Cross-page data flow

Pages communicate via `getApp().globalData`:
- `globalData.selectedConcept` — invest page stores full concept data before navigating to concept-detail, so detail page shows content immediately without re-fetch
- `globalData.searchTopic` — brief-detail sets a topic, invest tab reads and pre-fills search on next show
- Always null-check and clear after reading (one-shot pattern)

Pages also pass data via URL query parameters:
- `quiz-result` receives data primarily through `globalData.quizResult` (avoids URL-encoding garbled text issues). invest/mine/quiz pages set `{ type, score, allocation }` before navigating; quiz-result reads and clears it with a one-shot pattern. Allocation is also computed from `TYPE_ALLOCATIONS[type]` in quiz-data.js as fallback.
- WeChat auto-decodes URL parameters in `onLoad(options)` — do NOT call `decodeURIComponent` on `options` values.

### Design system (`styles/design-tokens.wxss`)

iOS-inspired design tokens via CSS custom properties:
- Colors: `--color-primary: #007AFF`, `--color-bg: #F2F2F7`, `--color-card: #FFFFFF`, `--color-text-secondary: #8E8E93`, `--color-success: #34C759`, `--color-danger: #FF3B30`
- Spacing: `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 12px`, `--space-lg: 16px`, `--space-xl: 20px`
- Fonts: `--font-title: 28px`, `--font-headline: 17px`, `--font-body: 14px`, `--font-caption: 12px`, `--font-small: 10px`
- Border radius: `--radius-card: 12px`, `--radius-button: 10px`

### iOS card pattern

Pages use a consistent iOS-style card pattern:
```css
.ios-card {
  display: flex; align-items: center;
  background: var(--color-card);
  border-radius: 12px;  /* or 16px for prominent cards */
  padding: 14px 16px;
  margin-bottom: 8px;
}
```
- Icon: 40×40px wrap with rounded corners + tinted background + geometric Unicode symbol (line-based iOS style: `◎` for assessment, `◇` for advice/calculator, `↻` for refresh). Use `.ios-icon-symbol` (22px, `line-height: 1`) on invest tab, `.menu-symbol` (20px, `line-height: 1`) on mine tab. Do NOT use Latin letters as icons — they look unpolished.
- Body: flex-1 with `ios-title` (15px/600) and `ios-desc` (13px/--color-text-secondary)
- Arrow: `›` character at 22px in `#C7C7CC`
- Section labels: 13px/600, uppercase, `letter-spacing: 0.5px`, `--color-text-secondary`

### SVG icon system (`utils/icons.js`)

Tab bar icons are SVG strings rendered via `<image>` tags using base64 data URIs.
- `icons.home(selected)`, `icons.invest(selected)`, `icons.mine(selected)` — raw SVG strings
- `toDataUri(svgString)` — converts SVG to base64 data URI
- `getTabIconUris()` — pre-computed URIs for 3 tabs (on/off states)

In-page card icons use geometric Unicode symbols (not SVG, not Latin letters), line-based iOS style:
- `◎` (U+25CE concentric circles) — risk assessment, assessment result
- `◇` (U+25C7 hollow diamond) — investment advice, financial calculator
- `↻` (U+21BB clockwise arrow) — refresh login, secondary actions
- Apply via `.ios-icon-symbol` (22px) or `.menu-symbol` (20px) with `line-height: 1`

### WXML constraints

- Use `==` not `===` for comparisons — WXML template engine does not support strict equality.
- WXML cannot call JS methods like `.toFixed()`, `.indexOf()`, etc. Pre-compute all formatted values in JS `data` and reference the computed property in the template.
- Keep template expressions simple — pre-compute booleans like `isProfit` in JS instead of doing math in `{{ }}`.
- Use `wx:if`/`wx:elif`/`wx:else` for conditional rendering, not hidden/display CSS hacks.
- Inline styles use `style="property: {{value}};"` syntax — each dynamic value in its own `{{ }}` block.

### CSS requirements

- Every page WXSS **must** include both `page { background-color: var(--color-bg); }` (for the root `<page>` element) and `.page { background-color: var(--color-bg); }` (for the content wrapper). Without both, WeChat's `style: "v2"` rendering may show a dark line between the navigation bar and page content.
- Always use design token CSS variables from `design-tokens.wxss` — never hardcode hex values for colors, spacing, or font sizes in page styles.
- Import `@import '/styles/design-tokens.wxss';` at the top of every page WXSS file.
- Gradient header cards (concept-detail) must use dark enough gradient stops for white text readability. Tested stops: stock `#0056CC→#3F3BA7`, fund `#E07800→#D1442E`, bond `#248A3D→#1E7A34`, macro `#8944AB→#6B3385`, finance `#0066CC→#3A90C8`. Use `text-shadow: 0 2px 8px rgba(0,0,0,0.3)` on header titles.

### Common patterns

- **Tab bar pages** (index, invest, mine) must call `this.getTabBar().setData({ selected: N })` in `onShow()`. Non-tab pages (quiz, quiz-result, brief-detail, concept-detail) have a null-guard check which safely no-ops.
- **Cloud function calls** use `wx.cloud.callFunction({ name, data })`. Errors must show user-visible feedback (toast/modal), not just `console.error`.
- **Database collections must exist before cloud functions can query them.** The first `.add()` auto-creates a collection, but `.get()` on a non-existent collection throws. Create collections in Cloud Development console before deploying cloud functions.
- **Sharing** is enabled globally in `app.js` via `wx.showShareMenu`. Pages that want custom share content define `onShareAppMessage()`.
- **Use `var` not `const`/`let`** in page JS files. Some WeChat runtime environments (especially older devices) do not fully support ES6 block-scoped declarations. All page JS files consistently use `var` and `function` expressions.
- **WeChat auto-decodes URL parameters** in `onLoad(options)`. Do NOT call `decodeURIComponent` on `options` values — they are already decoded by the framework.

### Deployment

There is no build step. To deploy:
1. Open the repo root in WeChat DevTools.
2. Right-click each cloud function folder → "Upload and Deploy: Install Dependencies in Cloud" (上传并部署：云端安装依赖).
3. Create database collections in Cloud Development console: `users`, `assessments`, `market_briefs`.
4. Set collection permissions: `users`/`assessments` → "Creator only".

### Knowledge base system

`cloudfunctions/searchFinanceConcept/knowledge-base.js` contains ~45 financial concepts across 5 categories:
- 股票 (stocks): PE, PB, ROE, K线, 均线, MACD, 涨停跌停, IPO, 蓝筹股, 成交量, 牛熊市
- 基金 (funds): 公募基金, ETF, 指数基金, 定投, 基金净值, 货币基金, 混合型基金, 申购赎回
- 债券 (bonds): 国债, 可转债, 债券收益率, 信用债, 久期
- 宏观 (macro): GDP, CPI, PMI, M2, 降准, 加息, 通货膨胀
- 理财 (finance): 复利, 资产配置, 止损止盈, 风险分散, 仓位管理, 定投策略

Each entry has: `id`, `category`, `concept`, `tags[]`, `short` (one-liner), `detail` (full markdown-like explanation).
The CF supports `exactId` for direct lookup, `keyword` for text search with relevance scoring, and `category` filtering.

### Known issues

- `quiz` page is no longer a tab page — it's navigated to from the invest tab. Its `onShow()` still tries to set tab selected:1, but the null-guard prevents errors.
- `invest` tab uses `onFieldInput` with `data-field` attribute binding for calculator inputs — ensure all new calculator tools consistently use this pattern.
- **WXSS compiler limitations**: WeChat WXSS does NOT support `backdrop-filter`, `-webkit-backdrop-filter`, `::before`/`::after` pseudo-elements with `position: absolute`, `pointer-events`, or CSS `transition`. Using these can cause compilation failures resulting in blank pages. For glass/translucent effects, use `text-shadow` and `rgba` backgrounds instead.
- **CSS specificity traps**: When using category color classes (`.cat-stock`, `.cat-fund`, etc.) alongside generic container selectors (`.header-card`), standalone category classes at the bottom of a WXSS file will override parent `color` at equal specificity due to cascade order. Always scope category classes to a parent selector (e.g., `.related-badge.cat-stock`).
- **`data-` empty string values**: WeChat's `dataset` handles `data-category=""` inconsistently across SDK versions — the value may become `undefined`. Always use explicit non-empty values (e.g., `data-category="全部"`) and normalize in JS with `if (!cat || cat === '全部') cat = '';`.
- **Popular concepts category filtering**: The invest tab passes `activeCategory` to the cloud function's `category` parameter for server-side filtering. When `activeCategory` is empty/falsy, pass `undefined` to return all categories. The CF returns max 12 items per call.
- **Duplicate `onShow` loading**: `loadPopularConcepts()` is called in `onShow`, which is fine for fresh loads but means an extra CF call on every tab switch. The category chips call `loadPopularConcepts()` again with the new category filter — the brief loading flash is acceptable.

---

## PPT Generator (root-level scripts)

### Commands

```bash
npm install          # Install pptxgenjs
node create_nersc_slide.js   # Generate NERSC_2024_Slide.pptx
```

### Patterns

- Each `.js` file at the repo root is a standalone slide script: `require("pptxgenjs")`, create `new pptxgen()`, build slides, call `pres.writeFile()`.
- Layout: `LAYOUT_16x9` (10 × 5.625 inches).
- Colors: hex constants at the top of each script (no shared theme).
- Positioning: absolute x/y/w/h in inches, computed from constants like `MARGIN`.
- Output: use `__dirname` or relative paths, not hardcoded `d:/claude code/`.

### Key pptxgenjs APIs

- `pres.addSlide()`, `slide.background`, `slide.addShape()`, `slide.addText()`, `slide.addChart()`
- `pres.shapes.RECTANGLE`, `pres.charts.DOUGHNUT`
- `pres.writeFile({ fileName })` — async, returns Promise
- Rich text: array of `{ text, options }` objects to `addText()`
