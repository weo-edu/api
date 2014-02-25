/**
 * Post
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {
	tableName: 'post',
  attributes: {
  	
  	user: {
  		type: 'string',
  		required: true
  	},

  	user_first: {
  		type: 'string',
  		required: true
  	},

  	user_last: {
  		type: 'string',
  		required: true
  	},

  	body: {
  		type: 'string',
  		required: true
  	},

  	discussion_id: {
  		type: 'string',
  		required: true
  	},

  	type: {
  		type: 'string',
  		required: true,
  		in: ['question', 'answer', 'comment', 'post'],
  		defaultsTo: 'post'
  	},

  	title: {
  		type: 'string',
  		minLength: 3,
  		maxLength: 140
  	},

  	parent_id: {
  		type: 'string',
  	},


  	flagged: {
  		type: 'boolean'
  	}
    
  }

};
