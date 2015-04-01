let {curry} = require('ramda');

exports.setup = curry(function(isNew, id) {
  this.state.isNew = isNew;
  this.state.id = id;
  this.state.originalRecord = originalRecord;
});