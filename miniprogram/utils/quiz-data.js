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

  const maxPerDim = 4;
  const dimensions = {};
  for (const dim of Object.keys(dimScores)) {
    const raw = dimScores[dim];
    const max = dimCounts[dim] * maxPerDim;
    const min = dimCounts[dim] * 1;
    dimensions[dim] = Math.round(((raw - min) / (max - min)) * 100);
  }

  const overall = Math.round(
    Object.values(dimensions).reduce((s, v) => s + v, 0) /
      Object.keys(dimensions).length
  );

  let investorType;
  if (overall <= 33) investorType = '保守型';
  else if (overall <= 66) investorType = '稳健型';
  else investorType = '进取型';

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
