var Student = require('./model');
var actions = module.exports;

require('lib/crud')(actions, Student);

actions.setPassword = function(req, res, next) {
  req.student.password = req.param('newPassword');
  req.student.save(function(err, student) {
    if(err) return next(err);
    res.send(200, student);
  });
};

actions.setUsername = function(req, res, next) {
  req.student.username = req.param('newUsername');
  req.student.save(function(err, student) {
    if(err) return next(err);
    res.send(200, student);
  });
};

actions.setDisplayName = function(req, res, next) {
  req.student.displayName = req.param('newDisplayName');
  req.student.save(function(err, student) {
    if(err) return next(err);
    res.send(200, student);
  });
};