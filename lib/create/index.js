let db = require('lib/db-methods');

exports.setup = function() {
  this.state.isNew = true;
  this.state.newRecord = this.body;
};

exports.execute = function(collection) {
  return db.insert(collection);
};