var validations = require('lib/validations');
var Schema = require('mongoose').Schema;
/*
  This schema is intended to inherit from the User schema, and so
  only specifies the things that differ from that schema
 */
var TeacherSchema = module.exports = new Schema({
  name: {
    honorificPrefix: {
      type: String,
      required: true,
    }
  },
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