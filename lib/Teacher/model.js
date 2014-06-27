var TeacherSchema = require('./schema');

var User = require('lib/User').model;

/**
 * We have to redefine this here in teacher model because
 * teacher redefines the email path (to add required)
 */
TeacherSchema.path('email').index({unique: true, sparse: true});
TeacherSchema.path('email').validate(function(value, done) {
  if((this.isModified('email') || this.isNew) && value) {
    User.count({_id: {$ne: this._id}, email: value}, function(err, count) {
      if(err) return done(err);
      done(! count);
    });
  } else
    done(true);
}, 'Email already exists', 'unique');

module.exports = User.discriminator('teacher', TeacherSchema);