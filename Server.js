const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares para procesar JSON y archivos estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Endpoint de Autenticación
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validación de credenciales
  if (username === 'bobinado' && password === 'weg2026') {
    // Redirige al menú de selección de curso (tlt.html)
    return res.json({ success: true, redirectTo: '/tlt' });
  } else if (username === 'admin' && password === 'admin2026') {
    return res.json({ success: true, redirectTo: '/control' });
  }

  return res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
});

// Rutas de navegación principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/tlt', (req, res) => {
  res.sendFile(path.join(__dirname, 'tlt.html'));
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.HTML'));
});

// Lógica de WebSocket (Socket.IO)
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Reenviar movimientos del trackpad a todas las pantallas
  socket.on('trackpad-move', (data) => {
    io.emit('trackpad-move', data);
  });

  // Reenviar clics del trackpad
  socket.on('trackpad-click', () => {
    io.emit('trackpad-click');
  });

  // Reenviar acciones del D-Pad / Botones
  socket.on('control-action', (data) => {
    io.emit('control-action', data);
  });

  // Reenviar escritura del teclado virtual
  socket.on('keyboard-input', (data) => {
    io.emit('keyboard-input', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
