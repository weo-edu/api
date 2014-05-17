var mongoose = require('mongoose');
var PostSchema = require('./schema');

PostSchema.method('verb', function() {
  return 'shared';
});

module.exports = {schema: PostSchema}