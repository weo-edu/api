var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');
var access = require('lib/access');
var Student = require('lib/Student').model;
var async = require('async');


/**
 * Interface
 */
// Mixin crud
require('lib/crud')(actions, Share);

actions.to = to;
// actions.get = get;
actions.publish = publish;
actions.save = save;
actions.getMembers = getMembers;


/**
 * Implementation
 */


function to(req, res, next) {
  var channels = [].concat(req.param('channel')).filter(Boolean);
  var contexts = [].concat(req.param('context')).filter(Boolean);
  var text = req.param('query');

  var page = req.page;
  Share.findForUser(req.me, contexts, channels)
    .where('channels').in(channels)
    .where(text ? {$text: {$search: text}} : {})
    .where({createdAt: {$lt: page.before}})
    .where('status').ne('draft')
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, shares) {
      if(err) return next(err);
      async.each(shares, function(share, cb) {
        share.populateSelfLinks(cb);
      }, function(err) {
        if (err) return next(err);
        res.json(shares);
      });

    });
}

// function get(req, res, next) {
//   // var context = req.param('context');
//   // Share.find()
//   //   .where('root.id', req.share.id)
//   //   .where('')
//   // if()
// }

function publish(req, res, next) {
  req.share.status = 'active';
  actions.save(req, res, next);
}

function save(req, res, next) {
  req.share.save(function(err) {
    if(err) return next(err);
    res.send(200);
  });
}

function getMembers(req, res, next) {
  var contexts = [].concat(req.param('context'));
  var individuals = [];
  var groups = [];

  req.share.contextList(contexts).forEach(function(address) {
    address.allow.map(function(allow) {
      return access.decode(allow.id);
    }).filter(function(entry) {
      // Skip public
      return !! entry.id;
    }).forEach(function(entry) {
      if(entry.type === 'user')
        individuals.push(entry.id);
      else if(entry.type === 'group' && entry.role === 'student')
        groups.push(entry.id);
    });
  });

  Student.find()
    .or([{_id: {$in: individuals}}, {'groups.id': {$in: groups}}])
    .exec(function(err, users) {
    if(err) return next(errors.Server(err));
    res.json(users);
  });
}
