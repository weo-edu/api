/*
  Middleware that decorates res with a mongoose
  error handler
 */
module.exports = function(req, res, next) {
  res.mongooseError = function(err) {
    if(err.name === 'ValidationError')
      res.send(400, err);
    else
      res.send(500, err);
  };

  next();
};
