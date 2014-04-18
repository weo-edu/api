var _ = require('lodash');

/**
 * PostController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */



module.exports = {

  _routes: {
  	'GET @/:id': 'get',
  	'POST @': 'create',
  },

  get: function(req, res) {
    var id = req.param('id');
    Share.findOne({id: id, type: 'post'}).done(function(err, share) {
      if (err) return res.serverError(err);
      if (!share) {
        return res.clientError('Post not found')
          .missing('share', 'id')
          .send(404);
      }
      res.json(share.toJSON());
    });
  },

  create: function(req, res) {
    var share = req.params.all();
    var creator = req.user.id;

    var id = share.id;
    Post.construct(creator, share, share.object, function(err, share) {
      if (err) {
        return res.serverError(err);
      } else {
        res.json(id ? 201: 200, share.toJSON());
      }
    });
  }  

};
