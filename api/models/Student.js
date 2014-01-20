/**
 * Student
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
      required: true,
      defaultsTo: 'student',
      in: ['student']
    }, 

    grade: {
      type: 'integer',
      required: true,
      in: _.range(13)
    }
  	/* e.g.
  	nickname: 'string'
  	*/
    
  }
});
