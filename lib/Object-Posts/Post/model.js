var mongoose = require('mongoose');
var PostSchema = require('./schema')(mongoose.Schema);

PostSchema.method('verb', function() {
  return 'shared';
});

module.exports = {schema: PostSchema}