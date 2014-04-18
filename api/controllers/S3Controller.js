/**
 * S3Controller
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var crypto = require('crypto');
var bytes = require('bytes');
var policy = require('s3-policy');
var path = require('path');

function policy(opts) {
  if (!opts) throw new Error('settings required');
  if (!opts.expires) throw new Error('.expires required');
  if (!opts.bucket) throw new Error('.bucket required');
  if (!opts.acl) throw new Error('.acl required');

  var conds = opts.conditions || [];
  conds.push({ bucket: opts.bucket });
  conds.push({ acl: opts.acl });
  
  var policy = {
    expiration: opts.expires.toISOString(),
    conditions: conds
  };

  var json = JSON.stringify(policy);
  var base = new Buffer(json).toString('base64');
  return base;
}

module.exports = {

	_routes: {
		'POST @/upload': 'upload',
		'PUT @/upload/:id/complete': 'complete'
	},

  upload: function(req, res) {
  	var file = req.params.all();

  	var conf = s3access();
  	file.user = req.user.id;
  	file.ext = path.extname(file.name);
  	file.base = conf.bucket + '.s3.amazonaws.com/uploads/'; //XXX exclude protocol

  	S3.create(file, function(err, s3file) {
  		if (err) return res.serverError(err);
  		var min = 60000;
			var now = Date.now();

			var p = policy({
			  acl: 'public-read',
			  expires: new Date(now + min),
			  bucket: conf.bucket,
			  secret: conf.secret,
			  key: conf.key,
			  name: 'uploads/',
			  length: bytes('5mb')
			});

			s3file.credential = {
			  policy: p.policy,
			  signature: p.signature,
			  bucket: conf.bucket,
			  acl: 'public-read',
			  key: conf.key
			};

			res.json(s3file.toJSON());
  	})
  	
  },

  complete: function(req, res) {
  	var id = req.param('id');
  	S3.update(id, {completed: true}, function(err, s3file) {
  		if (err) res.serverError(err);
  		if (!s3file) {
  			return res.clientError('File not found')
  				.missing('s3', 'id')
  				.send(404);
  		}
  		res.send(204);
  	})
  }



};
