var mongoose = require('mongoose');
var VoteSchema = require('./schema');

VoteSchema.method('verb', function() {
  return 'voted on';
});

module.exports = {schema: VoteSchema};