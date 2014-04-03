
var express = require('express');
var http = require('http');
var path = require('path');
var spawn = require('child_process').spawn;
var redis = require('redis').createClient();

redis.on('error', function (err) {
  console.log(err);
});

var app = express();
var port = String(process.env.PORT || 3220);
app.set('env', process.env.NODE_ENV || 'development');

var cmd;
if (app.get('env') == 'development') {
  cmd = "test.sh"
} else {
  cmd = "srcds_controller/serverController.sh";
}

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

app.get('/', function (req, res) {
  res.render('index', {
    title: 'Source Dedicated Server Control Area',
    maps: maps,
    modes: modes
  });
});

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function (socket) {
  redis.set('srcds_server_status', 'Pending');
  checkStatus(socket);

  socket.on('start', function (data) {
    if (maps.indexOf(data.map) > -1 && modes.indexOf(data.mode) > -1) {
      runCommand('/bin/sh', [cmd, 'start', data.map, data.mode], function () {});
    }
  });

  socket.on('stop', function () {
    runCommand('/bin/sh', [cmd, 'stop'], function () {});
  });
});

function runCommand(cmd, args, callback ) {
  var child = spawn(cmd, args);
  var resp = "";

  child.stdout.on('data', function (buffer) { resp += buffer.toString() });
  child.stdout.on('end', function () { callback(resp) });
}

function checkStatus(socket) {

  runCommand("/bin/sh", [cmd, 'status'], function (result) {

    redis.get('srcds_server_status', function (err, last_result) {

      if (result != last_result) {
        result_arr = result.split(' ');
        var status;
        if (result_arr.length == 1) {
          status = { status: result_arr[0] };
        } else {
          status = {
            status: result_arr[0],
            map: result_arr[1],
            mode: result_arr[2]
          };
        }

        socket.emit('statusUpdate', status);
        redis.set('srcds_server_status', result);
      }

    });

    setTimeout(function () {
      checkStatus(socket);
    }, 2000);
  });
}
