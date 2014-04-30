var mongoose = require('mongoose');
var TeacherSchema = require('./schema')(mongoose.Schema);

TeacherSchema.path('email').index({unique: true});
// We have to do a custom username validation to get it to throw
// as a ValidationError rather than a MongoError
TeacherSchema.path('email').validate(function(value, done) {
  if (!this.isNew) return done(true);
  this.model('User').count({email: value}, function(err, count) {
    if(err) return done(err);
    done(! count);
  });
}, 'Email already exists');

var User = require('lib/User').model;
module.exports = User.discriminator('teacher', TeacherSchema);



