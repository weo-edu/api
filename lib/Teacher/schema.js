var validations = require('lib/validations');
/*
  This schema is intended to inherit from the User schema, and so
  only specifies the things that differ from that schema
 */
module.exports = function(Schema) {
  var TeacherSchema = new Schema({
    email: {
      type: String,
      required: true,
      // Must be lowercase to prevent people from sigining up tiwce
      lowercase: true,
      validate: [
        validations.email,
        'Must be a valid email address'
      ]
    },
    title: {
      type: String,
      required: true,
      validate: [
        validations.whitelist('Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None'),
        'Must select a title from the list'
      ]
    }
  }, {id: true, _id: true});

  TeacherSchema.virtual('name').get(function() {
    if(this.title !== 'None') {
      return this.title + ' ' + this.last_name;
    } else {
      return this.first_name + ' ' + this.last_name;
    }
  });

  
  return TeacherSchema;
};