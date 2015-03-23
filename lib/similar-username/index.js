let mu = require('mu-js');
let co = require('co');
let muUser = require('lib/mu-user');

function generate(base, attempt) {
  if(attempt === 0) return base;
  return base + Math.ceil(Math.random() + Math.pow(10, attempt));
}

module.exports = co(function *(username, attempts=10) {
  for(let i = 0, u = generate(username, i); i < attempts; i++) {

    if(! yield mu.request(muUser).get('/username/' + u))
      return u;
  }

  return null;
});