var inject = require('express-inject-latency')({mean: 0, variance: 500});
exports.always = inject;

exports.byParam = function(req, res, next) {
  req.query.hasOwnProperty('latency')
    ? inject.apply(this, arguments)
    : next();
};
