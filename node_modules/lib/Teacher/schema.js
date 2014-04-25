var validations = require('lib/validations');
/*
  This schema is intended to inherit from the User schema, and so
  only specifies the things that differ from that schema
 */
module.exports = function(Schema) {
  var TeacherSchema = new Schema({
    username: {
      type: String,
      required: true,
      unique: true,
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

  TeacherSchema.virtual('fullname').get(function() {
    if(this.title !== 'None') {
      return this.title + ' ' + this.lastname;
    } else {
      return this.firstname + ' ' + this.lastname;
    }
  });

  TeacherSchema.virtual('email').get(function() {
    return this.username;
  }).set(function(val) {
    this.username = val;
  });

  TeacherSchema.path('username').index({unique: true});
  // We have to do a custom username validation to get it to throw
  // as a ValidationError rather than a MongoError
  TeacherSchema.path('username').validate(function(value, done) {
    this.model('User').count({username: value}, function(err, count) {
      if(err) return done(err);
      done(! count);
    });
  }, 'Username already exists');
  return TeacherSchema;
};