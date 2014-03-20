var Seq = require('seq')
	, _ = require('lodash')
	, modelHook = require('../../lib/modelHook')
  , moment = require('moment')


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

    to: {
      type: 'array',
      required: true
    },

    max_score: {
      type: 'float',
      defaultsTo: 100
    },

    reward: {
      type: 'integer'
    },

  	teacher: {
  		type: 'string',
  		required: true
  	},


    //link to assignment
    link: {
      type: 'string'
    },

  	/**
  	 * Map of students who received assignment
  	 * @param {float} progress progress out of 1
  	 * @param {float} score score on assignment
  	 * @param {boolean} reward_claimed whether reward was claimed
     * @param {datetime} submitted_at date assignment was submitted
     * @param {datetime} graded_at date assignment was graded
  	 */
  	students: {
  		type: 'json'
  	}

  },

  beforeCreate: [function(attrs, next) {
    next();
  }],

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
        options.id = new ObjectId;

        // link templating
        if (objective.payload && objective.payload.get)
          objective.payload.get = _.template(objective.payload.get, {assignment: options});
        options.link = _.template(objective.assignmentLink, {assignment: options});
        delete objective.assignmentLink;


        // XXX have to clone because sails turns into a regex, ugh
  			Student.find({groups: _.clone(options.to), type: 'student'}).done(this);
  		})
  		.seq(function(students) {
  			options.students = {};
  			_.each(students, function(student) {
  				options.students[student.id] = studentInit();
  			});
        if (!options.due_at) {
          options.due_at = moment();
        }
  			Assignment.create(options).done(this);
  		})
  		.seq(function(assignment) {
        if (moment(assignment.due_at).diff(moment()) < 0) {
          Assignment.toEvent(assignment, function(err) {
            cb(err, assignment);
          });
        } else
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
  	Assignment.update({to: groupId}, update, cb);
  },

  toEvent: function(assignment, cb) {
    Teacher.findOne(assignment.teacher, function(err, user) {
      if (err) return cb(err);
      if (!user) return cb(new databaseError.NotFound('User'));
      var e = {
        to: assignment.to,
        actor: {
          id: user.id,
          avatar: avatar(user.id),
          name: user.name,
          link: '/user/' + user.id
        },
        verb: 'assigned',
        object: {
          id: assignment.id,
          link: assignment.link,
          name: assignment.objective.type,
          icon: assignment.objective.icon,

        },
        type: 'assignment',
        payload: {
          title: assignment.objective.title,
        }
      };
      Event.createAndEmit(e, cb);
    });
  }
};