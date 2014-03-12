/**
 * Objective
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
      defaultsTo: 'generic',
      in: ['generic', 'poll', 'quiz']
    },
  	title: {
  		type: 'string',
  		required: true
  	},
  	link: {
  		type: 'string'
  	},
  	icon: {
  		type: 'string'
  	},
    payload: {
      type: 'json'
    },

    // page link
    assignmentLink: {
      type: 'string',
      defaultsTo: '${assignment.objective.link}/${assignment.id}'
    }
  }
};


/**
 * Generic
 *
 * Generic is used for general purpose obectives.
 *
 * Payload
 * @param {string} body description of objective
 * @param {array} attachments uploads
 * @param {array} links useful links
 */

/**
 * Poll
 *
 * Polls are forms where answers are accumulated into histograms and displayed to everyone who has taken the poll.
 *
 * Payload
 * None.
 */

/**
 * Quiz
 *
 * Quizes are forms where final scores are accumulated. Scores are not made public.
 *
 * Payload
 * None.
 * 
 */
