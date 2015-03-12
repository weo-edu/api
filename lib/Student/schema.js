var Schema = require('mongoose').Schema;
var StudentSchema = new Schema({
  name: {
    givenName: {
      type: String,
      required: true
    },
    familyName: {
      type: String,
      required: true
    }
  }
}, {discriminatorKey: 'userType', id: true, _id: true});

StudentSchema.pre('save', function(next) {
  this.userType = 'student';
  next();
});

StudentSchema.pre('validate', function(next) {
  if(! this.email)
    this.email = undefined;
  next();
});

module.exports = StudentSchema;