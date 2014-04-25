var actions = module.exports;
var path = require('path');
var s3conf = require('lib/config').s3.uploads;

actions.upload = function(req, res, next) {
  var file = req.params.all();
  file.user = req.auth.id;
  file.ext = path.extname(file.name);
  file.base = s3conf.bucket = 's3.amazonaws.com/uploads/'; // XXX Exclude protocol

  S3.create(file, function(err, s3file) {
    if(err) return res.mongooseError(err);

    var policy = s3file.policy();
    s3file.credential = {
      policy: p.policy,
      signature: p.signature,
      bucket: s3conf.bucket,
      acl: 'public-read',
      key: s3conf.key
    };

    res.json(s3file.toJSON());
  });
};

actions.complete = function(req, res, next) {
  req.s3file.completed = true;
  req.s3file.save(function(err) {
    if(err) return res.mongooseError(err);
    res.send(200);
  });
};