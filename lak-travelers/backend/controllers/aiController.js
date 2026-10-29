import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Hotel from '../models/Hotel.js';
import Tour from '../models/Tour.js';
import Vehicle from '../models/Vehicle.js';

const travelMatrix = {
  'colombo-sigiriya': { dist: '175km', time: '4h 30m' },
  'colombo-kandy': { dist: '115km', time: '3h 30m' },
  'colombo-galle': { dist: '125km', time: '2h 30m' },
  'colombo-ella': { dist: '210km', time: '5h 30m' },
  'colombo-nuwara eliya': { dist: '160km', time: '5h' },
  'kandy-sigiriya': { dist: '90km', time: '2h 30m' },
  'kandy-ella': { dist: '140km', time: '4h 30m' },
  'sigiriya-ella': { dist: '180km', time: '5h' },
  'ella-galle': { dist: '200km', time: '4h' },
};

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' });
};

const reputation = (item) => ({
  score: Math.round(Number(item.rating || 0) * 20),
  reviewCount: Number(item.numReviews || 0),
});

const getTravelContext = async (userMessage) => {
  const query = userMessage.toLowerCase();
  const durationMatch = query.match(/(\d+)\s*day/);
  const stayDuration = Math.min(Number(durationMatch?.[1] || 1), 30);
  const locations = ['sigiriya', 'ella', 'kandy', 'galle', 'colombo', 'bentota', 'nuwara eliya'];
  const detectedLocation = locations.find((location) => query.includes(location)) || 'sigiriya';
  const hotelFilter = { location: { $regex: detectedLocation, $options: 'i' } };
  if (query.includes('vegan')) hotelFilter.veganOptions = true;
  if (query.includes('luxury')) hotelFilter.luxuryGrade = 'Luxury';

  const [hotels, tours, vehicles] = await Promise.all([
    Hotel.find(hotelFilter).select('name location pricePerNight image rating numReviews').limit(3).lean(),
    Tour.find({ destinations: { $regex: detectedLocation, $options: 'i' } })
      .select('name destinations duration price image rating numReviews').limit(2).lean(),
    Vehicle.find({ isPrivate: true }).select('vehicleModel type pricePerDay images rating numReviews').limit(2).lean(),
  ]);

  const hotelPrice = Number(hotels[0]?.pricePerNight || 0);
  const vehiclePrice = Number(vehicles[0]?.pricePerDay || 0);
  const tourPrice = Number(tours[0]?.price || 0);

  return {
    location: detectedLocation,
    durationDays: stayDuration,
    routeFromColombo: travelMatrix[`colombo-${detectedLocation}`] || { dist: 'Check current route', time: 'Variable' },
    estimatedTotalLkr: hotelPrice * stayDuration + vehiclePrice * stayDuration + tourPrice,
    hotels: hotels.map((item) => ({ ...item, reputation: reputation(item) })),
    tours: tours.map((item) => ({ ...item, reputation: reputation(item) })),
    vehicles: vehicles.map((item) => ({ ...item, reputation: reputation(item) })),
  };
};

const normalizeHistory = (history) => (Array.isArray(history) ? history : [])
  .slice(-12)
  .map((item) => ({
    role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(item.content || item.parts?.[0]?.text || '').slice(0, 2000) }],
  }))
  .filter((item) => item.parts[0].text);

export const chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (typeof message !== 'string' || message.trim().length < 3 || message.length > 2000) {
      return res.status(400).json({ success: false, reply: 'Please enter a message between 3 and 2000 characters.' });
    }

    const model = getGeminiModel();
    if (!model) {
      return res.status(503).json({ success: false, reply: 'AI assistant is not configured yet.' });
    }

    const context = await getTravelContext(message);
    const systemInstruction = `You are Lak Assistant, a concise and trustworthy Sri Lanka travel planner.
Use only the supplied marketplace data for bookable recommendations and prices. Never invent availability, verification, safety records, or guarantees.
Clearly label all costs as estimates. Recommend checking current weather, closures, official visa rules, and provider confirmation.
When mentioning a marketplace item, include its MongoDB ID in the format (ID: id) so the application can link it.
Respond in the user's language when clear. Use readable Markdown and practical travel times.

CURRENT MARKETPLACE CONTEXT:
${JSON.stringify(context)}`;

    const request = model.generateContent({
      systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
      contents: [
        ...normalizeHistory(history),
        { role: 'user', parts: [{ text: message.trim() }] },
      ],
      generationConfig: { temperature: 0.5, maxOutputTokens: 1600 },
    });
    const result = await Promise.race([
      request,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), 30000)),
    ]);
    const reply = result.response.text()?.trim();
    if (!reply) throw new Error('Gemini returned an empty response');

    return res.status(200).json({ success: true, provider: 'gemini', reply });
  } catch (error) {
    console.error('Gemini AI error:', error.message);
    return res.status(502).json({ success: false, reply: 'The AI assistant is temporarily unavailable. Please try again.' });
  }
};
