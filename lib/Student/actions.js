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

actions.create = function(req, res, next) {
  var model = new Student(req.body);
  var password = req.body.password;

  model.save(function(err, model) {
    if(err) return next(err);
    // Send the unhashed password back on create only
    var o = model.toJSON();
    o.password = password;
    res.send(201, o);
  });
};
