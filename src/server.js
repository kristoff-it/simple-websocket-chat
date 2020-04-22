const { Multiplexer } = require("redis-mpx");
const redis = require('redis');
const WebSocket = require('ws');

// Just used to server the static client.html file:
const fs = require('fs');
const http = require('http');
const url = require('url');

// Create a Redis Pub/Sub multiplexer and a Redis connection
// to publish chat messages over.
let mpx = new Multiplexer("localhost:6379");
let publish = redis.createClient({retry_strategy: () => 100});
const MAIN_CHANNEL = "simple-chat-main-channel";

// Start the websocket server
const wss = new WebSocket.Server({ noServer: true });

// Start the basic http server that will return the client html page
const server = http.createServer(function (req, res) {
	fs.readFile("client.html", function (err,data) {
		res.writeHead(200);
		res.end(data);
	});
});

// We are attaching the websocket server to the main http server
// manually because we want to store inside the websocket object
// the username that the user declared when connecting.
server.on("upgrade", function(request, socket, head) {
	const connUrl = new URL(request.url, "http://localhost");
	if (connUrl.pathname === '/ws') {
		wss.handleUpgrade(request, socket, head, function done(ws) {
			ws.username = connUrl.searchParams.get("username");
			console.log(connUrl.searchParams);
			wss.emit('connection', ws, request);
		});
	}
})


wss.on('connection', function connection(ws) {
	// We want to subscribe each websocket to the same 
	// Pub/Sub channel. If the chat application supported multiple
	// rooms, then it would have made sense to use mpx.createChannelSubscription.
	// This is what allows us to receive messages also from websocket
	// clients connected to another instance.
	ws.sub = mpx.createPatternSubscription(MAIN_CHANNEL, function (ch, msg){
		ws.send(msg.toString());
	});


	// When the websocket send a message, we append to it the username and
	// then publish it on Redis Pub/Sub.
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
		let completeMsg = `${ws.username}: ${message}`;
		publish.publish(MAIN_CHANNEL, completeMsg);
	});

	// While not fundamental in this example, it's important to cleanup
	// the subscription when the client disconnects.
	ws.on('close', function () {
		console.log("[ws] closing");
		ws.sub.close();
	});

	ws.send("You are now autenticated as: " + ws.username);
});

if (process.argv.length != 3) {
	console.log("usage: node server.js <port>");
	process.exit();
}



console.log(`Open http://localhost:${process.argv[2]}/?username=alice in your browser.`);
console.log(`Change the username inside the URL to "authenticate" as a different user.`);
console.log(`\nSpin up multiple instances of this process and see how clients can still all communicate.`);

server.listen(process.argv[2]);