var mongoose = require('mongoose');
var ObjectSchema = require('./schema');
var qs = require('querystring');

ObjectSchema.pre('validate', function(next) {
  if (!this._id) {
    this._id = new mongoose.Schema.Types.ObjectId;
  }
  next();
});

ObjectSchema.method('setSelfLink', function(property) {
  if (!this[property].selfLink) {
    this[property].selfLink = '/share?' + qs.stringify({channel: this.channel(property)});
  }
});

module.exports = {schema: ObjectSchema};