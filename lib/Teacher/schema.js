var validations = require('lib/validations');
/*
  This schema is intended to inherit from the User schema, and so
  only specifies the things that differ from that schema
 */
module.exports = function(Schema) {
  var TeacherSchema = new Schema({
    title: {
      type: String,
      required: true,
      enum: ['Mrs.', 'Ms.', 'Mr.', 'Dr.', 'None']
    },
    // email is required for teacher kind of annoying that
    // we have to duplicate the whole thing, but mongoose
    // doesn't merge it right otherwise
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [
        validations.email,
        'Invalid email address',
        'email'
      ]
    },
  }, {id: true, _id: true});

  // Override name in teacher because teacher's may have titles
  TeacherSchema.virtual('name').get(function() {
    var first = this.title === 'None' ? this.first_name : this.title;
    return [first, this.last_name].filter(Boolean).join(' ');
  });

  return TeacherSchema;
};