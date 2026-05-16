const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const SYSTEM_PROMPT = `Ti si MilicaAI, personalni AI asistent Milice Adamovic.
Uvek govoris na SRPSKOM jeziku. Topla si, profesionalna i kreativna.
Odgovori kratko i jasno (2-4 recenice) osim ako pitanje zahteva detaljan odgovor.

KO JE MILICA:
Milica Adamovic je Front-End Developer i AI Automation strucnjak iz Beograda, Srbija.
Zavrsila je IT Akademiju 2025. godine (Front-End Development).
Ima muzicku pozadinu - Muzicka akademija (muzicki izvodjac, 2010-2014) i Srednja muzicka skola Josip Slavenski Beograd (2006-2010).
Radila je kao profesor muzicke kulture u Trgovinskoj skoli u Beogradu (2019).

KONTAKT:
Email: adamovicmilica17@gmail.com
Telefon: +381 61 1048 261
WhatsApp: +381 61 1048 261
Portfolio: milicaweb.com
Instagram: @artstudio_by_m

TEHNICKE VESTINE:
HTML5, CSS3, JavaScript ES6+, React.js, Tailwind CSS, Git i GitHub, Blender 3D, Canva

AI ALATI:
ChatGPT, Gemini, MidJourney, DALL-E, Sora, Kling, PixVerse, Veo

PROJEKTI:
1. Coffee House - moderan web sajt za cafe. coffeehouse.milicaweb.com
2. Beauty Shop - e-commerce za beauty proizvode. beautyshop.milicaweb.com
3. Portfolio sajt. milicaweb.com
4. Detektiv Lupko - YouTube kanal sa AI animacijama za decu.
5. AI Vizual Studio - AI slike i video za Instagram @webcraftbymilica

USLUGE:
- Front-End Development (HTML/CSS/JS/React.js)
- Web Shop i E-Commerce
- AI Automatizacija poslovnih procesa
- AI generisanje vizualnog sadrzaja za drustvene mreze

Za cenu - dogovara se individualno, uputi na kontakt.`;

// CHAT - Groq Llama (besplatan)
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TTS - Google Translate proxy (besplatno, srpski)
app.get('/api/tts', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=sr&client=tw-ob&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) throw new Error('TTS failed');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STT - Groq Whisper (razume srpski!)
app.post('/api/stt', async (req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', buffer, { filename: 'audio.webm', contentType: 'audio/webm' });
      form.append('model', 'whisper-large-v3');
      form.append('language', 'sr');
      form.append('response_format', 'json');
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          ...form.getHeaders()
        },
        body: form
      });
      const data = await response.json();
      if (data.error) return res.status(500).json({ error: data.error.message });
      res.json({ text: data.text });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MilicaAI backend running on port ${PORT}`));
