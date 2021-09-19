const PORT = process.argv[3];
const serverIP = process.argv[2];
var io = require('socket.io-client');

const readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});




