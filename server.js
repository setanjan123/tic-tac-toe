const PORT = process.argv[2];
const server = require('http').createServer();
const io = require('socket.io')(server);
var boardArray = ['.','.','.','.','.','.','.','.','.'];
var player1,player2;
var initialized=0;

io.on('connection', client => {
if(initialized==0) {
    client.join('room');
    let clients = io.sockets.adapter.rooms.get('room');
    if(clients.size==2) {
        let it = clients.values();
        player1 = it.next().value;
        player2 = it.next().value;
        io.to(player1).emit('game start','first');
        io.to(player2).emit('game start','second');
        initialized=1;
    }
}
client.on('move',(value)=>{
    console.log(value);
    if(parseInt(value.answer)<1||parseInt(value.answer)>9||boardArray[value.answer-1]!='.') {
           if(value.playerId==1) {
              io.to(player1).emit('invalid input',boardArray);
           } else {
              io.to(player2).emit('invalid input',boardArray);
           }
    } else {
        boardArray[value.answer-1] = value.playerId==1?'X':'O';
        if(!gameEngine()) {
            if(value.playerId==1) {
                io.to(player2).emit('your turn',boardArray);
                io.to(player1).emit('other turn',boardArray);
          } else {
              io.to(player1).emit('your turn',boardArray);
              io.to(player2).emit('other turn',boardArray);
          }
        }
    }
})
client.on('quit',(playerId)=>{
    if(playerId==1) {
        io.to(player1).emit('game over','Game won by second player as first player forfeit the game');
        io.to(player2).emit('game over','Game won by second player as first player forfeit the game');
    } else {
        io.to(player1).emit('game over','Game won by first player as second player forfeit the game'); 
        io.to(player2).emit('game over','Game won by first player as second player forfeit the game'); 
    } 
    initialized=0;
    boardArray = ['.','.','.','.','.','.','.','.','.'];
})
});

function gameEngine() {
       let winningSymbol;
       if((boardArray[0]==boardArray[1])&&(boardArray[1]==boardArray[2])&&(boardArray[0]!='.')) {
            winningSymbol=boardArray[0];
       } else if((boardArray[6]==boardArray[7])&&(boardArray[7]==boardArray[8])&&(boardArray[6]!='.')) {
           winningSymbol=boardArray[6];
       } else if((boardArray[0]==boardArray[3])&&(boardArray[3]==boardArray[6])&&(boardArray[0]!='.')) {
           winningSymbol=boardArray[0];
       } else if((boardArray[2]==boardArray[5])&&(boardArray[5]==boardArray[8])&&(boardArray[2]!='.')) {
           winningSymbol=boardArray[2];
       } else if((boardArray[0]==boardArray[4])&&(boardArray[4]==boardArray[8])&&(boardArray[0]!='.')){
           winningSymbol=boardArray[0];
       } else if((boardArray[3]==boardArray[4])&&(boardArray[4]==boardArray[5])&&(boardArray[3]!='.')) {
           winningSymbol=boardArray[3]; 
       } else if((boardArray[1]==boardArray[4])&&(boardArray[4]==boardArray[7])&&(boardArray[1]!='.')) {
           winningSymbol=boardArray[1];
       } else if((boardArray[2]==boardArray[4])&&(boardArray[4]==boardArray[6])&&(boardArray[2]!='.')) {
           winningSymbol=boardArray[2];
       } else {
            if(!boardArray.includes('.')) {
                io.to(player1).emit('game over','Game is tied');
                io.to(player2).emit('game over','Game is tied');
                initialized=0;
                boardArray = ['.','.','.','.','.','.','.','.','.'];
                return true;
            } else {
                 return false;
            }
       }
       if(winningSymbol=='X') {
        io.to(player1).emit('game over','Game won by first player');
        io.to(player2).emit('game over','Game won by first player');
        initialized=0;
        boardArray = ['.','.','.','.','.','.','.','.','.'];
        return true;
      } else if(winningSymbol=='O') {
        io.to(player1).emit('game over','Game won by second player');
        io.to(player2).emit('game over','Game won by second player');
        initialized=0;
        boardArray = ['.','.','.','.','.','.','.','.','.'];
        return true;
      } 
}

server.listen(PORT,()=>{
     console.log('Listening for players on port '+PORT);
});