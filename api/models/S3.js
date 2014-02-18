/**
 * S3
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {
  	
  	name: {
  		type: 'string',
  		required: true
  	},

  	user: {
  		type: 'string',
  		required: true
  	},

  	base: {
  		type: 'string',
  		url: true,
  		required: true
  	},

  	type: {
  		type: 'string',
  		required: true
  	},

  	ext: {
  		type: 'string',
  		required: true
  	},

  	thumb_ext: {
  		type: 'string'
  	},

  	completed: {
  		type: 'boolean',
  		defaultsTo: false
  	}

  }

};
