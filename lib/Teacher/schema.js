var validations = require('lib/validations');
var Schema = require('mongoose').Schema;
var TeacherSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [
      validations.email,
      'Invalid email address',
      'email'
    ]
  }
}, {discriminatorKey: 'userType', id: true, _id: true});

TeacherSchema.pre('save', function(next) {
  this.userType = 'teacher';
  next();
});

module.exports = TeacherSchema;