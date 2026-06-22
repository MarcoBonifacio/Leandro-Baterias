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

// Solución híbrida para evitar el warning [empty-import-meta] en CommonJS (.cjs)
const __filename = typeof globalThis.__filename !== 'undefined'
  ? globalThis.__filename
  : fileURLToPath(import.meta.url);

const __dirname = typeof globalThis.__dirname !== 'undefined'
  ? globalThis.__dirname
  : path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDzmcB-EsKC2j9wIOaaMxlZeX9s1_391wA';

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
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Falta el historial de mensajes o formato inválido.' });
    }

    // System instruction to guide the AI model to be a helpful battery salesperson for Leandro Baterías
    const systemPrompt = `Eres "Leando IA", el asistente inteligente de Leandro Baterías, la tienda líder de baterías de alta gama en Perú (CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET).
Tus objetivos principales son:
1. Ayudar amablemente al usuario a elegir su batería ideal basándote en la marca de su vehículo, modelo, año y uso (auto clásico, moderno, cargado de electrónica, camión, taxi, etc.).
2. Dar consejos técnicos rápidos (ej. qué significa el Amperaje (Ah), los meses de garantía, o cómo leer el CCA/Arranque en frío).
3. Ser servicial, profesional y carismático, hablando con modismos de Perú de forma discreta y cortés (ej. recomendar instalación express o auxilio a domicilio en Lima).
4. Si el cliente tiene dudas, sugiérele elegir entre marcas premium como CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET.
Mantén tus respuestas bien formateadas, usando negritas para destacar y respondiendo en un tono amigable, directo y enfocado en solucionar el problema de batería del cliente.`;

    // Map message formats for Gemini Chats
    const chatHistory = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // The last message is the prompt to send
    const lastMsg = chatHistory[chatHistory.length - 1];
    const previousHistory = chatHistory.slice(0, chatHistory.length - 1);

    const chatInstance = ai.chats.create({
      model: 'gemini-2.5-flash', // NOTA: He actualizado a un modelo oficial de producción como gemini-2.5-flash
      config: {
        systemInstruction: systemPrompt,
      },
      history: previousHistory
    });

    const response = await chatInstance.sendMessage({
      message: lastMsg.parts[0].text
    });

    return res.json({ result: response.text });
  } catch (error: any) {
    console.error('Error in /api/ai-helper:', error);
    return res.status(500).json({ error: 'Error del asistente de inteligencia artificial.' + (error.message ? ` ${error.message}` : '') });
  }
});

// Configure Vite middleware for development or Static Asset serving for Production
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
