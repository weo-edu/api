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
      in: ['class', 'tag', 'friends']
    },
    name: {
      type: 'string',
      required: true
    },
    teacher_code: {
      type: 'string',
      required: true
    },
    student_code: {
      type: 'string',
      required: true
    }
  },
  beforeValidation: [function(attrs, next) {
    if (attrs.id) return;
    hashids('Group', {num: 2, offset: hashids.sixDigitOffset}, 
    function(err, codes) {
      if(err) throw err;
      attrs.teacher_code = codes[0]
      attrs.student_code = codes[1];
      console.log('attrs', attrs);
      next();
    });
  }]
};
