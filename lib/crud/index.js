/**
 * Imports
 */

var uncapitalize = require('uncapitalize')
var construct = require('lib/construct')

/*
 * Mixin crud actions
 */

module.exports = function(actions, Model) {
  var name = uncapitalize(Model.modelName)

  actions.get = function(req, res) {
    var model = req[name]
    model ? res.json(200, model.toJSON ? model.toJSON({}) : model) : res.send(404)
  }

  actions.update = function(req, res, next) {
    var model = req[name]
    var update = req.body
    if(! model) return next('crud update requires req.' + name)

    // Apply the update
    model.fromJSON(update, {reset: false, trusted: false})

    // Save
    model.save(function(err, model) {
      if(err) return next(err)
      res.json(200, model)
    })
  }

  actions.create = function(req, res, next) {
    var model = construct(Model, req.body)
    model.save(function(err, model) {
      if(err) return next(err)
      res.send(201, model)
    })
  }

  actions.destroy = function(req, res, next) {
    var model = req[name]
    if(! model) return next('crud destroy requires req.' + name)

    model.remove(function(err) {
      if(err) return next(err)
      res.send(200)
    })
  }
}
