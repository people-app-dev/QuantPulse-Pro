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
