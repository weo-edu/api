var middleware = module.exports;
var user = require('lib/User');

/*
  Policy middleware to ensure that a student belongs to
  a particular teacher
 */
middleware.isTeacherOf = function(req, res, next) {
  if(! req.student)
    return next('isTeacherOf requires req.student');

  // In order to be a teacher of someone, you must first be
  // a teacher
  user.middleware.is('teacher')(req, res, function(err) {
    if(err) return next(err);

    req.student.hasTeacher(req.auth.id, function(err, has) {
      if(! has) return res.send(403);
      next();
    });
  });
};