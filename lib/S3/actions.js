var actions = module.exports;
var path = require('path');
var s3conf = require('lib/config').s3.uploads;
var S3 = require('./model');

actions.upload = function(req, res, next) {
  var file = req.body;
  file.user = req.auth.id;
  file.ext = path.extname(file.name);
  file.base = s3conf.bucket + '.s3.amazonaws.com/uploads/'; // XXX Exclude protocol

  S3.create(file, function(err, s3file) {
    if(err) return next(err);

    var p = s3file.policy();
    s3file.credential = {
      policy: p.policy,
      signature: p.signature,
      bucket: s3conf.bucket,
      acl: 'public-read',
      key: s3conf.key
    };

    res.json(s3file);
  });
};

actions.complete = function(req, res, next) {
  req.s3.completed = true;
  req.s3.save(function(err) {
    if(err) return next(err);
    res.send(204);
  });
};

require('lib/crud')(actions, S3);