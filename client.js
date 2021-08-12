const PORT = process.argv[3];
const serverIP = process.argv[2];
var io = require('socket.io-client');
var socket = io.connect('http://'+serverIP+':'+PORT, {reconnect: true});
const readline = require('readline');
var playerId;

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var waitForUserInput = function() {
    rl.question("Please enter your moves: ", function(answer) {
       if (answer == "r"){ // if player resigns/forfeits
           rl.close();
           socket.emit('quit',playerId);
       } else {
           socket.emit('move',{answer:answer,playerId:playerId});
       }
     });
}

socket.on('connect', function () {
    console.log('Connected to '+serverIP+' '+PORT);
});

socket.on('game start', function (value) {
    playerId = value=='first'?1:2;
    console.log('Game started. You are the '+value+' player.');
    console.log('...');
    console.log('...');
    console.log('...');
    if(playerId==1) {
        waitForUserInput();
    } else {
        console.log('waiting for player 1 move');
    }
});

socket.on('your turn',function(boardArray){
    console.log(boardArray[0]+boardArray[1]+boardArray[2]);
    console.log(boardArray[3]+boardArray[4]+boardArray[5]);
    console.log(boardArray[6]+boardArray[7]+boardArray[8]);
    waitForUserInput();
});

socket.on('other turn',function(boardArray){
    console.log(boardArray[0]+boardArray[1]+boardArray[2]);
    console.log(boardArray[3]+boardArray[4]+boardArray[5]);
    console.log(boardArray[6]+boardArray[7]+boardArray[8]);
    console.log('waiting for other player move');
});

socket.on('invalid input',function(boardArray){
    console.log(boardArray[0]+boardArray[1]+boardArray[2]);
    console.log(boardArray[3]+boardArray[4]+boardArray[5]);
    console.log(boardArray[6]+boardArray[7]+boardArray[8]);
    console.log('invalid input. please try again');
    waitForUserInput();
});

socket.on('game over',function(message){
    console.log(message);
    socket.close();
});
