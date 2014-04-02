
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;

var port = String(process.env.PORT || 3220);
var app = express();

var maps = [
  'cs_assault'
];

var modes = [
  'terrortown'
];

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function (socket) {
  checkStatus(socket);

  socket.on('start', function (data) {
    if (maps.indexOf(data.map) > -1 && modes.indexOf(data.mode) > -1) {
      run_cmd('sh test.sh', ['start', data.map, data.mode], function () {});
    }
  });

  socket.on('stop', function (data) {
    run_cmd('sh test.sh', ['stop'], function () {});
  });
});

function run_cmd(cmd, args, callback ) {
  var spawn = require('child_process').spawn;
  var child = spawn(cmd, args);
  var resp = "";

  child.stdout.on('data', function (buffer) { resp += buffer.toString() });
  child.stdout.on('end', function() { callback(resp) });
}

function checkStatus(socket) {
  run_cmd("sh test.sh", ['status'], function (text) {
    socket.emit('news', { status: text });
    setTimeout(function () {
      checkStatus(socket);
    }, 2 * 1000);
  });
}
