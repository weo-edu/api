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
    'PUT @/:id/votes': 'vote'
  },

  create: function(req, res) {
  	var post = req.params.all();
  	var discussionId = post.discussion;
  	delete post.discussion;
  	post.discussion_id = discussionId;

  	var Model = sails.models[req.target.controller];

  	Model.create(post, function(err, post) {
  		if (err) return res.serverError(err);
      if (req.socket) {
        Discussion.publish(discussionId, {
          model: Discussion.identity,
          verb: 'add',
          data: post,
          id: discussionId
        }, req.socket);
      }
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
				sort: {votes: -1, createdAt: 1},
				where: {discussion_id: discussionId, type: type},
			};

		// XXX throw error if no discussionId provided

  	Model.find(options).done(function(err, posts) {
  		if (err) res.serverError(err);
  		res.json(_.map(posts, function(model) {
  			return model.toJSON();
  		}));
  	});
  },

  vote: function(req, res){
    var id = req.param('id');
    var vote = req.param('vote');
    var userId = req.user.id;

    var Model = sails.models[req.target.controller];
    Model.findOne(id).done(err, function(post) {
      var lastVote = post.votes[userId] || 0;
      var lastTotal = post.votes_total;
      var newTotal = lastTotal + (vote - lastVote);
      var update = {id: id, votes_total: newTotal};
      update['votes.' + userId] = vote;
      Model.update(update).done(err, function(post) {
        if (err)
          return res.sendError(Err);
        var votes = {};
        votes[userId] = post.votes[userId];
        var smallPost = {
          id: post.id, 
          votes_total: 
          post.votes_total, 
          votes: votes
        };

        if (req.socket) {
          Discussion.publish(post.discussion_id, {
            model: Discussion.identity,
            verb: 'update',
            data: smallPost,
            id: discussionId
          }, req.socket);
        }
        res.json(smallPost);
      });
    });
  }
  

};
