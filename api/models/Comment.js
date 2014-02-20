/**
 * Comment
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

var mergeModels = require('../../lib/mergeModels')
	, PostSchema = require('./Post');

module.exports = mergeModels(PostSchema, {
  attributes: {
  	type: {
  		in: ['comment'],
	  	defaultsTo: 'comment'
	  }
  },
  
});

