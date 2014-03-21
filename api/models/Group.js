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
      in: ['class', 'group'],
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
    owners: {
      type: 'array',
      required: true
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
  }],
  addUser: function(selector, userId, cb) {
    return Group.findOne(selector).done(function(err, group) {
      if(! err && ! group)
        err = new databaseError.NotFound('Group');
      if(err)
        return cb(err, null);
      User.addToGroup(userId, group.id, function(err, user) {
        if(! err && ! user)
          err = new databaseError.NotFound('User');
        // Return the group, since this is a group model method
        cb(err, group);
      });
    });
  }
};
