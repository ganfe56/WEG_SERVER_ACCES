const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO con CORS libre para llamadas externas
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Usuarios para la autenticación
const USUARIOS = {
  "bobinado": { pass: "weg2026", redirect: "/tlt" },
  "operador": { pass: "operador2026", redirect: "/tlt" },
  "admin": { pass: "admin2026", redirect: "/control" }
};

// 1. Ruta raíz sirve directamente login.html (ubicado en la raíz del proyecto)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// 2. Rutas del sitio mapeadas a las extensiones exactas del repositorio
app.get('/tlt', (req, res) => {
  res.sendFile(path.join(__dirname, 'tlt.html'));
});

app.get('/curso', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.HTML'));
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.HTML'));
});

// API de autenticación
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = username ? username.toLowerCase().trim() : '';

  if (USUARIOS[user] && USUARIOS[user].pass === password) {
    res.cookie('auth_token', 'logueado', { maxAge: 86400000, httpOnly: true });
    return res.json({ success: true, redirectTo: USUARIOS[user].redirect });
  }

  return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos." });
});

// Servir archivos estáticos desde la raíz
app.use(express.static(__dirname, { index: false }));

// Sincronización Socket.IO en tiempo real
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
  console.log(`🚀 Servidor WEG corriendo en el puerto ${PORT}`);
});
