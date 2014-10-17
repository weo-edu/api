var server = require('http').Server();
var io = require('socket.io')(server);

var app = require('lib/routerware')();

app.get('/test', function(req, res) {
  res.send('test');
});

app.put('/test', function(req, res) {
  res.send('put');
});

app.get('/test/:id', function(req, res) {
  res.send(req.param('id'));
});

var sub = require('lib/routerware')();
sub.get('/test', function(req, res) {
  res.send('mounted');
});

app.use('/mounted', sub);

io.use(require('../../')(app));

server.listen(3000);