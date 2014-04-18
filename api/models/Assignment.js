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

    type: {
      type: 'string',
      required: true,
      in: ['generic', 'poll', 'quiz']
    },

    body: {
      type: 'string',
      required: true
    },

    max_score: {
      type: 'float',
    },

    reward: {
      type: 'integer'
    },

  	/**
  	 * payoad.students 
     * Map of  students who received assignment
  	 * @param {float} progress progress out of 1
  	 * @param {float} score score on assignment
  	 * @param {boolean} reward_claimed whether reward was claimed
     * @param {datetime} submitted_at date assignment was submitted
     * @param {datetime} graded_at date assignment was graded
  	 */

    payload: {
      type: 'json'
    }

  },

  construct: function(creator, share, assignment, cb) {
  	Seq()
  		.seq(function() {
        // XXX have to clone because sails turns into a regex, ugh
  			Student.find({groups: _.clone(share.to), type: 'student'}).done(this);
  		})
  		.seq(function(students) {
        assignment.payload = assignment.payload || {};
  			assignment.payload.students = {};
  			_.each(students, function(student) {
  				assignment.payload.students[student.id] = studentInit();
  			});
        //console.log('Assignment', Assignment);
        validate(Assignment, assignment, this);
  		})
  		.seq(function(assignment) {
        Assignment.mixinShare(share, assignment);
        Share.createAndEmit(creator, share, cb);
  		})
  		.catch(function(err) {
  			cb(err);
  		});
  },

  mixinShare: function(share, assignment) {
    share.type = 'assignment';
    share.verb = 'assigned';
    share.object = assignment;
  },


  addStudent: function(groupId, userId, cb) {
  	var update = {};
  	update['object.payload.students.' + userId] = studentInit();
    console.log('update', update);
  	// XXX only add students to assignments that aren't due yet
  	Share.update({to: groupId, type: 'assignment'}, update, cb);
  }
};