module.exports = function(Model, values, cb) {
  for (var key in Model.attributes) {
    if(values[key] === undefined && Model.attributes[key].hasOwnProperty('defaultsTo')) {
        var defaultObj = Model.attributes[key].defaultsTo;
        var defaultValue = typeof defaultObj === 'function' ? defaultObj(values) : defaultObj;
        values[key] = _.clone(defaultValue);
      }
  }
  values = Model._cast.run(values);
  Model.validate(values, function(err) {
    cb(err, values);
  });
}