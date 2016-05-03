var inject = require('express-inject-latency')({mean: 300, variance: 900});
exports.always = inject;

exports.byParam = function(req, res, next) {
  req.query.hasOwnProperty('latency')
    ? inject.apply(this, arguments)
    : next();
};
