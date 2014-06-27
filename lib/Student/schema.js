var Schema = require('mongoose').Schema;

var StudentSchema = module.exports = new Schema({
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