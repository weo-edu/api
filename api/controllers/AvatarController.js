var knox = require('knox');
var url = require('url');
var modelHook = require('../../lib/modelHook');
var client = knox.createClient({
  key: "AKIAIMDHEMBP5SULSA3A",
  secret: "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",
  bucket: 'avatar.eos.io',
  region: 'us-west-1'
});

//XXX placing next in callback makes account creation feel long
modelHook.on('user:create', function(user, next) {
	client.copyFile('/originals/default/default.png', '/' + user.id, {'x-amz-acl': 'public-read'}, function(err) {
		if (err) {
			console.error('Error setting up avatar for user:' + user.id);
		}
	});
	next();
})

/**
 * AvatarController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

  _config: {},

  change: function(req, res) {
  	var imageUrl = req.param('image');
  	if (!imageUrl) {
  		return res.clientError('No new image provided')
  			.missing('avatar', 'image')
  			.send(400);
  	}

  	var imagePath = url.parse(imageUrl).pathname;
  	var user = req.user.id;
  	client.copyFile(imagePath, '/' + user, { 'x-amz-acl': 'public-read'}, function(err, s3Res){
  		if (err) return res.serverError(err);
      if(s3Res.statusCode === 404)
        return res.notFound('Avatar not found');

  		res.send(204);
		});
  }
};
