/**
 * ResponseController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  _routes: {
    'GET @/:collection': 'find',
  	'POST @': 'create',
  	'PATCH /response/:id': 'update',
    'POST @/:collection/subscription': 'createSubscription',
    'DELETE @/:collection/subscription': 'deleteSubscription',
  },

  find: function(req, res) {
    var collection = req.param('collection');
    var user = req.param('user');
    var options = {collection: collection};
    if (user)
      options.user = user;
    Response.find(options).done(function(err, responses) {
      if (err) return res.serverError(err);
      res.json(responses);
    });
  },

  create: function(req, res) {
  	var response = req.params.all();
  	Response.create(response, function(err, response) {
  		if (err) return res.serverError(err);
  		Response.publish(response.collection, {
  			model: Response.identity,
  			verb: 'create',
  			data: response,
  			id: response.collection
  		});
  		res.json(201, response.toJSON());
  	});
  },

  update: function(req, res) {
  	var id = req.param('id');
  	var answer = req.param('answer');
  	Response.update(id, {answer: answer}).exec(function(err, updates) {
  		if (err) return res.serverError(err);
  		if (updates.length === 0) {
  			return res.clientError('Response not found')
            .missing('response', 'id')
            .send(404);
  		}
  		var response = updates[0];
  		Response.publish(response.collection, {
  			model: Response.identity,
  			verb: 'update',
  			data: response,
  			id: response.collection
  		});
  		res.json(200, response.toJSON());
  	});
  },
  createSubscription: function(req, res) {
    var collection = req.param('collection');
    Response.subscribe(req.socket, collection);
    res.send(201);
  },
  deleteSubscription: function(req, res) {
    var collection = req.param('collection');
    Response.unsubscribe(req.socket, collection);
    res.send(204);
  }
};
