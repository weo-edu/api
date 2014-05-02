/*
  Mixin crud actions
 */
module.exports = function(actions, Model) {
  actions.get = function(req, res, next) {
    var id = req.param('id');
    Model.findById(id, function(err, model) {
      if(err) return next(err);
      res.json(model);
    });
  };

  actions.update = function(req, res, next) {
    var id = req.param('id');
    Model.update({_id: id}, req.body, function(err, model) {
      if(err) return next(err);
      res.send(200, model);
    });
  };

  actions.create = function(req, res, next) {
    console.log('create', req.body);
    Model.create(req.body, function(err, model) {
      if(err) return next(err);
      res.send(201, model);
    });
  };

  actions.destroy = function(req, res, next) {
    var id = req.param('id');
    Model.remove(id, function(err) {
      if(err) return next(err);
      res.send(204);
    })
  };
};