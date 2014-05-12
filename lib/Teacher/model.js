var mongoose = require('mongoose');
var TeacherSchema = require('./schema')(mongoose.Schema);

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

var Teacher = module.exports = User.discriminator('teacher', TeacherSchema);