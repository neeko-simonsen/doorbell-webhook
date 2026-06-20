// Doorbell webhook server
// Roblox calls this server -> this server calls Twilio -> Twilio calls your phone.

const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER, // the number Twilio gave you, e.g. +15551234567
  MY_PHONE_NUMBER,     // your real phone, e.g. +15559876543
  WEBHOOK_SECRET,      // a password only your Roblox script knows
} = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Simple in-memory cooldown so the endpoint can't be spammed
// (protects your Twilio credit even if someone finds the URL)
let lastCallTime = 0;
const COOLDOWN_MS = 20 * 1000; // 20 seconds

app.post('/ring-doorbell', async (req, res) => {
  // Check the shared secret
  if (req.headers['x-secret'] !== WEBHOOK_SECRET) {
    return res.status(403).send('Forbidden');
  }

  const now = Date.now();
  if (now - lastCallTime < COOLDOWN_MS) {
    return res.status(429).send('Cooldown active, try again shortly');
  }
  lastCallTime = now;

  try {
    const call = await client.calls.create({
      twiml: '<Response><Say voice="alice">Hello, mom. Its Nico, I made this call from a number that took me 4 and a half hours to script and code. Im so happy i got this working. Come pick me up anytime you wanna. IF you wanna play fortnite, call me so i can turn on my PS4. I dont know how long your staying up, but call me anytime. i will be up till 2 am probably. i hope you and the kids are doing ok. P.S: Goose stinks and i can smell him from here. Anyway, good night. Love you guys. Goodbye bye bye.</Say></Response>',
      to: MY_PHONE_NUMBER,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log('Call placed, SID:', call.sid);
    res.status(200).send('Calling!');
  } catch (err) {
    console.error('Twilio error:', err.message);
    res.status(500).send('Failed to place call');
  }
});

// Render needs the server to listen on the port it provides
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Doorbell webhook running on port ${PORT}`));
