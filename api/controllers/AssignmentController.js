var Seq = require('seq');

/**
 * AssignmentController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  _routes: {
    'GET @/active': 'active',
    'GET @/:id': 'find',
    'POST @': 'create',
  	'@/:assignment': 'find',
  	'PATCH @/:assignment/score': 'score'
  },

  create: function(req, res) {
  	var assignment = req.params.all();
    assignment.teacher = req.user.id;
  	Assignment.make(assignment, function(err, assignment) {
  		if (err instanceof databaseError.NotFound) {
  			if (err && err.message === 'Objective') {
  				return res.clientError('Objective not found')
  					.missing('objective', 'objective')
  					.send(404);
  			}
  		} else if (err && err.ValidationError) {
        return res.clientError('ValidationError')
          .fromSails('assignment', [err])
          .send(400);
      }
  		if (err) throw err;

  		res.json(201, assignment.toJSON());
  	});
  },

  active: function(req, res) {
    var studentId = req.param('student')
      , toIds = req.param('to')
      , direction = req.param('direction') || 1;

    var options = {where: {to: toIds, due_at: {'>=': new Date()} }, sort: {'due_at': direction, 'createdAt': -1}};
    Seq()
      .seq(function() {
        Assignment.findAndTransform(studentId, options, this)
      })
      .seq(findNormalizeResponse(res))
      .catch(function(err) {
        throw err;
      });
  },

  find: function(req, res) {
    var id = req.param('id');
    var to = req.param('to');
    var studentId = req.user.role === 'student' && req.user.id;
  	Seq()
  		.seq(function() {
        var selector = {};
        if(id) selector.id = id;
        if(to) selector.to = to;
  			Assignment.findAndTransform(studentId, selector, this);
  		})
  		.seq(findNormalizeResponse(res, id))
  		.catch(function(err) {
  			throw err;
  		});
  },

  score: function(req, res) {
  	var assignmentId = req.param('assignment')
  		, studentId = req.user.id
  		, score = req.param('score');

  	var update = {};
  	if (!_.isUndefined(score))
      update['students.' + studentId + '.score'] = score;
  	update['students.' + studentId + '.progress'] = 1;
  	Assignment.update({id: assignmentId}, update, function(err, assignments){
  		var assignment = assignments[0];
  		if (! assignment) {
  			return res.clientError('Assignment not found')
  				.missing('assignment', 'id')
  				.send(404);
  		}
  		res.json(Assignment.transformAssignment(assignment, studentId).toJSON());
  	})
  }
};

function findNormalizeResponse(res, assignmentId) {
  return function(assignments) {
    if (assignmentId) {
      var assignment = assignments[0];
      if (!assignment) {
        res.clientError('Assignment not found')
          .missing('assignment', 'id')
          .send(404);
      } else {
        res.json(assignment.toJSON());
      }
    } else
      res.json(_.map(assignments, function(model) { return model.toJSON()}));
  }
}
