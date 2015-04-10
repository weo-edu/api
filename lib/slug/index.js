var slug = require('slug');

slug.charmap._ = '-';
slug.defaults.modes.pretty.remove = /[.\~]/g;

module.exports = slug;
