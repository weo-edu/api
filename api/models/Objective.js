/**
 * Objective
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {
  attributes: {
  	title: {
  		type: 'string',
  		required: true
  	},
  	body: {
  		type: 'string',
  		required: true
  	},
  	attachments: {
  		type: 'array'
  	},
  	link: {
  		type: 'string',
  		url: true
  	},
  	icon: {
  		type: 'string',
  		url: true
  	}
  }
};
