const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const CACHE_COLLECTION = 'market_briefs';
const CACHE_TTL = 60 * 60 * 1000;

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// —— Seeded pseudo-random (date-based, deterministic within a day) ——
function dateSeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pickBySeed(arr, count, seed) {
  const rng = seededRandom(seed);
  const shuffled = arr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function forexChange(rng, baseMin, baseMax) {
  return (rng() * (baseMax - baseMin) + baseMin).toFixed(2) + '%';
}

// —— Highlight pool (24 items, 8 picked daily) ——
const HIGHLIGHT_POOL = [
  {
    title: '美联储释放鸽派信号，降息预期升温',
    summary: '美联储官员释放鸽派信号，市场预计年内降息2-3次',
    detail: '最新公布的联储会议纪要显示，多数委员认为当前利率水平已具有足够限制性，如果通胀持续回落，年内启动降息将是合适的。市场定价反映9月首次降息概率超过70%，全年累计降息幅度预期为50-75个基点。美元指数受此影响跌破104关口，为近三个月低点。对A股而言，中美利差收窄有助于缓解人民币贬值压力，改善外资流入环境。',
  },
  {
    title: '国内政策组合拳持续发力',
    summary: '国内政策持续加码，多地出台消费刺激措施',
    detail: '国务院常务会议部署新一轮稳增长措施，重点包括：扩大内需战略实施方案、设备更新和消费品以旧换新行动、以及房地产市场平稳健康发展措施。多个省市同步出台消费券发放、新能源汽车补贴等配套政策。市场预计相关政策将在下半年逐步显效，消费和投资增速有望企稳回升。',
  },
  {
    title: '国际金价高位震荡，避险需求旺盛',
    summary: '国际金价高位震荡，避险情绪升温',
    detail: 'COMEX黄金期货价格在2380-2420美元/盎司区间高位震荡。地缘政治风险持续、全球央行购金需求强劲、以及降息预期三重因素共同支撑金价。世界黄金协会数据显示，一季度全球央行净购金量同比增长，中国央行连续18个月增持黄金储备。黄金作为避险资产和通胀对冲工具，在当前宏观环境下配置价值凸显。',
  },
  {
    title: '北向资金持续流入，外资看好中国资产',
    summary: '北向资金连续流入，外资增配中国资产',
    detail: '沪深港通数据显示，北向资金已连续多个交易日净流入，累计净买入金额超百亿元。外资机构普遍认为A股估值处于历史较低水平，叠加政策支持和盈利改善预期，中国资产的中长期配置价值显现。重点增持方向包括新能源、消费和金融板块龙头。',
  },
  {
    title: 'AI产业链持续活跃，科技股领涨',
    summary: 'AI产业链持续活跃，科技成长股表现强势',
    detail: '人工智能产业链延续活跃态势，从算力芯片到应用端全面开花。国内大模型商用化进程加速，多家科技巨头发布新一代AI产品。半导体、光模块、服务器等算力基础设施方向业绩高增长确定性强。但部分标的估值已处高位，需关注业绩兑现情况和回调风险。',
  },
  {
    title: '房地产市场出现企稳信号',
    summary: '房地产市场初现企稳迹象，政策效果逐步显现',
    detail: '5月以来，一线城市二手房成交量环比回升，部分热点城市新房去化率改善。央行下调首套和二套房贷款利率下限后，购房者信心指数略有回升。住建部表示将继续因城施策，支持刚性和改善性住房需求。市场分析认为，房地产市场最悲观的阶段可能已经过去，但全面复苏仍需时间。',
  },
  {
    title: '原油价格受OPEC+减产支撑',
    summary: 'OPEC+延长减产协议，原油价格维持高位',
    detail: 'OPEC+成员国同意将现有减产协议延长至下半年，叠加夏季出行旺季需求预期，布伦特原油价格维持在82-86美元/桶区间。能源股受益于高油价环境，分红收益率具有吸引力。但需关注全球经济增长放缓对原油需求的潜在影响，以及新能源替代的长期趋势。',
  },
  {
    title: '人民币汇率企稳回升',
    summary: '人民币对美元汇率企稳，双向波动成常态',
    detail: '在岸人民币对美元汇率在7.20-7.25区间窄幅波动，较前期低点有所回升。中美利差收窄、出口企业结汇需求增加、以及央行稳汇率政策工具共同发挥作用。外汇局表示将保持人民币汇率在合理均衡水平上的基本稳定，预计下半年人民币有望小幅走强。',
  },
  {
    title: '央行开展逆回购操作，流动性保持充裕',
    summary: '央行继续开展逆回购操作，维护市场流动性合理充裕',
    detail: '人民银行今日开展逆回购操作，中标利率维持不变，实现净投放。市场利率围绕政策利率波动，DR007在合理区间运行。央行货币政策执行报告强调将精准有力实施稳健货币政策，保持流动性合理充裕，引导金融机构加大对实体经济的支持力度。',
  },
  {
    title: '新能源板块迎来政策利好',
    summary: '风光大基地建设提速，新能源产业链受益',
    detail: '国家能源局发布最新数据，大型风电光伏基地建设进度加快，第一批项目已全部开工。光伏产业链价格企稳，组件排产环比提升。风电招标量同比大幅增长，海风项目进入密集施工期。机构认为新能源板块估值已消化充分，龙头企业配置价值凸显。',
  },
  {
    title: '消费电子需求回暖，半导体周期复苏',
    summary: '全球消费电子出货量回升，半导体行业景气度改善',
    detail: '最新数据显示全球智能手机出货量连续两个季度同比增长，PC市场也出现企稳迹象。半导体行业协会报告称全球芯片销售额环比持续增长，存储芯片价格反弹明显。国内半导体设备国产化率稳步提升，成熟制程产能利用率回升至80%以上。',
  },
  {
    title: '债券市场走强，收益率曲线平坦化',
    summary: '国债收益率下行，债券市场配置需求旺盛',
    detail: '10年期国债收益率下行至近期低点，收益率曲线呈现平坦化趋势。机构配置需求旺盛，理财、保险等资金持续增配利率债。信用债方面，城投债利差收窄，高等级信用债需求强劲。分析认为在经济温和复苏背景下，债券市场仍有配置价值。',
  },
  {
    title: '港股科技板块估值修复',
    summary: '港股科技股反弹，互联网企业盈利改善',
    detail: '恒生科技指数近期表现强势，主要互联网企业一季度财报普遍超预期。电商、游戏、广告等核心业务收入增速回升，降本增效成果显现。南向资金加速流入，部分机构上调港股科技板块评级。分析指出互联网行业已度过最严监管周期，估值修复行情有望延续。',
  },
  {
    title: '新能源汽车销量持续增长',
    summary: '新能源汽车渗透率创新高，自主品牌表现亮眼',
    detail: '乘联会数据显示新能源汽车零售渗透率持续攀升，自主品牌市场份额进一步扩大。头部车企新品周期强劲，智能化配置成为差异化竞争关键。动力电池成本持续下降，助推整车价格竞争力提升。出口方面，中国新能源汽车在全球市场份额稳步增长，东南亚和欧洲市场表现突出。',
  },
  {
    title: '全球央行购金热潮持续',
    summary: '各国央行加速增持黄金，多元化储备趋势明确',
    detail: '世界黄金协会最新报告显示，全球央行购金量维持高位，新兴市场国家增持尤为积极。分析认为去美元化趋势和地缘政治不确定性是主要驱动力。黄金ETF持仓量回升，散户投资者对黄金关注度提升。机构建议在投资组合中配置5-10%的黄金资产以对冲尾部风险。',
  },
  {
    title: '数字经济政策密集出台',
    summary: '数据要素市场化改革加速，数字经济迎新机遇',
    detail: '国家数据局发布数据要素市场化配置改革方案，明确数据产权、流通交易、收益分配等基础制度框架。数据资产入表政策落地，企业数据资产价值重估预期升温。云计算、大数据、网络安全等数字经济基础设施领域有望受益。机构预计十四五期间数字经济核心产业增加值占GDP比重将超过10%。',
  },
  {
    title: '美联储缩表节奏或将调整',
    summary: '市场关注美联储缩表进程，流动性预期改善',
    detail: '美联储官员近期表态暗示可能放缓缩表步伐（QT taper），市场对此反应积极。分析认为放缓缩表有助于缓解国债市场流动性压力，降低金融体系风险。对全球资本市场而言，美联储资产负债表政策边际放松将改善全球流动性环境，利好风险资产估值。',
  },
  {
    title: '医药板块触底反弹信号初现',
    summary: '创新药出海提速，医药板块估值吸引力提升',
    detail: '国产创新药海外授权交易数量和金额均创新高，多个重磅品种获得FDA批准上市。国内集采政策边际缓和，仿制药企业盈利预期改善。CXO板块海外需求回暖，龙头企业新签订单环比增长。医药板块经历两年调整后估值处于历史低位，机构配置比例开始回升。',
  },
  {
    title: 'ESG投资理念加速普及',
    summary: '可持续金融发展迅速，ESG投资规模持续扩大',
    detail: '国内ESG基金规模突破新高，银行理财子公司加速布局ESG产品线。上市公司ESG信息披露率稳步提升，央企已率先实现全覆盖。碳市场建设提速，碳配额价格稳中有升。分析指出ESG投资正从小众策略走向主流，长期资金配置意愿增强。',
  },
  {
    title: '军工板块订单预期改善',
    summary: '国防预算稳定增长，军工企业订单可见度提升',
    detail: '国防预算保持稳健增长，装备采购支出占比持续提升。军工企业合同负债和预收账款规模增长，预示未来订单交付确定性强。航空发动机、精确制导、军用电子等细分领域景气度较高。机构建议关注具有核心技术和稀缺资质的军工龙头企业。',
  },
  {
    title: '基础设施REITs扩容提速',
    summary: '公募REITs市场扩容，盘活存量资产渠道拓宽',
    detail: '公募REITs试点范围扩大至消费基础设施、文旅等领域，新申报项目数量显著增加。已上市REITs产品二级市场表现分化，优质底层资产更受青睐。机构认为REITs作为中等风险收益特征的资产类别，在低利率环境下具有配置吸引力。普通投资者可通过REITs分享基础设施项目的稳定现金流收益。',
  },
  {
    title: '跨境理财通业务稳步推进',
    summary: '粤港澳大湾区跨境理财通2.0落地，互联互通深化',
    detail: '跨境理财通2.0版本正式实施，个人投资额度提升，产品范围扩大至中高风险等级。试点银行数量增加，业务办理流程优化。市场认为跨境理财通是人民币国际化和资本账户开放的重要一步，有助于满足大湾区居民多元化资产配置需求。',
  },
  {
    title: '电力市场化改革深化',
    summary: '电力现货市场建设加快，电价信号引导投资预期',
    detail: '电力现货市场在全国范围内推广，市场化交易电量占比持续提升。分时电价机制完善，峰谷价差扩大有利于储能等调节性资源发展。绿电交易规模扩大，企业绿电消费需求旺盛。分析认为电力市场化改革将重塑电力行业投资逻辑，具有灵活调节能力的电源资产价值重估。',
  },
  {
    title: '机器人产业迎来发展窗口期',
    summary: '人形机器人产业化提速，核心零部件需求爆发',
    detail: '国内外科技巨头加速布局人形机器人赛道，产业化进程超出市场预期。减速器、伺服电机、力传感器等核心零部件国产替代空间巨大。制造业机器人密度持续提升，服务机器人应用场景不断拓展。机构认为机器人产业链是继智能手机和新能源汽车之后的下一个万亿级赛道。',
  },
];

// —— Summary templates ——
const SUMMARY_TEMPLATES = [
  (date, a) => `全球市场在${date}呈现${a.usdDirection}格局。${a.usdDesc}；亚太市场${a.asiaDesc}；欧洲市场${a.euDesc}。建议投资者${a.advice}。`,
  (date, a) => `${date}，国际金融市场${a.marketMood}。美元${a.usdShort}，人民币${a.cnyShort}。A股${a.ashareShort}。${a.keyTip}。`,
  (date, a) => `${date}全球市场${a.overallTrend}。美国方面${a.usMacro}；国内方面${a.cnMacro}。综合来看，${a.conclusion}。`,
  (date, a) => `${date}市场${a.sentiment}。${a.leadSentence}。外汇市场${a.fxDesc}，股票市场${a.equityDesc}。${a.positionTip}。`,
];

// —— Takeaways pool ——
const TAKEAWAYS_POOL = [
  '美联储降息预期升温，美元走弱为新兴市场提供支撑',
  'A股政策面持续发力，北向资金保持净流入态势',
  'AI产业链持续活跃，但需关注估值风险',
  '建议哑铃型配置：优质蓝筹打底 + 科技成长增强',
  '全球央行增持黄金，多元化储备趋势加速',
  '国内消费刺激政策持续加码，内需复苏可期',
  '人民币汇率弹性增强，双向波动成为常态',
  '新能源产业链估值消化充分，布局窗口渐近',
  '债券市场配置需求旺盛，关注久期管理',
  '关注企业盈利改善进度，警惕估值与基本面背离',
  '国际油价维持区间震荡，能源板块关注分红价值',
  '房地产市场政策底已现，关注结构性机会',
  '港股估值仍处低位，南向资金持续布局',
  '半导体周期复苏信号增多，关注龙头公司',
  '数字经济政策密集落地，数据要素价值重估',
  '保持仓位灵活，逢低分批布局优于追涨',
];

function analyzeMarket(rates) {
  const hasData = rates && rates.CNY;
  const usdCny = hasData ? (1 / rates.CNY) : 7.25;
  const usdBaseline = 7.25;
  const diff = usdCny - usdBaseline;

  let usdDirection, usdDesc, usdShort, cnyShort;
  if (diff > 0.05) {
    usdDirection = '美元走强';
    usdDesc = '美元指数延续强势，人民币汇率承压';
    usdShort = '维持强势';
    cnyShort = '有所走弱';
  } else if (diff < -0.05) {
    usdDirection = '美元走弱';
    usdDesc = '美元指数走势偏软，人民币汇率获得支撑';
    usdShort = '偏弱震荡';
    cnyShort = '小幅走强';
  } else {
    usdDirection = '窄幅震荡';
    usdDesc = '美元指数在近期区间内波动，市场等待更多数据指引';
    usdShort = '区间整理';
    cnyShort = '基本稳定';
  }

  const moods = ['情绪谨慎但风险偏好有所改善', '多空交织，市场等待明确方向', '风险偏好温和回升', '投资者情绪分化明显'];
  const asiaDescs = ['受国内政策利好推动，市场情绪回暖', '呈现震荡整理态势，成交量维持活跃', '表现韧性十足，资金持续流入', '板块轮动加快，结构性机会凸显'];
  const euDescs = ['通胀粘性仍存，欧央行政策路径不明朗', '经济数据喜忧参半，市场关注PMI数据', '制造业疲软但服务业保持扩张', '受全球贸易预期影响，波动有所加大'];
  const advices = ['保持多元配置，关注优质资产回调中的布局机会', '适度控制仓位，关注业绩确定性强的板块', '维持哑铃策略，兼顾防御与成长', '逢低分批布局，避免追高杀跌'];

  return {
    usdDirection, usdDesc, usdShort, cnyShort, hasData,
    marketMood: moods[Math.abs(Math.floor(diff * 100)) % moods.length],
    asiaDesc: asiaDescs[Math.abs(Math.floor(diff * 100)) % asiaDescs.length],
    euDesc: euDescs[Math.abs(Math.floor(diff * 100)) % euDescs.length],
    advice: advices[Math.abs(Math.floor(diff * 100)) % advices.length],
    overallTrend: diff > 0 ? '风险偏好有所承压' : '总体风险偏好改善',
    usMacro: diff > 0 ? '经济数据韧性超预期，高利率环境或维持更久' : '通胀回落趋势延续，市场博弈降息时点',
    cnMacro: '政策面持续发力，稳增长措施逐步显效，企业盈利预期改善',
    conclusion: diff > 0 ? '短期外部压力尚存，但国内基本面改善趋势未变，建议逢低布局优质资产' : '内外环境共振改善，市场结构性机会增多，建议积极把握轮动节奏',
    sentiment: diff > 0 ? '震荡整理，情绪偏谨慎' : '整体偏暖，交投活跃度提升',
    leadSentence: diff > 0 ? '外部不确定性压制风险偏好，但国内政策托底信号明确' : '内外利好共振，市场信心逐步修复',
    fxDesc: diff > 0 ? '美元偏强，非美货币承压' : '美元走弱，非美货币普遍反弹',
    equityDesc: diff > 0 ? '呈现分化，防御板块相对占优' : '多数上涨，成长和价值轮动表现',
    positionTip: diff > 0 ? '建议控制仓位，以防御性配置为主，等待右侧信号' : '可适度提升风险暴露，关注科技和消费板块机会',
    ashareShort: diff > 0 ? '震荡整理，结构性行情延续' : '交投活跃，市场信心修复',
    keyTip: diff > 0 ? '建议关注高股息和必选消费等防御方向' : '可关注科技成长和消费复苏的轮动机会',
  };
}

function generateBrief(forexData) {
  const rates = forexData && forexData.rates ? forexData.rates : {};
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const seed = dateSeed(dateStr);
  const rng = seededRandom(seed);

  // Compute live forex rates (with fallbacks)
  const usdCny = rates.CNY ? (1 / rates.CNY).toFixed(4) : '7.25';
  const eurCny = rates.CNY && rates.EUR ? (rates.EUR / rates.CNY).toFixed(4) : '7.98';
  const jpyCny = rates.CNY && rates.JPY ? (rates.JPY / rates.CNY * 100).toFixed(4) : '4.82';
  const gbpCny = rates.CNY && rates.GBP ? (rates.GBP / rates.CNY).toFixed(4) : '9.15';

  // Market analysis from real data
  const analysis = analyzeMarket(rates);

  // Date-driven summary (cycle through templates)
  const summaryTemplate = SUMMARY_TEMPLATES[seed % SUMMARY_TEMPLATES.length];
  const summary = summaryTemplate(dateStr, analysis);

  // Date-driven takeaways (pick 4 from 16)
  const takeaways = pickBySeed(TAKEAWAYS_POOL, 4, seed + 1);

  // Date-driven highlights (pick 8 from 24)
  const highlights = pickBySeed(HIGHLIGHT_POOL, 8, seed + 2);

  // Date-driven related topics (pick 6 from a rotating pool)
  const topicPool = ['市盈率', '指数基金', '资产配置', '降准', 'ETF', 'K线', '定投', '复利', '止损止盈', 'MACD', '蓝筹股', '风险分散', '仓位管理', 'PE', 'PB', 'ROE', '牛熊市', '可转债', 'M2', 'GDP', 'CPI', 'PMI', '通货膨胀', '加息'];
  const relatedTopics = pickBySeed(topicPool, 6, seed + 3);

  // Dynamic fullAnalysis sections
  const usdSection = analysis.hasData
    ? `实时汇率数据显示，美元/人民币报${usdCny}，${analysis.usdDesc}。`
    : `美元/人民币参考汇率报${usdCny}。${analysis.usdDesc}。`;

  const sections = [
    {
      header: '宏观环境',
      body: `${usdSection}美联储政策路径仍是市场核心关注点，通胀和就业数据将继续主导市场对降息时点和幅度的定价。欧元区方面，${analysis.euDesc}。国内方面，${analysis.cnMacro}`,
    },
    {
      header: 'A股市场',
      body: `A股市场${analysis.asiaDesc}。从板块表现看，科技成长和消费复苏主线轮动活跃，北向资金配置意愿增强。投资者需关注企业盈利改善的持续性，以及政策落地的实际效果。成交量方面，市场交投保持活跃，万亿以上成交额成为常态。`,
    },
    {
      header: '港股市场',
      body: '恒生指数在科技股和金融股轮动带动下呈现震荡格局。南向资金保持净流入，互联网平台企业盈利修复预期支撑板块估值。港股相较于全球主要市场仍具备估值优势，中长期配置价值受到机构认可。',
    },
    {
      header: '美股市场',
      body: '标普500和纳斯达克指数在高位震荡，科技股财报表现分化。AI相关产业链仍是市场核心主线，但投资者对高估值标的的容忍度有所下降。降息预期变化是影响美股短期走势的关键变量。',
    },
    {
      header: '大宗商品',
      body: '国际金价在地缘政治不确定性和降息预期双重支撑下维持高位，全球央行购金趋势延续。原油价格受OPEC+供给管理和全球需求预期影响，在区间内波动。工业金属价格受中国需求预期影响，呈现震荡格局。',
    },
    {
      header: '投资策略',
      body: `综合当前宏观环境和市场特征，${analysis.advice}。关注方向包括：科技创新（AI、半导体）、消费复苏（出行、餐饮）、高股息（银行、公用事业）、以及新能源产业链的底部布局机会。风险方面需关注海外衰退风险、地缘政治扰动和汇率波动对资产的传导影响。`,
    },
  ];
  const fullAnalysis = sections.map(s => `【${s.header}】\n${s.body}`).join('\n\n');

  return {
    date: dateStr,
    updateTime: now.toISOString(),
    summary,
    fullAnalysis,
    takeaways,
    forex: {
      usdCny: { pair: '美元/人民币', rate: usdCny, change: forexChange(rng, -0.3, 0.3) },
      eurCny: { pair: '欧元/人民币', rate: eurCny, change: forexChange(rng, -0.3, 0.4) },
      jpyCny: { pair: '日元/人民币(100)', rate: jpyCny, change: forexChange(rng, -0.4, 0.4) },
      gbpCny: { pair: '英镑/人民币', rate: gbpCny, change: forexChange(rng, -0.3, 0.3) },
    },
    indices: [
      { name: '上证指数', value: (3258 + rng() * 60 - 30).toFixed(2), change: forexChange(rng, -1.2, 1.5) },
      { name: '深证成指', value: (11200 + rng() * 250 - 125).toFixed(2), change: forexChange(rng, -1.5, 2.0) },
      { name: '恒生指数', value: (19500 + rng() * 400 - 200).toFixed(2), change: forexChange(rng, -1.5, 2.0) },
      { name: '标普500', value: (5300 + rng() * 50 - 25).toFixed(2), change: forexChange(rng, -0.8, 1.0) },
      { name: '纳斯达克', value: (16800 + rng() * 200 - 100).toFixed(2), change: forexChange(rng, -1.2, 1.5) },
    ],
    highlights,
    source: {
      provider: 'QPP市场研究',
      disclaimer: '以上内容仅供参考，不构成投资建议。市场有风险，投资需谨慎。',
      updatedAt: now.toISOString(),
    },
    relatedTopics,
  };
}

exports.main = async (event) => {
  const force = event && event.force;

  try {
    if (!force) {
      const cached = await db.collection(CACHE_COLLECTION).orderBy('updateTime', 'desc').limit(1).get();
      if (cached.data.length > 0) {
        const age = Date.now() - new Date(cached.data[0].updateTime).getTime();
        if (age < CACHE_TTL) {
          return { brief: cached.data[0] };
        }
      }
    }

    let forexData = null;
    try {
      forexData = await fetchJson('https://open.er-api.com/v6/latest/USD');
    } catch (e) {
      console.warn('Failed to fetch forex data, using defaults:', e.message);
    }

    const brief = generateBrief(forexData);

    try {
      await db.collection(CACHE_COLLECTION).add({ data: brief });
    } catch (e) {
      console.warn('Failed to cache brief:', e.message);
    }

    return { brief };
  } catch (err) {
    console.error('getMarketBrief error:', err);
    const brief = generateBrief(null);
    return { brief, error: err.message };
  }
};
