# simple-websocket-chat
Simple websocket chat demo that uses Redis Pub/Sub for horizontal scaling.

## Requirements
- A running Redis instance on the default port.

## Usage
Install the dependences (`npm install`) and then just run the server process as follows:

`$ node server.js 8080`

The server will prompt you to connect to a specific URL that will provide the client HTML
interface. By modifying the URL you can authenticate as different users.

Try to spin up multiple instances of the chat server and look how all clients will still
be able to communicate even if connected to different processes.

