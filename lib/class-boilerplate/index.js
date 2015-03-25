/**
 * Modules
 */
var async = require('async');
var _ = require('lodash');

/**
 * Libs
 */

var Group = require('lib/Group/model');
var User = require('lib/User/model');
var Student = require('lib/Student/model');
var Share = require('lib/Share/model');
var STATUS = require('lib/Share/status');

var boilerPlate = require('./boilerplate.json');

var group = boilerPlate.class;
var assignment = processAssignment(boilerPlate.assignment);
var students = processStudents(boilerPlate.students);


/**
 * Exports
 */
module.exports = createBoilerplate;

createBoilerplate.action = middlewareAction;


/**
 * create class from boilerplate
 * @param  {User}   user user to create test for
 * @param  {Function} cb   pass newly created class and shareId
 */
function createBoilerplate(user, cb) {
  var payload = {};
  async.waterfall([
    function(cb) { cb(null, payload); },
    createGroup(group, user.toKey()),
    createShare(assignment, user.toKey()),
    createStudents(students),
    respondToAssignment(students)
  ], function(err) {
    if (err) cb(err);
    else cb(null, payload.group, payload.share.id);
  });
}

/**
 * Action Middleware
 */

function middlewareAction(req, res, next) {
  createBoilerplate(req.me, function(err, group) {
    if (err) return next(err);
    res.send(group.toJSON());
  });
}

/**
 * Helpers
 */

function processStudents(studentsData) {
  var avatars = {};
  var responses = {};
  var students = studentsData.map(function(student) {
    var displayName = [student.name.givenName, student.name.familyName].join(' ');
    avatars[displayName] = student.avatar;
    responses[displayName] = student.responses;
    return _.omit(student, 'avatar', 'responses');
  });
  return {
    data: students,
    getAvatar: function(name) {
      return avatars[name];
    },
    getResponses: function(name) {
      return responses[name];
    }
  };
}

function processAssignment(assignment) {
  assignment.published = true;
  return assignment;
}

function createGroup(group, owner) {
  return function(payload, cb) {
    group = new Group(group);
    group.owners.push(owner);
    group.save(function(err, group) {
      payload.group = group;
      cb(err, payload);
    });
  };
}

function createShare(assignment, owner) {
  return function(payload, cb) {
    var group = payload.group;
    assignment = _.clone(assignment);
    assignment.actor = owner;
    var share = new Share(assignment);
    share.withGroup(group);
    share.ourPost('save', function(share, next) {
      next();
      payload.share = share;
      cb(null, payload);
    });
    share.save(function(err) {
      if (err) cb(err);
    });
  };
}

function createStudents(studentsStore) {
  return function(payload, cb) {
    var group = payload.group;
    var students = studentsStore.data.map(function(student) {
      return new Student(student);
    });
    students.forEach(function(student) {
      student.groups = [group.toKey()];
    });
    async.series([
      function(cb) {
        async.each(students, function(student, done) {
          User.findUsernameLike({username: student.username, base: 6}, function(err, username) {
            if (err) throw err;
            student.username = username;
            done();
          });
        }, cb);
      },
      function(cb) {
        async.each(students, function(student, done) {
          // wait for post hooks to complete
          student.ourPost('save', function(student, next) {
            next();
            done(null, student);
          });
          student.save(function(err) {
            if (err) done(err);
          });
        }, cb);
      },
      function(cb) {
        async.each(students, function(student, done) {
          student.setAvatar(studentsStore.getAvatar(student.displayName), done);
        }, cb);
      },
      function(cb) {
        async.each(students, function(student, done) {
          student.save(done);
        }, cb);
      }

    ], function(err) {
      payload.students = students;
      cb(err, payload);
    });
  };
}



function respondToAssignment(studentsStore) {
  return function(payload, cb) {
    var share = payload.share;
    var students = payload.students;
    var group = payload.group;

    async.waterfall([
      function(cb) {
        async.map(students, function(student, done) {
          var instance = share.createInstance({context: group.id, user: student});
          instance.ourPost('save', function(instance, next) {
            next();
            done(null, instance);
          });
          instance.save(function(err) {
            if (err) done(err);
          });
        }, cb);
      },
      function(instances, cb) {
        async.each(instances, function(instance, done) {
          var questionIdx = 0;
          var responses = studentsStore.getResponses(instance.actor.displayName);
          instance.object.attachments.forEach(function(attachment) {
            if (attachment.objectType === 'question') {
              var response = responses[questionIdx];
              if (response)
                attachment.response = response;
              questionIdx++;
            }
          });

         if (_.all(responses)) {
            instance.status = STATUS.turnedIn;
          }

          instance.save(done);
        }, cb);
      }
    ], cb);
  };
}