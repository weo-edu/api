let diff = require('mongo-update');
let action = require('action');

module.exports = action(['originalRecord', 'newRecord'], 'diff', diff);