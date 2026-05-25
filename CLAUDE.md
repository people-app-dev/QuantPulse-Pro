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

- **Frontend**: Native WeChat Mini Program (WXML + WXSS + JS), no bundler/build step.
- **Backend**: WeChat Cloud Development (serverless) — Cloud Database (MongoDB-style), Cloud Storage (images), Cloud Functions (Node.js).
- **Cloud environment ID**: `cloud1-d1g89sxp75c39545d` (configured in `miniprogram/app.js`).
- **App ID**: `wx800c9911501eaa55` (in `project.config.json`).

### Directory layout

```
miniprogram/
  app.js, app.json, app.wxss        # App entry (cloud init + wx.login), routing, global styles
  styles/design-tokens.wxss         # CSS custom properties (colors, spacing, fonts)
  utils/
    api.js                          # Cloud DB collection helpers
    icons.js                        # SVG tab bar icons → base64 data URIs for <image> tags
    quiz-data.js                    # 10 assessment questions + scoring algorithm
    time.js                         # Relative time formatter (中文)
  custom-tab-bar/                   # iOS-style custom tab bar (3 tabs, SVG icons)
  pages/
    index/                          # Tab 1: Global market brief (fetches getMarketBrief CF)
    invest/                         # Tab 2: Risk assessment entry + simulation overview dashboard
    mine/                           # Tab 3: Profile, risk score, simulation overview, calculator link
    quiz/                           # Assessment questionnaire (navigated from invest, not a tab)
    quiz-result/                    # Assessment result display + "Start Simulation" button
    simulation/                     # Paper trading: search stocks, buy/sell, portfolio tracking
    calculator/                     # Financial calculators: compound interest, DCA, loan
cloudfunctions/                     # 10 Cloud Functions (see below)
```

### Tab bar (3 tabs)

| Tab | Page | Content |
|-----|------|---------|
| 市场 | `pages/index/index` | AI-generated daily market brief |
| 投资 | `pages/invest/invest` | Risk assessment entry + investment simulation dashboard |
| 我的 | `pages/mine/mine` | Profile + risk score + sim overview + calculator link |

### User flow: Assessment → Simulation

1. User enters **投资 tab** → sees "Start Assessment" card (if not assessed yet)
2. Completes 10-question quiz in `pages/quiz/quiz` → on finish, navigates to `quiz-result`
3. `quiz-result` shows investor type, risk score, suggested asset allocation, and "Start Simulation" button
4. Tapping "Start Simulation" calls `initSimulation` CF → creates sim account with ¥100,000 virtual cash → switches to 投资 tab
5. **投资 tab** dashboard now shows risk profile + sim portfolio overview + "Enter Simulation" button
6. `pages/simulation/simulation` supports: search any stock → buy → view holdings → sell. Prices via getStockPrice CF (Sina API, 5-min cache)

### Data model (4 Cloud Database collections)

| Collection | Key fields | Notes |
|---|---|---|
| `users` | `openid`, `nickname`, `avatar`, `investorType`, `riskScore` | Created on first login |
| `assessments` | `userId`, `answers[]`, `dimensions{}`, `riskScore`, `investorType`, `allocation[]` | Append-only history |
| `market_briefs` | Fields from API response (date, forex, indices, highlights) | Cached 1 hour by getMarketBrief |
| `simulations` | `userId`, `cash`, `holdings[]`, `transactions[]` | One doc per user, ¥100,000 initial cash |

`simulations` document structure:
```json
{
  "userId": "openid",
  "cash": 100000,
  "holdings": [{ "code": "sh600519", "name": "贵州茅台", "shares": 100, "costPrice": 1850.00 }],
  "transactions": [{ "type": "buy", "code": "sh600519", "name": "贵州茅台", "price": 1850.00, "shares": 100, "createdAt": "..." }],
  "createdAt": "..."
}
```

### Cloud Functions (all under `cloudfunctions/`)

Every cloud function:
- Uses `wx-server-sdk` with `cloud.DYNAMIC_CURRENT_ENV`
- Gets user identity via `cloud.getWXContext().OPENID`
- Has `"wx-server-sdk": "latest"` in `package.json`
- Has try/catch error handling returning `{ success/error }` or graceful fallback

| Function | Purpose |
|---|---|
| `login` | Get OPENID, create user if new, return user doc |
| `getUserProfile` | Read or update (nickname/avatar) current user |
| `getAssessments` | Get current user's assessment history |
| `saveAssessment` | Save assessment + update user's investorType/riskScore |
| `getMarketBrief` | Fetch forex from open.er-api.com, generate brief, cache 1h |
| `searchStock` | Search stocks via EastMoney API, returns code/name/fullCode |
| `getStockPrice` | Get real-time quotes via Sina API (`hq.sinajs.cn`), 5-min cache |
| `initSimulation` | Create simulation account (¥100,000 cash) if not exists |
| `getSimulation` | Get current user's simulation data (cash + holdings + transactions) |
| `tradeStock` | Execute buy/sell: validate funds/shares, update holdings+cash, log transaction |

### Stock price data flow

```
simulation page → wx.cloud.callFunction("getStockPrice", { codes: [...] })
                 → cloud function calls http://hq.sinajs.cn/list=sh600519,sz000858
                 → parses CSV-like response → caches 5 min → returns [{ code, name, price, change, changePercent }]
```

Stock search uses `https://searchapi.eastmoney.com/bussiness/web/1111?keyword=...`.

### Design system (`styles/design-tokens.wxss`)

iOS-inspired design tokens via CSS custom properties:
- Colors: `--color-primary: #007AFF`, `--color-bg: #F2F2F7`, `--color-card: #FFFFFF`, `--color-text-secondary: #8E8E93`, `--color-success: #34C759`, `--color-danger: #FF3B30`
- Spacing: `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 12px`, `--space-lg: 16px`, `--space-xl: 20px`
- Fonts: `--font-title: 28px`, `--font-headline: 17px`, `--font-body: 14px`, `--font-caption: 12px`, `--font-small: 10px`
- Border radius: `--radius-card: 12px`, `--radius-button: 10px`

### SVG icon system (`utils/icons.js`)

Only tab bar icons remain. All icons are SVG strings rendered via `<image>` tags using base64 data URIs.
- `icons.home(selected)`, `icons.invest(selected)`, `icons.mine(selected)` — raw SVG strings
- `toDataUri(svgString)` — converts SVG to base64 data URI
- `getTabIconUris()` — pre-computed URIs for 3 tabs (on/off states)

### WXML constraints

- Use `==` not `===` for comparisons — WXML template engine does not support strict equality.
- WXML cannot call JS methods like `.toFixed()`, `.indexOf()`, etc. Pre-compute all formatted values in JS `data` and reference the computed property in the template.
- Keep template expressions simple — pre-compute booleans like `isProfit` in JS instead of doing math in `{{ }}`.

### Common patterns

- **Tab bar pages** (index, invest, mine) must call `this.getTabBar().setData({ selected: N })` in `onShow()`. Non-tab pages (quiz, quiz-result, simulation, calculator) have a null-guard check which safely no-ops.
- **Cloud function calls** use `wx.cloud.callFunction({ name, data })`. Errors must show user-visible feedback (toast/modal), not just `console.error`.
- **Database collections must exist before cloud functions can query them.** The first `.add()` auto-creates a collection, but `.get()` on a non-existent collection throws. Create `simulations` before using simulation features.
- **Sharing** is enabled globally in `app.js` via `wx.showShareMenu`. Pages that want custom share content define `onShareAppMessage()`.

### Deployment

There is no build step. To deploy:
1. Open the repo root in WeChat DevTools.
2. Right-click each cloud function folder → "Upload and Deploy: Install Dependencies in Cloud" (上传并部署：云端安装依赖).
3. Create database collections in Cloud Development console: `users`, `assessments`, `market_briefs`, `simulations`.
4. Set collection permissions: `users`/`assessments`/`simulations` → "Creator only".

### Known issues

- `quiz` page is no longer a tab page — it's navigated to from the invest tab. Its `onShow()` still tries to set tab selected:1, but the null-guard prevents errors.
- `calculator` page has `onFieldInput` using `data-field` attribute binding — ensure all input handlers consistently use this pattern for new fields.

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
