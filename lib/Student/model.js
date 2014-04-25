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

module.exports = User.discriminator('student', StudentSchema);