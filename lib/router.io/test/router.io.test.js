
require('./helpers');
var chai = require('chai');
var expect = chai.expect;

var socket = require('socket.io-client');
var routerIO = require('lib/router.io-client/router.io-client.js');

function socketConnect() {
  var s = socket.connect('http://localhost:3000', {"force new connection": true});
  return routerIO(s);
}

describe('socket routing', function() {
  var socket = socketConnect();
  it('should route to simple path', function(done) {
    socket.get('/test', function(headers, res) {
      expect(res).to.equal('test');
      done();
    })
  });

  it('shoud hit different method', function(done) {
    socket.patch('/test', function(headers, res) {
      expect(res).to.equal('patch');
      done();
    })
  });

  it('should route to mounted path', function(done) {
    socket.get('/mounted/test', function(headers,res) {
      expect(res).to.equal('mounted');
      done();
    })
  });

  it('should throw 404 on miss', function(done) {
    socket.get('/missed', function(headers) {
      expect(headers.isError).to.be.true;
      expect(headers.status).to.equal(404);
      done();
    });
  });

  it('should throw 404 on miss method', function(done) {
    socket.post('/test', function(headers) {
      expect(headers.isError).to.be.true;
      expect(headers.status).to.equal(404);
      done();
    });
  });

  it('should parse route params', function(done) {
    socket.get('/test/foo', function(headers, res) {
      expect(res).to.equal('foo');
      done();
    });
  });

});