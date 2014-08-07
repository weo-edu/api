var User = require('./model');
var Group = require('lib/Group/model');
var actions = module.exports;
var url = require('url');
var knox = require('knox');
var client = knox.createClient(require('lib/config').s3.avatar);
var errors = require('lib/errors');

actions.me = function(req, res) {
  res.json(req.me);
};

actions.updateMe = function(req, res, next) {
  if(! req.auth) return next(errors.NotFound());
  req.params.id = req.auth.id;
  actions.update(req, res, next);
};

actions.groups = function(req, res, next) {
  Group.find()
    .where('_id').in(req.me.groupIds)
    .where('status', 'active')
    .exec(function(err, groups) {
      if(err) return next(err);
      res.json(groups);
    });
};

actions.updateAvatar = function(req, res, next) {
  var imageUrl = req.param('image');
  if(! imageUrl) {
    return next(errors.Client('Missing image')
        .error('required', 'image'));
  }

  var imagePath = url.parse(imageUrl).pathname;
  var userId = req.auth.id;
  client.copyFile(imagePath, '/' + userId, {
    'x-amz-acl': 'public-read',
    'x-amz-metadata-directive': 'REPLACE',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': 0,
    'Content-Type': 'image/png'
  }, function(err, s3Res) {
    if(err) return next(err);
    if(s3Res.statusCode === 404)
      return next(errors.NotFound('Avatar not found'));
    res.send(204);

    // Virtual dispatch
    User.schema.dispatch('post:change:avatar', req.me);
  });
};

require('lib/crud')(actions, User);