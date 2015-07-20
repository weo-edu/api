var mongo = require('lib/mongo')

exports.getShares = function(req, res, next) {
  var page = req.page
  var text = req.param('query')

  var query = {}
  query.$text = {$search: text}
  query.published = true

  var contexts = ['public']
  if(req.me) {
    contexts = contexts.concat(req.me.contexts.map(function(ctx) {
      return ctx.descriptor.id
    }))
  }

  query['contexts.descriptor.id'] = {$in: contexts}

  var shares = mongo.raw.collection('shares')
  shares.find(
    query,
    {score: {$meta: 'textScore'}}
  )
  .sort({score: {$meta: 'textScore'}})
  .skip(page.skip)
  .limit(page.limit)
  .toArray(function(err, shares) {
    if (err) return next(err)
    res.json(shares)
  })
}

exports.getBoards = function(req, res, next) {
  var page = req.page
  var text = req.param('query')

  var groups = mongo.raw.collection('groups')
  groups.find(
    {
      $text: {$search: text},
      groupType: 'board',
      status: 'active'
    },
      {score: {$meta: 'textScore'}}
    )
    .sort({score: {$meta: 'textScore'}})
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function(err, boards) {
      if (err) return next(err)
      res.json(boards)
    })
}


exports.getPeople = function(req, res, next) {
  var page = req.page
  var text = req.param('query')

  var users = mongo.raw.collection('users')
  users.find(
    {
      $text: {$search: text},
      userType: 'teacher'
    },
      {score: {$meta: 'textScore'}}
    )
    .sort({score: {$meta: 'textScore'}})
    .skip(page.skip)
    .limit(page.limit)
    .toArray(function(err, users) {
      if (err) return next(err)
      res.json(users)
    })
}