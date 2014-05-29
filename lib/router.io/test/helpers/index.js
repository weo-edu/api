var server = require('http').Server();
var io = require('socket.io')(server);

var app = require('lib/routerware')();

app.get('/test', function(req, res, next) {
  res.send('test');
});

app.patch('/test', function(req, res) {
  res.send('patch');
})

app.get('/test/:id', function(req, res, next) {
  res.send(req.param('id'));
})

var sub = require('lib/routerware')();
sub.get('/test', function(req, res, next) {
  res.send('mounted');
});

app.use('/mounted', sub);

io.use(require('../../')(app));

server.listen(3000);