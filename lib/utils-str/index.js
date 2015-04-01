const {toLower} = require('ramda');

exports.toLowerSafe = ifElse(identity, toLower, identity);