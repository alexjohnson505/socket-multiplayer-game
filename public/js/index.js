function init() {

    // Init client to Socket.IO server (using Base Domain)
    var socket = io.connect(document.domain);
    var sessionId = '';

    // Update the participants' list
    function updateParticipants(participants) {

        // Clear list
        $('#participants').html('');

        // List participants
        for (var i = 0; i < participants.length; i++) {
            $('#participants').append('<span id="' + participants[i].id + '">' +
            participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
        }
    }

    /***************************
         SOCKET.IO ACTIONS
     ***************************/

    // On Success -> auth
    socket.on('connect', function() {
        sessionId = socket.io.engine.id; // Save session ID
        console.log('Connected ' + sessionId);

        socket.emit('newUser', {
            id: sessionId,
            name: $('#name').val()
        });
    });

    // New Connection: Reset participants
    socket.on('newConnection', function(data) {
        updateParticipants(data.participants);
    });

    // User Disconnect : Remove User's Span
    socket.on('userDisconnected', function(data) {
        $('#' + data.id).remove();
    });

    // Name Change : Update Span
    socket.on('nameChanged', function(data) {
        $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
    });

    // Incoming Message : Add to Messages
    socket.on('incomingMessage', function(data) {
        var message = data.message;
        var name = data.name;
        $('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
    });

    // Error : Log it
    socket.on('error', function(reason) {
        console.log('Unable to connect to server', reason);
    });

    // Send Message: AJAX POST w/ textarea
    function sendMessage() {
        var outgoingMessage = $('#outgoingMessage').val();
        var name = $('#name').val();

        $.ajax({
            url: '/message',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                message: outgoingMessage,
                name: name
            })
        });
    }

    // Support [Enter] key for sending
    function outgoingMessageKeyDown(event) {
        if (event.which == 13) {
            event.preventDefault();
            if ($('#outgoingMessage').val().trim().length <= 0) {
                return;
            }
            sendMessage();
            $('#outgoingMessage').val('');
        }
    }

    // Send Button Status
    function outgoingMessageKeyUp() {
        var outgoingMessageValue = $('#outgoingMessage').val();
        $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
    }

    // Emit Name Change
    function nameFocusOut() {
        var name = $('#name').val();
        socket.emit('nameChange', {
            id: sessionId,
            name: name
        });
    }

    // Elements
    $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
    $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
    $('#name').on('focusout', nameFocusOut);
    $('#send').on('click', sendMessage);
}

// Init doc.
$(document).on('ready', init);