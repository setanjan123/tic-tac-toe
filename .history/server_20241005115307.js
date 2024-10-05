const PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server); 
const redis = require('redis');
require('dotenv').config()
const redisClient = redis.createClient({
    host: process.env.REDIS_HOSTNAME,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});
const cryptoRandomString = require('crypto-random-string')

redisClient.on("error", (error) => {
    console.error(error);
});

redisClient.on("connect", () => {
    console.log("Connected to our redis instance!");
});

const { promisify } = require("util");
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

app.use(express.static('static'))

io.on('connection', async client => {
let pool = await getAsync('matchmaking-pool');
if(pool==null) pool = []; 
else pool = JSON.parse(pool);
if(pool.length==0) {
       const roomHash = cryptoRandomString({ length: 10, type: 'alphanumeric' });
       const newMatch = {
             roomHash: roomHash,
       }
       pool.push(newMatch);
       await setAsync('matchmaking-pool',JSON.stringify(pool));
       client.join(roomHash);
       let clients = io.sockets.adapter.rooms.get(roomHash);
       let it = clients.values();
       const player1 = it.next().value;
       await setAsync(player1,roomHash);
       io.to(player1).emit('waiting','waiting for player 2');
} else {
     const match = pool.shift();
     await setAsync('matchmaking-pool',JSON.stringify(pool));
     client.join(match.roomHash);
     let clients = io.sockets.adapter.rooms.get(match.roomHash);
     let it = clients.values();
     const player1 = it.next().value;
     const player2 = it.next().value;
     await setAsync(player2,match.roomHash);
     const activeMatch = {
        boardArray : ['','','','','','','','',''],
        player1: player1,
        player2: player2
     }
     await setAsync(match.roomHash,JSON.stringify(activeMatch))
     io.to(player1).emit('game start',{playerId:'first',hash:match.roomHash});
     io.to(player2).emit('game start',{playerId:'second',hash:match.roomHash});
}

client.on('move',async (value)=>{
    let matchDetails = await getAsync(value.hash);
    matchDetails = JSON.parse(matchDetails);
    const player1 = matchDetails.player1;
    const player2 = matchDetails.player2;
    const boardArray = matchDetails.boardArray;
    if(parseInt(value.answer)<1||parseInt(value.answer)>9||boardArray[value.answer-1]!='') { //checking for invalid input
           if(value.playerId==1) {
              io.to(player1).emit('invalid input',boardArray);
           } else {
              io.to(player2).emit('invalid input',boardArray);
           }
    } else {
        boardArray[value.answer-1] = value.playerId==1?'X':'O';
        matchDetails.boardArray = boardArray;
        await setAsync(value.hash,JSON.stringify(matchDetails));
        const result = gameEngine(boardArray);
        if(result==0) {
            if(value.playerId==1) {
                io.to(player2).emit('your turn',boardArray);
                io.to(player1).emit('other turn',boardArray);
          } else {
              io.to(player1).emit('your turn',boardArray);
              io.to(player2).emit('other turn',boardArray);
          }
        } else if(result==3) {
                io.to(player1).emit('game tied',{boardArray:boardArray});
                io.to(player2).emit('game tied',{boardArray:boardArray});
                await delAsync(value.hash); 
        } else if(result==1) {
            io.to(player1).emit('game win',{boardArray:boardArray});
            io.to(player2).emit('game lose',{boardArray:boardArray});
            await delAsync(value.hash); 
        } else if(result==2) {
            io.to(player1).emit('game lose',{boardArray:boardArray});
            io.to(player2).emit('game win',{boardArray:boardArray});
            await delAsync(value.hash);   
        }
    }
})
client.on('quit',async (value)=>{
    let matchDetails = await getAsync(value.hash);
    matchDetails = JSON.parse(matchDetails);
    const player1 = matchDetails.player1;
    const player2 = matchDetails.player2;
    if(value.playerId==1) {
        io.to(player2).emit('game over',{message:'Game won by you as the other player forfeit the game'});
    } else {
        io.to(player1).emit('game over',{message:'Game won by you as the other player forfeit the game'}); 
    } 
    await delAsync(value.hash);
})

client.on('disconnect',async()=>{
       const playerId = client.id;
       const roomHash  = await getAsync(playerId);
       io.to(roomHash).emit('game over',{message:'Game won by you as the other player disconnected from the game'})   
})
});

function gameEngine(boardArray) {  //main function that checks for the win/tie condition
       let winningSymbol;
       if((boardArray[0]==boardArray[1])&&(boardArray[1]==boardArray[2])&&(boardArray[0]!='')) {
            winningSymbol=boardArray[0];
       } else if((boardArray[6]==boardArray[7])&&(boardArray[7]==boardArray[8])&&(boardArray[6]!='')) {
           winningSymbol=boardArray[6];
       } else if((boardArray[0]==boardArray[3])&&(boardArray[3]==boardArray[6])&&(boardArray[0]!='')) {
           winningSymbol=boardArray[0];
       } else if((boardArray[2]==boardArray[5])&&(boardArray[5]==boardArray[8])&&(boardArray[2]!='')) {
           winningSymbol=boardArray[2];
       } else if((boardArray[0]==boardArray[4])&&(boardArray[4]==boardArray[8])&&(boardArray[0]!='')){
           winningSymbol=boardArray[0];
       } else if((boardArray[3]==boardArray[4])&&(boardArray[4]==boardArray[5])&&(boardArray[3]!='')) {
           winningSymbol=boardArray[3]; 
       } else if((boardArray[1]==boardArray[4])&&(boardArray[4]==boardArray[7])&&(boardArray[1]!='')) {
           winningSymbol=boardArray[1];
       } else if((boardArray[2]==boardArray[4])&&(boardArray[4]==boardArray[6])&&(boardArray[2]!='')) {
           winningSymbol=boardArray[2];
       } else {
            if(!boardArray.includes('')) {
                return 3;
            } else {
                 return 0;
            }
       }
       if(winningSymbol=='X') {
        return 1;
      } else if(winningSymbol=='O') {
        return 2;
      } 
}

server.listen(PORT,()=>{
     console.log('Listening for players on port '+PORT);
});