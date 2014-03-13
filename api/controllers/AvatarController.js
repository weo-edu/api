var knox = require('knox');
var url = require('url');
var client = knox.createClient({
  key: "AKIAIMDHEMBP5SULSA3A",
  secret: "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",
  bucket: 'avatar.eos.io',
  region: 'us-west-1'
});

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
  	var imagePath = url.parse(imageUrl).pathname;
  	var user = req.user.id;
  	console.log('imagePath', imagePath);
  	client.copyFile(imagePath, '/' + user, { 'x-amz-acl': 'public-read' }, function(err, s3Res){
  		if (err) return res.serverError(err);
  		res.send(204);
		});
  }

};
