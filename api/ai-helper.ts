import { GoogleGenAI } from '@google/genai';

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

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solamente se admite método POST' });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Falta el historial de mensajes o formato inválido.' });
    }

    const systemPrompt = `Eres "Leandro IA", el asistente inteligente de Leandro Baterías, la tienda líder de baterías de alta gama en Cusco, Perú (CAPSA, SOLITE, VARTA, ULTRABAT, ETNA, ENERJET).
Tus objetivos principales son:
1. Ayudar amablemente al usuario a elegir su batería ideal basándote en la marca de su vehículo, modelo, año y uso (auto clásico, moderno, cargado de electrónica, camión, taxi, etc.).
2. Dar consejos técnicos rápidos (ej. cómo influye la altura y el frío de Cusco en el arranque del auto, qué significa el Amperaje (Ah), o el valor de CCA/Arranque en frío necesario para climas fríos).
3. Ser servicial, profesional y carismático, hablando con modismos de Perú de forma discreta y cortés (ej. recomendar instalación express o auxilio a domicilio en Cusco-Cusco).
4. Si el cliente tiene dudas, sugiérele elegir entre las marcas líderes disponibles en nuestra tienda: VARTA (tecnología alemana de alto rendimiento, ideal para el frío), SOLITE (excelente duración para autos modernos), CAPSA (máxima confiabilidad), ULTRABAT (fuerza extrema), ETNA o ENERJET.
Mantén tus respuestas bien formateadas, usando negritas para destacar y respondiendo en un tono amigable, directo y enfocado en solucionar el problema de batería del cliente en Cusco.`;

    const chatHistory = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const lastMsg = chatHistory[chatHistory.length - 1];
    const previousHistory = chatHistory.slice(0, chatHistory.length - 1);

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-pro',
      'gemini-3.5-flash'
    ];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting AI generation with model: ${modelName}`);
        const chatInstance = ai.chats.create({
          model: modelName,
          config: {
            systemInstruction: systemPrompt,
          },
          history: previousHistory
        });

        const response = await chatInstance.sendMessage({
          message: lastMsg.parts[0].text
        });

        if (response && response.text) {
          responseText = response.text;
          lastError = null;
          break;
        }
      } catch (err: any) {
        console.warn(`Failed to generate content with ${modelName}:`, err);
        lastError = err;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return res.status(200).json({ result: responseText });
  } catch (error: any) {
    console.error('Error in Vercel API /api/ai-helper:', error);
    return res.status(500).json({ error: 'Error del asistente de inteligencia artificial.' + (error.message ? ` ${error.message}` : '') });
  }
}
