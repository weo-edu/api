var mongoose = require('mongoose');
var ObjectSchema = require('./schema');

ObjectSchema.pre('validate', function(next) {
  if (!this._id) {
    this._id = new mongoose.Schema.Types.ObjectId;
  }
  next();
});

ObjectSchema.plugin(require('lib/schema-plugin-was-modified'));
module.exports = {schema: ObjectSchema};