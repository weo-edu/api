/**
 * Question
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

var mergeModels = require('../../lib/mergeModels')
	, PostSchema = require('./Post');

module.exports = mergeModels(PostSchema, {
  attributes: {
		title: {
			required: true
		},
		body: {
			required: false
		},
  	views: {
  		type: 'integer',
  		defaultsTo: 0
  	},
  	type: {
	  	in: ['question'],
	  	defaultsTo: 'question'
	  }
  },
  
});
