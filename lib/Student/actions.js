var Student = require('./model');
var actions = module.exports;

require('lib/crud')(actions, Student);

actions.setPassword = function(req, res, next) {
  req.student.password = req.param('newPassword');
  req.student.save(function(err) {
    if(err) return next(err);
    res.send(200);
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
