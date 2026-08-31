const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares para lectura de JSON, formularios y archivos estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Endpoint de Autenticación
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'bobinado' && password === 'weg2026') {
    return res.json({ success: true, redirectTo: '/tlt' });
  } else if (username === 'admin' && password === 'admin2026') {
    return res.json({ success: true, redirectTo: '/control' });
  }

  return res.json({ success: false, message: 'Usuario o contraseña incorrectos' });
});

// Rutas principales de navegación
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/tlt', (req, res) => {
  res.sendFile(path.join(__dirname, 'tlt.html'));
});

// Ruta /curso que respeta la query /curso?id=... y entrega index.html
app.get('/curso', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Respaldo por si el nombre tiene mayúsculas en el repositorio
    res.sendFile(path.join(__dirname, 'INDEX.html'));
  }
});

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.HTML'));
});

// Comunicación en tiempo real vía Socket.IO (Control Remoto & Trackpad)
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Movimiento del cursor (bolita)
  socket.on('trackpad-move', (data) => {
    io.emit('trackpad-move', data);
  });

  // Clic virtual
  socket.on('trackpad-click', () => {
    io.emit('trackpad-click');
  });

  // Acciones de botones de mando (siguiente, atrás, etc.)
  socket.on('control-action', (data) => {
    io.emit('control-action', data);
  });

  // Teclado virtual
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
