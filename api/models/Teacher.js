/**
 * Teacher
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash')
  , User = require('./User.js');

module.exports = _.merge(_.clone(User, true), {

  attributes: {
    type: {
      type: 'string',
      defaultsTo: 'teacher',
      in: ['teacher'],
      required: true
    }
  	/* e.g.
  	nickname: 'string'
  	*/
    
  }
});
