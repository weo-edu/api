/*
  Middleware that decorates res with a mongoose
  error handler
 */
module.exports = function(err, req, res, next) {
  if(err.name === 'ValidationError')
    res.send(400, err);
  else
    res.send(500, err);
};
