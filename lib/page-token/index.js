module.exports = function(defaultMax) {
  defaultMax = defaultMax || 20;
  function parseToken(token) {
    var split = token.split(':');
    return {
      before: new Date(parseInt(split[0])),
      skip: parseInt(split[1]),
      limit: parseInt(split[2])
    };
  }

  function tokenize(page) {
    return [+page.before, page.skip, page.limit].join(':');
  }

  return function (req, res, next) {

    var pageToken = req.param('pageToken');
    var maxResults = req.param('maxResults');
    maxResults = maxResults ? parseInt(maxResults) : undefined;
    var page = null;
    if (!pageToken) {
      page = {before: new Date, skip: 0, limit: maxResults || defaultMax};
    } else {
      page = parseToken(pageToken);
      page.skip = page.skip + page.limit;
      page.limit = maxResults || page.limit;
    }
    req.page = page;

    res.pageToken = tokenize(page);
    next();
  };
};