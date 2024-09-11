import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io(import.meta.env.VITE_BACKEND_URL);

function Square({ value, onSquareClick }) {
  return <button className="square" onClick={onSquareClick}>{value}</button>;
}

function Refresh({ onRefreshclick }) {
  return <button className='refresh' onClick={onRefreshclick}>Refresh the Game</button>;
}

export default function App() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameId, setGameId] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to the server');
    });

    socket.on('gameState', ({ squares, xIsNext }) => {
      setSquares(squares);
      setXIsNext(xIsNext);
    });

    socket.on('gameCreated', (data) => {
      console.log('Game created:', data); // Log the game creation event
      setGameId(data.gameId);
      setPlayerSymbol('X'); // First player is 'X'

      navigator.clipboard.writeText(data.gameId)
        .then(() => {
          setMessage('Game ID copied to clipboard!');
          setTimeout(() => setMessage(''), 3000); // Hide message after 3 seconds
        })
        .catch(err => {
          console.error('Could not copy Game ID:', err);
        });
    });

    socket.on('gameJoined', (data) => {
      setGameId(data.gameId);
      setPlayerSymbol('O'); // Second player is 'O'
    });

    socket.on('resetgame', () => {

      setSquares(Array(9).fill(null));
      setXIsNext(true);
    });

    // Cleanup on unmount
    return () => {
      socket.off('gameState');
      socket.off('connect');
      socket.off('gameCreated');
      socket.off('gameJoined');
      socket.off('resetgame')
    };
  }, []);

  function handleClick(i) {
    if (squares[i] == null && !calculateWinner(squares) && playerSymbol === (xIsNext ? 'X' : 'O')) {
      socket.emit('makeMove', { gameId, index: i, symbol: playerSymbol });
    }
  }

  const winner = calculateWinner(squares);

  let status;
  if (winner) {
    status = "Winner: " + winner;
  } else if (playerSymbol === (xIsNext ? 'X' : 'O')) {
    status = "It's your turn!";
  } else {
    status = "Waiting for your opponent's move...";
  }

  function handleCreateGame() {
    socket.emit('createGame');
  }

  function handleJoinGame(gameId) {
    console.log(gameId)
    socket.emit('joinGame', { gameId });
  }

  function handlerefresh(gameId) {
    const nullArray = Array(9).fill(null);
    setSquares(nullArray);
    setXIsNext(true)
    socket.emit('resetgame', { gameId })
  }

  return (
    <>

      {gameId ? (
        <>
          <div className="status">{status}</div>
          <div className='GameID'>
            <p>Game ID: {gameId}</p>
            <p>Share this ID with another player to join the game!</p>
          </div>
          <div className="board-row">
            <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
            <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
            <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
          </div>
          <div className="board-row">
            <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
            <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
            <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
          </div>
          <div className="board-row">
            <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
            <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
            <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
          </div>
          <div>
            <Refresh onRefreshclick={() => handlerefresh(gameId)} />
          </div>
        </>
      ) : (
        <>
          <button onClick={handleCreateGame}>Create Game</button>
          <button onClick={() => handleJoinGame(prompt('Enter Game ID:'))}>Join Game</button>
        </>
      )} <div className="footer">
        Made with ChatGPT and love by <a href="https://www.linkedin.com/in/withvivekkumar" target="_blank" rel="noopener noreferrer">Vivek Kumar</a>
      </div>
    </>
  );
}


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
