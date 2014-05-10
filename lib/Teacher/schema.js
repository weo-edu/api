var validations = require('lib/validations');
/*
  This schema is intended to inherit from the User schema, and so
  only specifies the things that differ from that schema
 */
module.exports = function(Schema) {
  var TeacherSchema = new Schema({
    name: {
      honorificPrefix: {
        type: String,
        required: true,
      }
    },
    email: {
      type: String,
      required: true,
    },
  }, {discriminatorKey: 'userType', id: true, _id: true});

  TeacherSchema.pre('save', function(next) {
    this.userType = 'teacher';
    next();
  });

  return TeacherSchema;
};