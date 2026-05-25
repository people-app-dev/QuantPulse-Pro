# Design: Remove Community, Add Investment Simulation & Financial Calculator

2026-05-25

## Overview

Remove the community tab (posts, comments, likes, favorites) entirely. Expand Tab 2 into an "Invest" tab combining risk assessment and paper trading simulation. Update the "Mine" page menu to include simulation overview and financial calculators.

## Tab Bar Restructure

From 4 tabs to 3:

| Tab | Name | Content |
|-----|------|---------|
| 1 | 市场 | Global market brief (unchanged) |
| 2 | 投资 | Risk assessment + investment simulation |
| 3 | 我的 | Profile + simulation overview + financial calculator |

## Pages to Delete

- `pages/feed/` — Community feed
- `pages/post-create/` — Create post
- `pages/post-detail/` — Post detail + comments
- `pages/my-posts/` — Current user's posts list
- `pages/my-favorites/` — Current user's favorited posts
- `pages/my-likes/` — Current user's liked posts
- `pages/user-posts/` — Another user's profile + posts
- `components/post-card/` — Reusable post card component

## Cloud Functions to Delete

`createPost`, `createComment`, `getComments`, `toggleLike`, `toggleFavorite`, `getMyPosts`, `getMyFavorites`, `getMyLikes`, `getUserPosts`, `contentCheck`, `clearAllPosts`

## Database Collections to Delete

`posts`, `comments`, `likes`, `favorites`

## New/Modified Pages

### Tab 2: `pages/invest/invest` (new entry page)

Two states based on whether user has completed assessment:

- **No assessment**: Show invitation card prompting user to take the risk assessment → navigates to `pages/quiz/quiz`
- **Assessment done**: Show risk profile summary card + simulation portfolio overview + quick action buttons

### `pages/quiz/quiz` (modified)

Existing assessment flow unchanged. After completing, navigates to `pages/quiz-result/quiz-result`.

### `pages/quiz-result/quiz-result` (rewrite from stub)

Show assessment result (investor type, risk score, allocation suggestion) + "Start Simulation" button → initializes simulation account and navigates to `pages/simulation/simulation`.

### `pages/simulation/simulation` (new)

Main paper trading interface:

- **Asset card at top**: Total assets = cash + holdings value, daily P&L, total return %
- **Holdings list**: Each row shows stock name, shares, cost price, current price, P&L, "Sell" button
- **"Buy" button**: Opens search → input stock code/name → shows matching results with real-time price → tap to enter order page → input quantity → confirm buy
- **Pull-to-refresh**: Refresh all prices

### `pages/calculator/calculator` (new)

Three calculators in one page with tab switching:

1. **Compound interest**: Principal, annual return %, years → final amount + total return
2. **DCA (定投)**: Monthly amount, annual return %, years → total invested vs final value + return
3. **Loan**: Loan amount, annual rate %, months → monthly payment + total interest

All calculations are client-side only. No cloud functions needed.

### `pages/mine/mine` (modified)

Menu updated from community links to investment tools:

```
Profile card (avatar + nickname + investor type)
Risk score card
───
📈 我的模拟盘 → /pages/simulation/simulation
🔢 理财计算器 → /pages/calculator/calculator
───
重新登录
```

If user has a simulation account, show a compact asset summary below the risk score card (total assets + daily P&L), tappable to simulation detail.

## New Data Model

### Collection: `simulations`

One document per user. Created on first simulation entry.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User openid |
| `cash` | number | Available cash (initial ¥100,000) |
| `holdings` | array | Current holdings |
| `holdings[].code` | string | Stock code (e.g. `sh600519`) |
| `holdings[].name` | string | Stock name (e.g. `贵州茅台`) |
| `holdings[].shares` | number | Shares held |
| `holdings[].costPrice` | number | Average cost price |
| `transactions` | array | Trade history |
| `transactions[].type` | string | `buy` or `sell` |
| `transactions[].code` | string | Stock code |
| `transactions[].name` | string | Stock name |
| `transactions[].price` | number | Execution price |
| `transactions[].shares` | number | Quantity |
| `transactions[].createdAt` | date | Trade time |

## New Cloud Functions

| Function | Purpose |
|----------|---------|
| `searchStock` | Search stocks via Sina API, return code/name/current price |
| `getStockPrice` | Get real-time quotes for one or multiple stocks (refresh holdings) |
| `initSimulation` | Initialize simulation account for user (¥100,000 starting cash) |
| `getSimulation` | Get current user's simulation account data |
| `tradeStock` | Execute buy/sell, update cash + holdings + transactions |

### Stock Data Source

Sina Finance free API (`hq.sinajs.cn`). Cloud function fetches and caches for 5 minutes.

## Files to Update

| File | Change |
|------|--------|
| `miniprogram/app.json` | Remove deleted pages, remove tab bar 3rd entry, update tab bar to 3 items |
| `miniprogram/custom-tab-bar/` | Reduce to 3 tabs |
| `miniprogram/utils/icons.js` | Remove unused icons |
| `miniprogram/styles/design-tokens.wxss` | No changes needed (tokens remain same) |

## Implementation Order

1. Delete community pages, components, cloud functions, and database collections
2. Update app.json and custom-tab-bar to 3 tabs
3. Implement quiz-result page (assessment result display)
4. Implement simulation cloud functions + page
5. Implement calculator page
6. Implement invest entry page
7. Update mine page menu
