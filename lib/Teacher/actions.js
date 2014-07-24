var actions = module.exports;
var Teacher = require('./model');


require('lib/crud')(actions, Teacher);

actions.create = function(req, res, next) {
  var model = new Teacher(req.body);
  var password = req.body.password;
  model.save(function(err, model) {
    if(err) return next(err);
    // Send the unhashed password back on create only
    var o = model.toJSON();
    o.password = password;
    res.send(201, o);
  });
};