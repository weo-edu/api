var mongoose = require('mongoose');
var FormSchema = require('./schema');
var Seq = require('seq');
var _ = require('lodash');
var config = require('lib/config');
var qs = require('querystring');

FormSchema.method('verb', function() {
  return 'assigned';
});

FormSchema.pre('validate', function(next) {
  this.setSelfLink('progress');
  this.setSelfLink('replies');
  next();
});



var Form = module.exports = {schema: FormSchema};








