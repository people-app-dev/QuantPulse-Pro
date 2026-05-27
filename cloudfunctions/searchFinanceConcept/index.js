const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const knowledge = require('./knowledge-base');

exports.main = async (event) => {
  const { keyword, category, exactId } = event;

  // Direct ID lookup — used by concept-detail page for reliable loading
  if (exactId) {
    const item = knowledge.find(k => k.id === exactId);
    if (!item) return { success: false, error: '概念未找到' };
    return { success: true, data: [item] };
  }

  if (!keyword || !keyword.trim()) {
    let pool = knowledge;
    if (category) pool = pool.filter(k => k.category === category);
    const popular = pool.slice(0, 12).map(item => ({
      id: item.id,
      category: item.category,
      concept: item.concept,
      short: item.short,
      tags: item.tags,
    }));
    return { success: true, data: popular };
  }

  const kw = keyword.trim().toLowerCase();
  const results = [];

  for (const item of knowledge) {
    if (category && item.category !== category) continue;

    const searchText = (item.id + ' ' + item.concept + ' ' + item.tags.join(' ') + ' ' + item.short).toLowerCase();
    const idx = searchText.indexOf(kw);
    if (idx === -1) continue;

    let relevance = 0;
    if (item.concept.toLowerCase().indexOf(kw) !== -1) relevance = 3;
    else if (item.tags.some(t => t.toLowerCase().indexOf(kw) !== -1)) relevance = 2;
    else relevance = 1;

    results.push({
      id: item.id,
      category: item.category,
      concept: item.concept,
      tags: item.tags,
      short: item.short,
      detail: item.detail,
      relevance,
    });
  }

  results.sort((a, b) => b.relevance - a.relevance);

  return { success: true, data: results.slice(0, 20), keyword };
};
