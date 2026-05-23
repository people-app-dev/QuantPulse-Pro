const db = wx.cloud.database();
const _ = db.command;

function getPostsCollection() {
  return db.collection('posts');
}

function getAssessmentsCollection() {
  return db.collection('assessments');
}

function getUsersCollection() {
  return db.collection('users');
}

function getCommentsCollection() {
  return db.collection('comments');
}

function callFunction(name, data = {}) {
  return wx.cloud.callFunction({ name, data });
}

module.exports = {
  db,
  _,
  getPostsCollection,
  getAssessmentsCollection,
  getUsersCollection,
  getCommentsCollection,
  callFunction,
};
