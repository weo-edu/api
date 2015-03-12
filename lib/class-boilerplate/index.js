/**
 * Modules
 */
var mongoose = require('mongoose');
var async = require('async');




/**
 * Libs
 */

var Group = require('lib/Group/model');
var Student = require('lib/Student/model');
var Share = require('lib/Share/model');
var User = require('lib/User/model');

var assignmentData = require('./assignment.json');
var groupData = require('./class.json');
var studentsData = require('./students.json').data;


/**
 * Exports
 */
module.exports = createBoilerplate;


function createBoilerplate(user, cb) {
  var group = new Group(groupData);
  var students = studentsData.map(function(student) {
    return new Student(student);
  });
  assignmentData.actor = user.toKey();
  assignmentData.published = true;
  var share = new Share(assignmentData);
  
  async.series([
    function(cb) {
      group.owners.push(user.toKey());
      group.save(cb)
    },
    function(cb) {
      students.forEach(function(student) {
        student.groups = [group.toKey()];
      });
      async.each(students, function(student, done) {
        User.findUsernameLike({username: student.username, base: 6}, function(err, username) {
          if (err) throw err;
          student.username = username;
          done();
        });
      }, function(err) {
        if (err) return cb(err);
        async.each(students, function(student, done) {
          student.save(done);
        }, cb);
      });
    },
    function(cb) {
      share.withGroup(group);
      share.save(cb)
    }
  ], function(err) {
    if (err) throw err;
    cb(null, share)
  })
}