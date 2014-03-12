/**
 * Response
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {
  	
  	// user id
  	user: {
  		type: 'string',
  		required: true
  	},

  	// used for grouping responses
  	// e.g. (assignmentId)
  	collection: {
  		type: 'string',
  		required: true
  	},

  	// question id
  	question: {
  		type: 'string',
  		required: true,
  	},

  	// user's answer
  	answer: {
  		type: 'string',
  		required: true
  	},

  	// correct answer
  	correct: {
  		type: 'boolean'
  	}
    
  }

};
