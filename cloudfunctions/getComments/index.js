const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { postId } = event;
  const res = await db.collection('comments').where({ postId }).orderBy('createdAt', 'asc').get();
  return { comments: res.data };
};
