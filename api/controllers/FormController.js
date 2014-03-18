/**
 * FormController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {
	_routes: {
		'GET @/:id/:collection': 'withResponses'
	},

	withResponses: function(req, res) {
		var id = req.param('id')
			, collection = req.param('collection');

		Form.withResponses(id, collection, function(err, form) {
			if (err) return res.serverError(err);
			if (req.socket) {
				Response.subscribe(req.socket, collection);
			} 
			res.json(form.toJSON());
		});
	}
};
