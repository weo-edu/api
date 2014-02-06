var _ = require('lodash');

module.exports = function(req, exclude) {
	var where = req.param('where');

	// If WHERE is a string, try to interpret it as JSON
	if (_.isString(where)) {
		where = tryToParseJSON(where);
	}

	// If WHERE has not been specified, but other params ARE specified build the WHERE option using them
	var params;
	if (!where) {
		
		// Build monolithic parameter object
		params = req.params.all();

		// Pluck params:
		params = _.reject(params, function (param, key) {

			// if req.transport is falsy or doesn't contain the phrase "socket"
			// we'll call it "jsonpCompatible"
			var jsonpCompatible = ! ( req.transport && req.transport.match(/socket/i) );

			// undefined params
			return _.isUndefined(param) ||

				// and limit, skip, and sort
				key === 'limit' || key === 'skip' || key === 'sort' ||

				// and JSONP callback (if this is jsonpCompatible)
				(key === 'callback' && jsonpCompatible) ||

				(exclude && exclude.indexOf(key) >= 0)
		});

		// to build a proper where query
		where = params;
	}

	// Build options object
	var options = {
		limit: req.param('limit') || undefined,
		skip: req.param('skip') || req.param('offset') || undefined,
		sort: req.param('sort') || req.param('order') || undefined,
		where: where || undefined
	};

	return options;
}