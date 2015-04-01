let compose = require('mu-compose');
let action = require('action');
let diff = require('lib/action-diff');
let request = require('lib/request');
let db = require('lib/db-methods');

exports.setup = function(app) {
  return compose(
    function(id) {
      this.state.id = id;
      this.state.newRecord = this.body;
      this.state.isNew = false;
    },
    action(['id'], 'originalRecord', request.byId(app)),
    diff
  );
};

exports.execute = function(collection) {
  return compose(
    diff,
    action(['id', 'diff'], 'nowhere', db.updateById(collection))
  );
};