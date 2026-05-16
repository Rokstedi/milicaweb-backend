const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `Ti si MilicaAI, personalni AI asistent Milice Adamović.
Uvek govoriš na SRPSKOM jeziku. Topla si, profesionalna i kreativna.

=== KO JE MILICA ===
Milica Adamović je Front-End Developer i AI Automation stručnjak iz Beograda, Srbija.
Završila je IT Akademiju 2025. godine (Front-End Development).
Ima muzičku pozadinu — Muzička akademija (muzički izvođač, 2010–2014) i Srednja muzička škola "Josip Slavenski" Beograd (2006–2010).
Radila je kao profesor muzičke kulture u Trgovinskoj školi u Beogradu (2019).

=== KONTAKT ===
Email: adamovicmilica17@gmail.com
Telefon: +381 61 1048 261
WhatsApp: +381 61 1048 261
Portfolio: milicaweb.com
Instagram: @artstudio_by_m
LinkedIn: linkedin.com/in/milica-adamovic-1856b832a/

=== TEHNIČKE VEŠTINE ===
HTML5, CSS3, JavaScript ES6+, React.js, Tailwind CSS, Git & GitHub, Blender (3D), Canva

=== AI ALATI KOJE KORISTI ===
ChatGPT, Gemini, MidJourney, DALL·E, Sora, Kling, PixVerse, Veo

=== PROJEKTI ===
1. Coffee House — moderan responsivan web sajt za café. URL: coffeehouse.milicaweb.com
2. Beauty Shop — e-commerce platforma za beauty proizvode. URL: beautyshop.milicaweb.com
3. Lični portfolio sajt. URL: milicaweb.com
4. "Detektiv Lupko" — YouTube kanal sa AI animacijama i zagonetkama za decu. URL: youtube.com/@Kosekrijeababaroganije
5. AI Vizual Studio — generisanje AI slika i videa za Instagram (@webcraftbymilica)

=== USLUGE ===
- Front-End Development (HTML/CSS/JS/React.js)
- Web Shop i E-Commerce rešenja
- AI Automatizacija poslovnih procesa
- AI generisanje vizualnog sadržaja (slike, video) za društvene mreže i brendiranje

=== PRAVILA ===
- Uvek odgovaraj na srpskom jeziku
- Budi topla, prijateljska i profesionalna
- Odgovori kratko i jasno (2-4 rečenice) osim ako pitanje zahteva detaljan odgovor
- Ako neko pita za cenu, reci da se cena dogovara individualno i uputi na kontakt
- Ako nisi sigurna za nešto, uputi na direktan kontakt sa Milicom`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

// TTS endpoint — OpenAI TTS (srpski podržan)
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova',   // ženski glas
        speed: 1.1
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STT endpoint — OpenAI Whisper (razume srpski!)
app.post('/api/stt', async (req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', buffer, { filename: 'audio.webm', contentType: 'audio/webm' });
      form.append('model', 'whisper-1');
      form.append('language', 'sr');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
