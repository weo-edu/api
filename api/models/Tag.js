/**
 * Tag
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  adapter: 'mongo',
  attributes: {
    name: {
      required: true,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      in: ['subject', 'topic', 'commonCore', 'general']
    },
    count: {
      type: 'integer',
      defaultsTo: 0
    },
    excerpt: {
      type: 'string',
      minLength: 20,
      maxLength: 460
    },
    body: {
      type: 'string'
    }
  	
  	/* e.g.
  	nickname: 'string'
  	*/
    
  },
  beforeCreate: function(values, next) {
    values._id = values.type + '-' + values.name;
    next();
  }
};
