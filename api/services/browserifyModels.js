var fs = require('fs')
  , browserify = require('browserify');

module.exports = function() {
  browserify()
    .require('./api/services/clientModels.js', {
      expose: 'clientModels'
    })
    .transform(require('shimify')({
      '**/api/services/!(clientModels.js)': 'api/services/empty.js'
    }))
    .bundle()
    .pipe(fs.createWriteStream('./assets/js/clientModels.js'));
};