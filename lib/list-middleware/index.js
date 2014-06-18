module.exports = function() {
  return function(req, res, next) {
    var toJSON = res.json;
    res.json = function(obj) {
      if (2 == arguments.length) {
        // res.json(body, status) backwards compat
        if ('number' == typeof arguments[1]) {
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
          nextPageToken: this.nextPageToken,
          items: obj
        }
      }
      toJSON.call(this, obj);
    }
  };
}