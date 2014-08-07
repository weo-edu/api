var middleware = module.exports;
var user = require('lib/User');
var errors = require('lib/errors');
var Group = require('lib/Group/model');
var _ = require('lodash');

/*
  Policy middleware to ensure that a student belongs to
  a particular teacher
 */
middleware.isTeacherOf = function(req, res, next) {
  if(! req.student)
    return next('isTeacherOf requires req.student');
  if(! req.me)
    return next('isTeacherOf requires req.me');


  // In order to be a teacher of someone, you must first be
  // a teacher
  user.middleware.is('teacher')(req, res, function(err) {
    if(err) return next(err);

    var overlap = _.intersection(req.student.groupIds, req.me.groupIds);
    Group.count()
      .where('_id').in(overlap)
      .where('owners.id', req.me.id)
      .exec(function(err, count) {
        if(err) return next(err);
        if(count === 0) return next(errors.Authorization('You are not a teacher of that student'));
        return next();
      });
  });
};