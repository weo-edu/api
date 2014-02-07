module.exports = function(req, res, next) {
  if(! req.user) return next('Not authenticated');
  if(req.user.role !== 'teacher')
    return next('You are not currently authenticated as a teacher');
  next();
};