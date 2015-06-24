var inject = require('express-inject-latency')({mean: 1000, variance: 1});
exports.always = inject;

exports.byParam = function(req, res, next) {
  req.query.hasOwnProperty('latency')
    ? inject.apply(this, arguments)
    : next();
};