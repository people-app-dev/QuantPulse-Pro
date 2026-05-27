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

var TYPE_ALLOCATIONS = {
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

  const expectedVolatility = {
    '保守型': '2% - 5%',
    '稳健型': '5% - 10%',
    '进取型': '10% - 20%',
  };

  return {
    dimensions,
    riskScore: overall,
    investorType,
    allocation: TYPE_ALLOCATIONS[investorType],
    expectedVolatility: expectedVolatility[investorType],
  };
}

var typeAdvice = {
  '保守型': {
    advice: [
      '投资策略：保守型投资者追求本金安全，适合以低风险产品为主构建投资组合。建议将大部分资金配置在货币基金和债券基金中，确保现金流稳定。',
      '产品推荐：优先选择货币基金（如余额宝类产品）、国债、高等级信用债基金以及银行大额存单。风险资产占比建议控制在10%-15%以内。',
      '风险管理：避免追涨杀跌，严格控制高波动资产的仓位。设立止损线，单个产品的亏损超过5%时应考虑减仓。每季度审视一次投资组合。',
      '投资周期：以1-3年的中短期配置为主，保持充足的流动性。建议预留3-6个月生活费的现金储备，不投入任何有风险的产品。'
    ],
    principles: ['安全第一，收益第二', '保持充足的现金流', '严格控制风险资产比例', '定期定额，规避择时风险'],
    suitable: ['货币基金（余额宝类）', '国债及政策性金融债', '高等级信用债基金', '银行大额存单', '保本型理财产品'],
    avoid: ['个股投资', '股票型基金（仓位>20%）', '期货、期权等衍生品', '高收益债券（垃圾债）', '数字货币']
  },
  '稳健型': {
    advice: [
      '投资策略：稳健型投资者在控制风险的前提下追求资产增值，适合采用"核心+卫星"策略。核心仓位配置在指数基金和债券基金中，卫星仓位可适度介入主动管理型基金。',
      '产品推荐：宽基指数基金（如沪深300、中证500ETF）、混合型基金、可转债基金、REITs等。建议采用定投方式逐步建仓，平均持仓成本。',
      '风险管理：股债比例建议维持在6:4到4:6之间，根据市场估值动态调整。单只产品仓位不超过总资产的20%。每半年全面复盘一次。',
      '投资周期：建议以3-5年的中长期视角进行资产配置。短期内不需要动用的资金可配置在偏股型产品中，取得更好的长期回报。'
    ],
    principles: ['核心稳健，卫星进取', '坚持定投，平滑波动', '股债平衡，动态调整', '分散配置，降低相关性', '长期持有，减少交易'],
    suitable: ['宽基指数基金（沪深300、中证500ETF）', '混合型基金（股债平衡型）', '可转债基金', 'REITs', '黄金ETF'],
    avoid: ['单一重仓个股', '杠杆产品（分级B、期货）', '流动性差的私募产品', '无止损的策略性交易']
  },
  '进取型': {
    advice: [
      '投资策略：进取型投资者愿意承担较高波动以追求超额回报。建议在宽基指数基金的基础上，叠加行业主题基金和优质个股，构建攻守兼备的组合。',
      '产品推荐：行业ETF（科技、新能源、半导体）、主动管理型股票基金、QDII基金（全球配置）、可转债、以及少量个股。可适度使用趋势跟踪策略。',
      '风险管理：设定硬止损线——单只产品亏损15%以上必须重新评估。整体组合最大回撤控制在25%以内。每季度进行压力测试，模拟极端市场环境。',
      '投资周期：建议以5年以上的长期维度进行规划。利用复利效应，将分红和收益再投资。短期市场波动是正常现象，避免因情绪化操作而偏离长期策略。'
    ],
    principles: ['长期复利，价值投资', '高收益伴随高波动', '严格止损，控制最大回撤', '全球化配置分散风险', '持续学习，提升认知'],
    suitable: ['行业ETF（科技、新能源、半导体）', '主动管理型股票基金', 'QDII基金（美股、港股）', '优质个股（蓝筹及成长股）', '可转债及可交换债'],
    avoid: ['无止损的主观交易', '高杠杆衍生品', '概念炒作和短期投机', '流动性枯竭的小盘股', '未经验证的投资策略']
  }
};

module.exports = { questions, calculateResult, typeAdvice, TYPE_ALLOCATIONS };
