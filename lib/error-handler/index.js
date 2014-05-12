/*
  Middleware the handles all of our errors
 */

/**
 * error handling middleware
 */
var errors = require('lib/errors');

module.exports = function(opts) {
  opts = opts || {};
  return function(err, req, res, next) {
    if(! err) return next();

    if('string' === typeof err)
      err = errors.Server(err);

    // Mongoose doesn't put a status code on its errors, so
    // correct that here
    if(err.name === 'ValidationError' && ! err.status)
      err.status = 400;

    // Default to ServerError, because presumably any error
    // we get that doesn't have a name field is returned by
    // some service like mongo or redis that doesn't follow
    // our convention
    err.name = err.name || 'ServerError';

    // Default to 500 error
    err.status = err.status || 500;
    res.send(err.status, err);
  };
};