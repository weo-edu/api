var mongoose = require('mongoose');
var StudentSchema = require('./schema')(mongoose.Schema);
var User = require('lib/User').model;

/*
  Check if a student belongs to a group owned by a particular
  teacher
 */
StudentSchema.method('hasTeacher', function(teacherId, cb) {
  function hasTeacher(groups) {
    return groups.some(function(group) {
     return group.isOwner(teacherId);
    });
  }

  if(this.populated('groups')) {
    cb(null, hasTeacher(this.groups));
  } else {
    this.populate('groups', function(err, student) {
      cb(null, hasTeacher(student.groups));
    });
  }
});

StudentSchema.path('username').index({unique: true});
// We have to do a custom username validation to get it to throw
// as a ValidationError rather than a MongoError
StudentSchema.path('username').validate(function(value, done) {
  if(this.isModified('username')) {
    this.model('User').count({username: value}, function(err, count) {
      if(err) return done(err);
      done(! count);
    });
  } else
    done(true);

}, 'Username already exists');

module.exports = User.discriminator('student', StudentSchema);