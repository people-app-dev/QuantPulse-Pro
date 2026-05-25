/**
 * SVG icon definitions for tab bar. Each returns raw SVG markup.
 * selected=true returns filled variant, false returns stroked outline.
 */

const icons = {
  home: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`;
  },

  invest: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`;
  },

  mine: (selected) => {
    const color = selected ? '#007AFF' : '#8E8E93';
    const fill = selected ? color : 'none';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="3"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/></svg>`;
  },
};

/** Convert SVG string to base64 data URI for <image> tag */
function toDataUri(svgString) {
  const base64 = base64Encode(svgString);
  return 'data:image/svg+xml;base64,' + base64;
}

function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const bytes = unescape(encodeURIComponent(str));
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i);
    const b = bytes.charCodeAt(i + 1);
    const c = bytes.charCodeAt(i + 2);
    output += chars[a >> 2];
    output += chars[((a & 3) << 4) | (b >> 4)];
    output += isNaN(b) ? '=' : chars[((b & 15) << 2) | (c >> 6)];
    output += isNaN(b) || isNaN(c) ? '=' : chars[c & 63];
  }
  return output;
}

function getTabIconUris() {
  return {
    home: { on: toDataUri(icons.home(true)), off: toDataUri(icons.home(false)) },
    invest: { on: toDataUri(icons.invest(true)), off: toDataUri(icons.invest(false)) },
    mine: { on: toDataUri(icons.mine(true)), off: toDataUri(icons.mine(false)) },
  };
}

module.exports = { icons, toDataUri, getTabIconUris };
