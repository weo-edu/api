var User = require('./model');
var actions = module.exports;
var url = require('url');
var knox = require('knox');
var client = knox.createClient(require('lib/config').s3.avatar);

actions.me = function(req, res, next) {
  // .user middleware must be called before me
  if(! req.auth)
    return res.end();

  req.params.id = req.auth.id;
  actions.get(req, res, next);
};

actions.updateMe = function(req, res, next) {
  if(! req.auth) return res.json(404);
  req.params.id = req.auth.id;
  actions.update(req, res, next);
};

actions.groups = function(req, res, next) {
  req.me.populate({
    path: 'groups',
    match: {status: 'active'}
  }, function(err, user) {
    if(err) return res.mongooseError(err);
    res.json(user.groups);
  });
};

actions.updateAvatar = function(req, res, next) {
  var imageUrl = req.param('image');
  if(! imageUrl) {
    return res.send(400, 'No new image provided');
  }

  var imagePath = url.parse(imageUrl).pathname;
  var userId = req.auth.id;
  client.copyFile(imagePath, '/' + userId, {'x-amz-acl': 'public-read'}, function(err, s3Res) {
    if(err) return res.send(500, err);
    if(s3Res.statusCode === 404)
      return res.send(404, 'Avatar not found');
    res.send(204);
  });
};

require('lib/crud')(actions, User);