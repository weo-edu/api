var mongoose = require('mongoose');
var AssignmentSchema = require('./schema')(mongoose.Schema);
var Seq = require('seq');
var _ = require('lodash');

AssignmentSchema.method('verb', function() {
  return 'assigned';
});

module.exports = {schema: AssignmentSchema};









