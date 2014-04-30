var mongoose = require('mongoose');
var TeacherSchema = require('./schema')(mongoose.Schema);
// Inherit from user
var User = require('lib/User').model;

TeacherSchema.path('username').index({unique: true});
// We have to do a custom username validation to get it to throw
// as a ValidationError rather than a MongoError
TeacherSchema.path('username').validate(function(value, done) {
  this.model('User').count({username: value}, function(err, count) {
    if(err) return done(err);
    done(! count);
  });
}, 'Username already exists');

module.exports = User.discriminator('teacher', TeacherSchema);