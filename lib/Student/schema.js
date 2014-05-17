var validations = require('lib/validations');
var Schema = require('mongoose').Schema;

var StudentSchema = module.exports = new Schema({},
  {discriminatorKey: 'userType', id: true, _id: true});

StudentSchema.pre('save', function(next) {
  this.userType = 'student';
  next();
});