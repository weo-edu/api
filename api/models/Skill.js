/**
 * Skill
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var model = module.exports = {
  adapter: 'mongo',
  types: {
    virtual: function() { return true; },
    fn: function() { return true; },
  },
  attributes: {
    description: 'string',
    name: {
      type: 'string',
      required: true
    },
    grade: {
      type: 'integer',
      min: 0,
      max: 12
    },
    url: {
      type: 'string',
      url: true
    },
    subject: 'string',
    topic: 'string',
    tags: 'array',
    icon: {
      type: 'virtual',
      fn: function() {
        return this.url + '/icon';
      }
    },
  	/* e.g.
  	nickname: 'string'
  	*/
  }
};

model.beforeCreate = [require('../services/hashids.js')('skill'),
    require('../services/virtualize.js')(model.attributes)];
model.beforeUpdate = [require('../services/virtualize.js')(model.attributes)];