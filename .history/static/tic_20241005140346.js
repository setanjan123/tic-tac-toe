var player;
var computer;
var socket = socket = io.connect('',{reconnect: true});  
var playerId;
var yourTurn;
var matchHash;


let board_full = false;
let play_board = ['','','','','','','','',''];

const board_container = document.querySelector(".play-area");

const winner_statement = document.getElementById("winner");


const render_board = () => {
  board_container.innerHTML = ""
  play_board.forEach((e, i) => {
    board_container.innerHTML += `<div id="block_${i}" class="block" onclick="addPlayerMove(${i})">${play_board[i]}</div>`
    if (e == player || e == computer) {
      document.querySelector(`#block_${i}`).classList.add("occupied");
    }
  });
};


const addPlayerMove = e => {
  if (!board_full && play_board[e] == "" && yourTurn === true) {
    play_board[e] = player;
    socket.emit('move',{answer:e+1,playerId:playerId,hash:matchHash});
    yourTurn = false;
    render_board();
  }
};

const quit = () => {
  socket.emit('quit',{playerId:playerId,hash:matchHash});
  window.location.href = '/play/index.html';
};


socket.on('game start', function (value) {
    playerId = value.playerId=='first'?1:2;
    matchHash = value.hash;
    winner.innerText = 'Game started. You are the '+value.playerId+' player.';
    player = playerId==1?'X':'O';
    computer =  playerId==1?'O':'X';
    yourTurn = playerId==1?true:false;
    render_board();
});

socket.on('your turn',function(boardArray){
    console.log('your turn');
    play_board = boardArray;
    render_board();
    yourTurn = true;
    winner.innerText = "Your Turn!";
});

socket.on('other turn',function(boardArray){
    console.log('other turn');
    play_board = boardArray;
    render_board();
    yourTurn = false;
    winner.innerText = "Waiting for other player";
});

socket.on('invalid input',function(boardArray){
    play_board = boardArray;
    render_board();
    winner.innerText = "invalid input. please try again";
});

socket.on('waiting',function(value){
  winner.innerText = value;
});

socket.on('game win',function(value){
    winner.innerText = "You Win!";
    winner.classList.add("playerWin");
    board_full = true
    play_board = value.boardArray;
    render_board();
    socket.close();
    setTimeout(()=>{
      window.location.href = '/play/index.html';
    },3000)
});

socket.on('game lose',function(value){
  winner.innerText = "You Lose!";
  winner.classList.add("computerWin");
  board_full = true
  play_board = value.boardArray;
  render_board();
  socket.close();
  setTimeout(()=>{
    window.location.href = '/play/index.html';
  },3000)
});

socket.on('game tied',function(value){
  winner.innerText = "Draw!";
  winner.classList.add("draw");
  play_board = value.boardArray;
  render_board();
  socket.close();
  setTimeout(()=>{
    window.location.href = '/play/index.html';
  },3000)
});

socket.on('game over',function(value){
  winner.innerText = value.message;
  winner.classList.add("draw");
  socket.close();
  setTimeout(()=>{
    window.location.href = '/play/index.html';
  },3000)
});