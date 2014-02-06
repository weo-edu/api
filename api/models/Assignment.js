var Seq = require('seq')
	, _ = require('lodash')
	, modelHook = require('../../lib/modelHook');

function studentInit() {
	return {progress: 0, score: 0, reward_claimed: false};
}

modelHook.on('group:addMember', function(data, next) {
	if (data.user.type === 'student')
		Assignment.addStudent(data.groupId, data.user.id, next);
	else 
		next();
});

/**
 * Assignment
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */


module.exports = {

  attributes: {
  	
  	objective: {
  		type: 'json',
  		required: true
  	},

  	due_at: {
  		type: 'datetime',
  		required: true
  	},

  	graded: {
  		type: 'boolean'
  	},

  	graded_at: {
  		type: 'datetime'
  	},

  	max_score: {
  		type: 'float',
  		required: true
  	},

  	reward: {
  		type: 'integer'
  	},

  	group_id: {
  		type: 'string',
  		required: true
  	},

  	teacher_id: {
  		type: 'string',
  		required: true
  	},

  	/**
  	 * Map of students who received assignment
  	 * @progress {float} progress out of 1
  	 * @score {float} score on assignment
  	 * @reward_claimed {boolean} whether reward was claimed
  	 */
  	students: {
  		type: 'json'
  	}
    
  },

  createFromObjective: function(objectiveId, options, cb) {
  	Seq()
  		.seq(function() {
  			if (_.isString(objectiveId))
  				Objective.findOne(objectiveId).done(this);
  			else
  				Objective.create(objectiveId).done(this);
  		})
  		.seq(function(objective) {
  			if (!objective) return this(new databaseError.NotFound('Objective'));
  			options.objective = objective;
  			Student.find({groups: options.group_id, type: 'student'}).done(this);
  		})
  		.seq(function(students) {
  			options.students = {};
  			_.each(students, function(student) {
  				options.students[student.id] = studentInit();
  			});
  			Assignment.create(options).done(this);
  		})
  		.seq(function(assignment) {
  			cb(null, assignment)
  		})
  		.catch(function(err) {
  			cb(err);
  		});
  },

  transformAssignment: function(assignment, studentId) {
		if(studentId) {
			var student = assignment.students[studentId];
			delete assignment.students;
			_.extend(assignment, _.pick(student, 'score', 'progress', 'reward_claimed'));
		}
		return assignment;
  },

  findAndTransform: function(studentId, options, cb) {
  	Seq()
  		.seq(function() {
  			Assignment.find(options).exec(this);
  		})
  		.seq(function(assignments) {
  			assignments = _.map(assignments, function(assignment) {
  				return Assignment.transformAssignment(assignment, studentId);
  			});
  			cb(null, assignments);
  		})
  		.catch(cb);
  },

  addStudent: function(groupId, userId, cb) {
  	var update = {};
  	update.students = {};
  	update.students[userId] = studentInit();
  	// XXX only add students to assignments that aren't due yet
  	Assignment.update({group_id: groupId}, update, cb);
  }

};


