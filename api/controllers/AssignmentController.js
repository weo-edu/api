var Seq = require('seq');

/**
 * AssignmentController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  _routes: {
    'GET @': 'findAssignments',
  	'POST @': 'createAssignment',
  	'@/:assignment': 'findAssignments',
  	'@/:assignment/student/:student': 'findAssignments',
  	'PATCH @/:assignment/student/:student/score': 'score'
  },

  createAssignment: function(req, res) {
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
  
  findAssignments: function(req, res) {
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
  		.seq(function(assignments) {
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
  		})
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
