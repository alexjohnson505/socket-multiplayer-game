console.log("Server Starting...")

// Module dependencies:
var express = require("express")
  , app = express()                               // Express
  , http = require("http").createServer(app)      // HTTP
  , bodyParser = require("body-parser")           // Body-parser
  , io = require("socket.io").listen(http)        // Socket.IO
  , _ = require("underscore");                    // Underscore.js

var participants = [];

// Server config
app.set("ip", "127.0.0.1");              // Set IP
app.set("port", 8080);                   // Set Port
app.set("views", __dirname + "/views");  // Set /views folder
app.set("view engine", "jade");          // Use Jade for HTML parsing

// Specify public folder
app.use(express.static("public", __dirname + "/public"));

// Support JSON requests
app.use(bodyParser.json());

/*****************************
           ROUTING
 *****************************/

// Home
app.get("/", function(request, response) {
  	response.render("index");
});

// Test Express -> Return JSON Object
app.get("/test", function(request, response) {
  	response.json(200, {message: "express is cool"});
});

/*****************************
        API Response
 *****************************/

app.post("/message", function(request, response) {
  // Example: $ curl -X POST -H 'Content-Type:application/json' 'http://localhost:8080/message' -d '{"message":"Good News Everyone!"}'

  // request = {message : msg, name : name};
  var message = request.body.message;

  // Error Handling
  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }

  //We also expect the sender's name with the message
  var name = request.body.name;

  //Let our chatroom know there was a new message
  io.sockets.emit("incomingMessage", {message: message, name: name});

  // Success
  response.json(200, {message: "Message received"});
});

/* Socket.IO events */
io.on("connection", function(socket){

  /*
    When a new user connects to our server, we expect an event called "newUser"
    and then we'll emit an event called "newConnection" with a list of all
    participants to all connected clients
  */
  socket.on("newUser", function(data) {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit("newConnection", {participants: participants});
  });

  /*
    When a user changes his name, we are expecting an event called "nameChange"
    and then we'll emit an event called "nameChanged" to all participants with
    the id and new name of the user who emitted the original message
  */
  socket.on("nameChange", function(data) {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  });

  /*
    When a client disconnects from the server, the event "disconnect" is automatically
    captured by the server. It will then emit an event called "userDisconnected" to
    all participants with the id of the client that disconnected
  */
  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });
});

// Start HTTP server
http.listen(app.get("port"), app.get("ip"), function() {
  console.log("Server up and running.");
  console.log("URL: http://" + app.get("ip") + ":" + app.get("port"));
});