module.exports = function(req, res, next) {
  if(! req.user) return res.send(401, 'Not authenticated');
  if(req.user.role !== 'teacher')
    return res.send(403, 'You are not currently authenticated as a teacher');
  next();
};