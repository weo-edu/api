var inject = require('express-inject-latency')({mean: 500, variance: 1});
exports.always = inject({mean: 500, variance: 1});

exports.byParam = function(req, res, next) {
  req.query.hasOwnProperty('latency')
    ? inject.apply(this, arguments)
    : next();
};
