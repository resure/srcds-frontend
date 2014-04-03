
$(document).ready(function () {
  var socket = io.connect('/');

  socket.on('statusUpdate', function (data) {
    $('.status__title').text(data.status);
    $('.status').removeClass('pending halted running');
    $('.status').addClass(data.status.toLowerCase());
    console.log(data);
  });
});
