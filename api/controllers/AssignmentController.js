var Seq = require('seq');

/**
 * AssignmentController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  _routes: {
    'GET @': 'find',
  	'POST @': 'create',
    'GET @/active': 'active',
  	'@/:assignment': 'find',
  	'@/:assignment/student/:student': 'find',
  	'PATCH @/:assignment/student/:student/score': 'score'
  },

  create: function(req, res) {
  	var assignment = req.params.all();
  	Assignment.createFromObjective(assignment.objective, assignment, function(err, assignment) {
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

  		res.json(assignment.toJSON());
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
  	var studentId = req.param('student')
  		, toIds = req.param('to')
  		, assignmentId = req.param('assignment');

  	var options = parseParams(req, ['student', 'to', 'assignment']);
  	if (toIds) options.to = toIds;
  	if(assignmentId) options.id = assignmentId;
  	Seq()
  		.seq(function() {
  			Assignment.findAndTransform(studentId, options, this);
  		})
  		.seq(findNormalizeResponse(res, assignmentId))
  		.catch(function(err) {
  			throw err;
  		});
  },

  score: function(req, res) {
  	var assignmentId = req.param('assignment')
  		, studentId = req.param('student')
  		, score = req.param('score');

  	var update = {};
  	update['students.' + studentId + '.score'] = 5;
  	update['students.' + studentId + '.progress'] = 1;
  	Assignment.update({id: assignmentId}, update, function(err, assignments){
  		var assignment = assignments[0];
  		if (! assignment) {
  			return res.clientError('Assignment not found')
  				.missing('assignment', 'id')
  				.send(404);
  		}
  		res.json(assignment.toJSON());
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
