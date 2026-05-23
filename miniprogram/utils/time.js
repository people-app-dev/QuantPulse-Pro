function formatTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  if (isNaN(date)) return dateStr;
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return minutes + '分钟前';
  if (hours < 24) return hours + '小时前';
  if (days === 1) return '昨天';
  if (days < 7) return days + '天前';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

module.exports = { formatTime };
