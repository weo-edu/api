var mock = require('mock-require');

mock('../io/index.js', {
  use: function() {
    return this;
  },
  sockets: {
    to: function() {
      return this;
    },
    send: function() {
      return this;
    }
  }
});