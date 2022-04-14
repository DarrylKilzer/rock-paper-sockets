const app = require('express');
const socket = require('socket.io');
const port = process.env.port || 3000
const cors = require('cors')

const express = app();

const server = express.listen(port, () => {
    console.log(`'server started at http://localhost:'${port}`);
})


// path should lead to folder containing previos code
express.use(app.static('public'));

const io = socket(server, { cors: {} });

//track players in rooms
let rooms = {}
//track VARIABLES


// establish connection
io.on("connection", (socket) => {
    console.log("connection established ", socket.id);

    //Create Game Listener
    socket.on("createGame", data => {
        const roomID = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 5);
        socket.join(roomID);
        rooms[roomID] = { over: false, players: {} };
        rooms[roomID].players[`${socket.id}`] = { name: data.name, choice: '', message: 'Make a choice...', score: 0 }
        socket.emit("newGame", { roomID: roomID });
        socket.emit('updateGameState', rooms[roomID])
        console.log(rooms);
    })

    //Join Game Listener
    socket.on('joinGame', data => {
        if (!rooms[data.roomID]) {
            return
        }
        rooms[data.roomID].players[socket.id] = { name: data.name, choice: '', message: 'Make a choice...', score: 0 }
        socket.emit('joined', { roomID: data.roomID })
        socket.broadcast.emit('updateGameState', rooms[data.roomID])
        socket.emit('updateGameState', rooms[data.roomID])
        console.log(socket.id)
        console.log(rooms)
    })

    //Listener for Player 1's Choice
    //Listener to Player 2's Choice
    socket.on('makeChoice', data => {
        if (!rooms[data.roomID]) {
            return
        }
        let player = rooms[data.roomID].players[socket.id]
        player.choice = player.choice ? player.choice : data.choice
        player.message = player.message == 'Make a choice...' ? `You chose ${player.choice}` : player.message
        evaluateGame(socket.id, data.roomID)
        socket.broadcast.emit('updateGameState', rooms[data.roomID])
        socket.emit('updateGameState', rooms[data.roomID])
        console.log(data, rooms)
    })


    socket.on('playAgain', data => {
        if (!rooms[data.roomID]) {
            return
        }
        const game = rooms[data.roomID]
        game.over = false
        for (const key in game.players) {
            const player = game.players[key];
            player.choice = ''
            player.message = 'Make a choice...'
        }
        socket.broadcast.emit('updateGameState', game)
        socket.emit('updateGameState', game)
    })

    //evaluate result after getting both choices

})

let choices = ['rock', 'paper', 'scissors']
let outcomes = ['You win!', 'You lose!', 'It was a tie']

// you can create functions out here to help find the winner, etc
function evaluateGame(player1SocketID, roomID) {
    const game = rooms[roomID]
    let player1Choice = ''
    let player2Choice = ''
    let player1 = {}
    let player2 = {}
    for (const socketID in game.players) {
        if (socketID == player1SocketID) {
            player1Choice = choices.indexOf(game.players[socketID].choice)
            player1 = game.players[socketID]
        } else {
            player2Choice = choices.indexOf(game.players[socketID].choice)
            player2 = game.players[socketID]
        }
        if (game.players[socketID].choice == '') {
            return
        }
    }
    if (!game.over) {
        game.over = true
        let player1OutcomeIndex = (player1Choice - player2Choice + 2) % 3
        let player2OutcomeIndex = (player2Choice - player1Choice + 2) % 3
        player1.score += player1OutcomeIndex == 0 ? 10 : 0
        player2.score += player2OutcomeIndex == 0 ? 10 : 0

        player1.message = `${player2.name} chose ${player2.choice}, you chose ${player1.choice}. ${outcomes[player1OutcomeIndex]}`
        player2.message = `${player1.name} chose ${player1.choice}, you chose ${player2.choice}. ${outcomes[player2OutcomeIndex]}`
    }
}