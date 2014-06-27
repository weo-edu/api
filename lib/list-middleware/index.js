var _ = require('lodash');
module.exports = function() {
  return function(req, res, next) {
    var toJSON = res.json;
    res.json = function(obj) {
      if (2 === arguments.length) {
        // res.json(body, status) backwards compat
        if ('number' === typeof arguments[1]) {
          this.statusCode = arguments[1];
          return 'number' === typeof obj
            ? jsonNumDeprecated.call(this, obj)
            : jsonDeprecated.call(this, obj);
        } else {
          this.statusCode = obj;
          obj = arguments[1];
        }
      }
      if (_.isArray(obj)) {
        obj = {
          kind: 'list',
          items: obj
        };
        if (res.pageToken && req.page.limit === obj.items.length) {
          obj.nextPageToken = res.pageToken;
        }
      }
      toJSON.call(this, obj);
    };
    next();
  };
};