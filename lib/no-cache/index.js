module.exports = function(req, res, next) {
  if(req.path.indexOf('/assets') !== 0) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
  }
  next();
};