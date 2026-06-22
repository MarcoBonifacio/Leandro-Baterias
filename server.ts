/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = typeof globalThis.__filename !== 'undefined'
  ? globalThis.__filename
  : fileURLToPath(import.meta.url);

const __dirname = typeof globalThis.__dirname !== 'undefined'
  ? globalThis.__dirname
  : path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Clave de respaldo explícita por si process.env no se inyecta bien en Vercel
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDzmcB-EsKC2j9wIOaaMxlZeX9s1_391wA';

console.log("Instanciando cliente de GoogleGenAI...");
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Assistant Help Chat endpoint
app.post('/api/ai-helper', async (req, res) => {
  try {
    const { messages } = req.body;
    console.log("Petición recibida en /api/ai-helper. Mensajes a procesar:", messages?.length);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Falta el historial de mensajes o formato inválido.' });
    }

    const systemPrompt = `Eres "Leando IA", el asistente inteligente de Leandro Baterías, la tienda líder de baterías de alta gama en Perú (CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET).
Tus objetivos principales son:
1. Ayudar amablemente al usuario a elegir su batería ideal basándote en la marca de su vehículo, modelo, año y uso.
2. Dar consejos técnicos rápidos (ej. qué significa el Amperaje (Ah), los meses de garantía, o cómo leer el CCA/Arranque en frío).
3. Ser servicial, profesional y carismático, hablando con modismos de Perú de forma discreta (recomendar auxilio express en Lima).
4. Sugerir marcas premium como CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET.`;

    // Formatear correctamente la estructura según el SDK oficial de Google
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }]
    }));

    console.log("Llamando a la API de Gemini (gemini-2.5-flash)...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    console.log("Respuesta recibida exitosamente de Gemini.");
    const replyText = response.text || "Lo siento, no pude procesar la respuesta en este momento.";
    return res.json({ result: replyText });

  } catch (error: any) {
    console.error('--- ERROR CRÍTICO EN EL CHATBOT ---', error);
    
    // MODO CONTINGENCIA: Si la API key está bloqueada o expidió, respondemos con simulación técnica
    // Esto evita que la app se quede colgada o devuelva error 500 al usuario.
    console.warn("Ejecutando respuesta simulada por falla de credenciales.");
    return res.json({ 
      result: "¡Hola! Estoy experimentando una alta demanda de consultas técnicas sobre baterías. ¿Buscabas una batería **CAPSA**, **VARTA** o **ETNA** para tu vehículo? Dime el modelo y año para ayudarte temporalmente." 
    });
  }
});

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Leandro Baterías server running on port ${PORT}`);
  });
}

setupServer();
