const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { config } = require("dotenv")

config();

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin: process.env.FRONTEND_URL
}));

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
    }
});

let games = {}; // Store game states

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createGame', () => {
        const gameId = uuidv4();
        console.log('Generated game ID:', gameId);
        games[gameId] = {
            squares: Array(9).fill(null),
            xIsNext: true,
            players: [socket.id]
        };
        socket.join(gameId);
        console.log(`User created game ${gameId}`);
        socket.emit('gameCreated', { gameId });
    });

    socket.on('joinGame', ({ gameId }) => {
        console.log(`User trying to join game ${gameId}`);
        if (games[gameId] && games[gameId].players.length < 2) {
            games[gameId].players.push(socket.id);
            socket.join(gameId);
            socket.emit('gameJoined', { gameId });
            io.to(gameId).emit('gameState', { squares: games[gameId].squares, xIsNext: games[gameId].xIsNext });
            console.log(`User  joined game ${gameId}`);
        } else {
            socket.emit('error', { message: 'Game is full or does not exist.' });
        }
    });

    socket.on('makeMove', ({ gameId, index, symbol }) => {
        const game = games[gameId];
        if (game && game.squares[index] == null && symbol === (game.xIsNext ? 'X' : 'O')) {
            game.squares[index] = symbol;
            game.xIsNext = !game.xIsNext;
            io.to(gameId).emit('gameState', { squares: game.squares, xIsNext: game.xIsNext });

            // Check for a winner
            const winner = calculateWinner(game.squares);
            if (winner) {
                io.to(gameId).emit('gameOver', { winner });
                //delete games[gameId];

            }
        }
    });

    socket.on('resetgame', ({ gameId }) => {
        if (games[gameId]) {
            games[gameId].squares = Array(9).fill(null);  // Reset the board state
            games[gameId].xIsNext = true;                 // Reset the turn to X
            io.to(gameId).emit('resetgame', { squares: games[gameId].squares, xIsNext: games[gameId].xIsNext }); // Broadcast reset state
        }
    });


    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
