var injectLatency = require('express-inject-latency');
module.exports = injectLatency({mean: 1000});