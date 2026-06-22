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

// Solución para compatibilidad de rutas con ESM en entornos Node/Vercel
const __filename = typeof globalThis.__filename !== 'undefined'
  ? globalThis.__filename
  : fileURLToPath(import.meta.url);

const __dirname = typeof globalThis.__dirname !== 'undefined'
  ? globalThis.__dirname
  : path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Diagnóstico local para consola: Te avisa si Node cargó el archivo .env correctamente
console.log("¿GEMINI_API_KEY detectada?:", process.env.GEMINI_API_KEY ? "SÍ" : "NO");

// Inicialización limpia según los estándares oficiales de @google/genai
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

// AI Assistant Help Chat endpoint
app.post('/api/ai-helper', async (req, res) => {
  try {
    const { messages } = req.body;
    console.log("Petición recibida en /api/ai-helper. Historial de mensajes:", messages?.length);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Falta el historial de mensajes o formato inválido.' });
    }

    // System instruction del bot comercial Leando IA
    const systemPrompt = `Eres "Leando IA", el asistente inteligente de Leandro Baterías, la tienda líder de baterías de alta gama en Perú (CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET).
Tus objetivos principales son:
1. Ayudar amablemente al usuario a elegir su batería ideal basándote en la marca de su vehículo, modelo, año y uso.
2. Dar consejos técnicos rápidos (ej. qué significa el Amperaje (Ah), los meses de garantía, o cómo leer el CCA/Arranque en frío).
3. Ser servicial, profesional y carismático, hablando con modismos de Perú de forma discreta (recomendar auxilio express o instalación a domicilio en Lima).
4. Sugerir marcas premium como CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET.
Mantén tus respuestas bien formateadas, usando negritas para destacar y respondiendo en un tono amigable, directo y enfocado en solucionar el problema de batería del cliente.`;

    // Mapeo estructurado para mantener el historial compatible con la API de Google
    const contents = messages.map((m: any) => {
      const textContent = m.content || m.text || '';
      return {
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(textContent) }]
      };
    });

    console.log("Enviando conversación a Gemini (gemini-2.5-flash)...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    console.log("Respuesta generada exitosamente por la IA.");
    const replyText = response.text || "Lo siento, no pude procesar la respuesta en este momento.";
    return res.json({ result: replyText });

  } catch (error: any) {
    console.error('--- ERROR CRÍTICO EN EL CHATBOT ---', error);
    
    // Bloque de contingencia si la clave no conecta a los servidores de Google
    return res.json({ 
      result: "¡Hola! Estoy experimentando una alta demanda de consultas técnicas sobre baterías. ¿Buscabas una batería **CAPSA**, **VARTA** o **ETNA** para tu vehículo? Dime el modelo y año para ayudarte temporalmente. (Nota de desarrollo: Verifica que tu clave real esté cargada en tu archivo .env o panel de Vercel)." 
    });
  }
});

// Configuración del servidor intermedio para entorno de Desarrollo (Vite) y Producción (Static Assets)
async function setupServer() {
  // Verificamos si NO estamos en la infraestructura Serverless de Vercel y es modo Desarrollo
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Leandro Baterías server running locally on port ${PORT}`);
    });
  } else {
    // En producción (Vercel), servimos los archivos estáticos desde dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    // Solo abrimos puerto continuo si se corre la build de producción localmente fuera de Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on port ${PORT}`);
      });
    }
  }
}

setupServer();

// ¡ESTA LÍNEA ES CRUCIAL PARA VERCEL SERVERLESS!
export default app;
