var validations = require('lib/validations');

module.exports = function(Schema) {
  var StudentSchema = new Schema({}, {discriminatorKey: 'userType', id: true, _id: true});
  StudentSchema.pre('save', function(next) {
    this.userType = 'student';
    next();
  });

  return StudentSchema;
};