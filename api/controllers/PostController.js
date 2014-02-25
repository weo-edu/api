var _ = require('lodash');

/**
 * PostController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */



module.exports = {

  _routes: {
  	'GET @/:discussion': 'find',
  	'POST @/:discussion': 'create',
  },

  create: function(req, res) {
  	var post = req.params.all();
  	var discussionId = post.discussion;
  	delete post.discussion;
  	post.discussion_id = discussionId;

  	var Model = sails.models[req.target.controller];

  	Model.create(post, function(err, post) {
  		if (err) return res.serverError(err);
  		res.status(201);
  		res.json(post.toJSON());
  	});
  },

  find: function(req, res) {
  	var discussionId = req.param('discussion');
  	var Model = sails.models[req.target.controller];
  	var type = Model.attributes.type.defaultsTo;
  	var options = {
				limit: req.param('limit') || undefined,
				skip: req.param('skip') || req.param('offset') || undefined,
				sort: {createdAt: 1},
				where: {discussion_id: discussionId, type: type},
			};

		// XXX throw error if no discussionId provided

  	Model.find(options).done(function(err, posts) {
  		if (err) res.serverError(err);
  		res.json(_.map(posts, function(model) {
  			return model.toJSON();
  		}));
  	});
  }
  

};
