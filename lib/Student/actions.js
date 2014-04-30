var Student = require('./model');
var actions = module.exports;

actions.setPassword = function(req, res, next) {
  req.student.password = req.param('newPassword');
  req.student.save(function(err) {
    if(err) return next(err);
    res.send(200);
  });
};

require('lib/crud')(actions, Student);