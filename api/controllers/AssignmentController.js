var Seq = require('seq');

/**
 * AssignmentController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  _routes: {
    'GET @/:id': 'get',
  	'POST @': 'create',
  	'PATCH @/:id/score': 'score'
  },

  get: function(req, res) {
    var id = req.param('id');
    Share.findOne({id: id, type: 'assignment'}).done(function(err, share) {
      if (err) return res.serverError(err);
      res.json(share.toJSON());
    });
  },

  create: function(req, res) {
    var share = req.body;
    var creator = req.user.id;
  	Assignment.construct(creator, share, share.object, function(err, share) {
  		if (err) {
        return res.serverError(err);
      } else {
        res.json(201, share.toJSON());
      }
  	});
  },

  score: function(req, res) {
  	var id = req.param('id')
  		, studentId = req.user.id
  		, score = req.param('score');

  	var update = {};
    var progress = 1;
  	if (!_.isUndefined(score))
      update['object.payload.students.' + studentId + '.score'] = score;
  	update['object.payload.students.' + studentId + '.progress'] = progress;
  	Share.update({id: id, type: 'assignment'}, update, function(err, assignments) {
  		var assignment = assignments[0];
  		if (! assignment) {
  			return res.clientError('Assignment not found')
  				.missing('assignment', 'id')
  				.send(404);
  		}
  		res.json({score: score, progress: progress});
  	})
  }
};

