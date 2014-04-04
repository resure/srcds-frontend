
var express = require('express');
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;
var redis = require('redis').createClient();
var config = require('./config');

redis.on('error', function (err) {
  console.log(err);
});

var app = express();
var port = String(process.env.PORT || 3220);
app.set('env', process.env.NODE_ENV || 'development');

var cmd;
if (app.get('env') == 'development') {
  cmd = "test/serverController.sh"
} else {
  cmd = "srcds_controller/serverController.sh";
}

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

app.get('/', function (req, res) {
  res.render('index', {
    title: 'Source Dedicated Server',
    maps: config.maps,
    modes: config.modes
  });
});

var io = require('socket.io').listen(app.listen(port));

redis.on('ready', function () {
  redis.set('srcds_server_status', 'Pending');
  checkStatus(io);
});

io.sockets.on('connection', function (socket) {
  socket.on('start', function (data) {
    if (config.maps.indexOf(data.map) > -1 && config.modes.indexOf(data.mode) > -1) {
      runCommand('/bin/sh', [cmd, 'start', data.map, data.mode], function () {});
    }
  });

  socket.on('stop', function () {
    runCommand('/bin/sh', [cmd, 'stop'], function () {});
  });

  redis.get('srcds_server_status', function (err, result) {
    console.log('statusUpdate emitted: ' + result);
    io.sockets.emit('statusUpdate', parseStatus(result));
  })
});

function runCommand(cmd, args, callback ) {
  var child = spawn(cmd, args);
  var resp = "";

  child.stdout.on('data', function (buffer) { resp += buffer.toString() });
  child.stdout.on('end', function () { callback(resp) });
}

function checkStatus(io) {
  runCommand("/bin/sh", [cmd, 'status'], function (result) {
    redis.get('srcds_server_status', function (err, last_result) {

      if (result != last_result) {
        var status = parseStatus(result);
        io.sockets.emit('statusUpdate', status);
        redis.set('srcds_server_status', result);
      }

      setTimeout(function () {
        checkStatus(io);
      }, 2000);
    });
  });
}

function parseStatus(status) {
  var result,
      input = status.split(' ');

  if (input.length == 1) {
    result = { status: input[0] };
  } else {
    result = {
      status: input[0],
      map:    input[1],
      mode:   input[2]
    };
  }

  return result;
}

