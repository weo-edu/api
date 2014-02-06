/**
 * Group
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  adapter: 'mongo',
  attributes: {
    type: {
      type: 'string',
      in: ['class', 'group', 'individual'],
      defaultsTo: 'class'
    },
    name: {
      type: 'string',
      required: true
    },
    code: {
      type: 'string',
      unique: true,
      required: true
    },

    //XXX implement and require
    owners: {
      type: 'array'
    }
  },
  beforeValidation: [function(attrs, next) {
    if (attrs.id) return next();
    hashids('Group', {offset: hashids.sixDigitOffset}, 
    function(err, code) {
      if(err) throw err;
      attrs.code = code;
      next();
    });
  }]
};
