const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const USUARIOS = {
  "bobinado": { pass: "weg2026", redirect: "/tlt" },
  "operador": { pass: "operador2026", redirect: "/tlt" },
  "admin": { pass: "admin2026", redirect: "/control" }
};

// 1. La raíz entra directo al Login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 2. Endpoint de Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = username ? username.toLowerCase().trim() : '';

  if (USUARIOS[user] && USUARIOS[user].pass === password) {
    res.cookie('auth_token', 'logueado', { maxAge: 86400000, httpOnly: true });
    return res.json({ success: true, redirectTo: USUARIOS[user].redirect });
  }

  return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos." });
});

// 3. Vista Principal TLT (Lista de todos los puestos)
app.get('/tlt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tlt.html'));
});

// 4. Curso e Interfaz de Control Remoto
app.get('/curso', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Socket.IO en tiempo real intacto
let appState = { currentIdx: 0, exercisePassed: false };
io.on('connection', (socket) => {
  socket.emit('sync-state', appState);
  socket.on('app-state-update', (data) => {
    if (typeof data.currentIdx === 'number') appState.currentIdx = data.currentIdx;
    if (typeof data.exercisePassed === 'boolean') appState.exercisePassed = data.exercisePassed;
    socket.broadcast.emit('app-state-update', data);
  });
  socket.on('control-action', (data) => io.emit('control-action', data));
  socket.on('trackpad-move', (data) => socket.broadcast.emit('trackpad-move', data));
  socket.on('trackpad-down', (data) => socket.broadcast.emit('trackpad-down', data));
  socket.on('trackpad-up', (data) => socket.broadcast.emit('trackpad-up', data));
  socket.on('trackpad-click', (data) => socket.broadcast.emit('trackpad-click', data));
  socket.on('keyboard-input', (data) => socket.broadcast.emit('keyboard-input', data));
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor WEG listo en http://localhost:${PORT}`);
});