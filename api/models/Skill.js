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
  },
  beforeCreate: [function(attrs, next) {
    hashids('skill', function(err, hashId) {
      attrs._id = hashId;
      attrs.url = [attrs.domain, modelName, attrs._id].join('/');
      delete attrs.domain;
      next();
    });
  }]
};

model.beforeCreate.push(require('../services/virtualize.js')(model.attributes));
model.beforeUpdate = [require('../services/virtualize.js')(model.attributes)];