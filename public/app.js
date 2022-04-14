// if you want to deploy or use ngrok, you want to use the static version of your html being served on the server, with just a '/' here in the io.connection.
const socket = io.connect("/");
let roomID = ''
let game = {}

//New Game Created Listener
socket.on("newGame", (data) => {
    roomID = data.roomID
})


socket.on(`joined`, data => {
    roomID = data.roomID
})

socket.on('updateGameState', data => {
    game = data
    console.log(game)
    drawGameArea()
})

//Select Choice function
function makeChoice(choice) {
    socket.emit(`makeChoice`, { choice, roomID })
}

//Result Event Listener

function createGame(e) {
    e.preventDefault()
    socket.emit('createGame', { name: e.target.player1Name.value })
}

//Join Game Event Emitter
function joinGame(e) {
    e.preventDefault()
    socket.emit('joinGame', { name: e.target.player2Name.value, roomID: e.target.roomID.value })
    console.log(socket.id)
}


function playAgain() {
    socket.emit('playAgain', { roomID })
}

function drawGameArea() {
    document.getElementById('game-selection').hidden = true
    let el = document.getElementById('game')
    let template = /*HTML*/`
    <div class="leaderboard">
        <h1>Room ID: ${roomID}</h1>
        <h2>Welcome, ${game.players[socket.id].name}</h2>
        <h3>Score:</h3>
        `

    for (const key in game.players) {
        const player = game.players[key];
        template += /*HTML*/`
            <h4 class="name">
                    ${player.name}:
                    <span>${player.score}</span>
                </h4>`

    }

    template += /*HTML*/`       
    </div>
    <div class="controls">
        <button onclick="makeChoice('rock')" class="btn btn-primary">
            Rock
       </button>
       <button onclick="makeChoice('paper')" class="btn btn-info">
           Paper
       </button>
       <button onclick="makeChoice('scissors')" class="btn btn-danger">
           Scissors
       </button>
    </div>
    <div id="message">
        ${game.players[socket.id].message}
    </div>
    <br>`

    template += game.over ? /*HTML*/ `<button class="btn btn-success" onclick="playAgain()">Play Again</button>` : ''

    el.innerHTML = template
}

