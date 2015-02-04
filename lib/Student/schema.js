var Schema = require('mongoose').Schema;
var StudentSchema = new Schema({
  name: {
    honorificPrefix: {
      type: String,
      required: true,
      default: 'None'
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