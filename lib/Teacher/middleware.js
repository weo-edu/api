var middleware = module.exports;
var errors = require('lib/errors');

/*
  Policy middleware to ensure that a student belongs to
  a particular teacher
 */
middleware.isTeacherOf = function(req, res, next) {
  if(! req.student)
    return next('isTeacherOf requires req.student');
  if(! req.me)
    return next('isTeacherOf requires req.me');

  req.me.isTeacherOf(req.student, function(isTeacherOf) {
    isTeacherOf
      ? next()
      : next(errors.Authorization('You are not a teacher of that student'));
  });
};