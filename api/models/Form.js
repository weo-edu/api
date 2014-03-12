var Seq = require('seq');

/**
 * Form
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

  	creator: {
  		type: 'string',
  		required: true
  	},

  	type: {
  		type: 'string',
  		in: ['poll', 'quiz'],
  		required: true
  	},

  	questions: {
  		type: 'array',
  		required: true
  	},

  	toObjective: function() {
  		return {
  			type: this.type,
  			title: this.title,
  			link: '/form/' + this.id,
  			icon: '/poll.png',
  			payload: {
  				form: this.id,
  				get: '/form/' + this.id + '/${assignment.id}'
  			}
  		};
  	}
    
  },

  withResponses: function(id, responseCollection, cb) {
  	Seq()
  		.par(function() {
  			Form.findOne(id, this);
  		})
  		.par(function() {
  			Response.find({collection: responseCollection}, this)
  		})
  		.seq(function(form, responses) {
  			form.responses = _.invoke(responses, 'toJSON');
  			cb(null, form);
  		})
  		.catch(function(err) {
  			cb(err);
  		});
  	
  }

};
