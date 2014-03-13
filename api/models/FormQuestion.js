/**
 * FormQuestion
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {

  	id: {
  		type: 'integer',
  		required: true
  	},
  	
  	title: {
  		type: 'string',
  		required: true
  	},

  	body: {
  		type: 'string'
  	},

  	type: {
  		type: 'string',
  		in: ['multiple', 'short'],
  		required: true
  	},


  	/**
  	 * Choices for multiple choice question
  	 * @type {array}
  	 *
  	 * Choice
  	 * @param {string} body body of choice
  	 * @param {string} background background color or image for choice
  	 */
  	choices: {
  		type: 'array'
  	},

  	/**
  	 * answer
  	 *
  	 * type: string or int
  	 */
    
  }

};
