
$(document).ready(function () {
  var socket = io.connect('/');
  window.socket = socket;
  var current_status = 'pending';

  var action_button = $('.status__control__button');
  var status_box = $('.status');
  var status_title = $('.status__title');

  $('.status__control__button').on('click', function () {
    status_box.removeClass('pending halted running');
    status_box.addClass('pending');
    status_title.text('Pending...');
    action_button.prop('disabled', true);

    if (current_status == 'Running') {
      console.log('Emitting stop');
      socket.emit('stop');
    } else {
      console.log('Emitting start');
      socket.emit('start', { map: 'cs_assault', mode: 'terrortown' });
    }
  });

  socket.on('statusUpdate', function (data) {
    console.log('statusUpdate was emitted: ', data);
    current_status = data.status;

    status_title.text(current_status);
    status_box.removeClass('pending halted running');
    status_box.addClass(current_status.toLowerCase());
    action_button.prop('disabled', false);

    if (current_status == 'Running') {
      action_button.text('Stop the server');
    } else {
      action_button.text('Start the server');
    }
  });
});
