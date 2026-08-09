import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  decideOutfitStructure,
  generateCandidateOutfits,
  scoreCandidates,
  RECOMMENDATION_WEIGHTS,
} from './src/lib/recommendationEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with ample limit for image uploads
  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini AI Client securely server-side
  const aiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: aiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasGeminiKey: !!aiKey });
  });

  // Weather API Endpoint (Supports city query or lat/lon coordinates)
  app.get('/api/weather', async (req, res) => {
    try {
      const city = req.query.city as string;
      const reqLat = req.query.lat ? parseFloat(req.query.lat as string) : null;
      const reqLon = req.query.lon ? parseFloat(req.query.lon as string) : null;

      let lat = 40.7128;
      let lon = -74.0060;
      let cityName = city || 'New York';

      if (reqLat !== null && reqLon !== null && !isNaN(reqLat) && !isNaN(reqLon)) {
        lat = reqLat;
        lon = reqLon;
        // Reverse geocode to get city name
        try {
          const revGeoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'User-Agent': 'DrippyApp/1.0' } }
          );
          if (revGeoRes.ok) {
            const revData = await revGeoRes.json();
            cityName = revData.address?.city || revData.address?.town || revData.address?.state || revData.address?.country || 'Current Location';
          }
        } catch (e) {
          console.warn('Reverse geocoding fallback', e);
          cityName = 'Current Location';
        }
      } else if (city) {
        // Geocoding attempt via Open-Meteo Geocoding
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
              cityName = `${geoData.results[0].name}${geoData.results[0].country ? `, ${geoData.results[0].country}` : ''}`;
            }
          }
        } catch (e) {
          console.warn('Geocoding fallback used', e);
        }
      }

      // Fetch live weather from Open-Meteo
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&forecast_days=1`
      );

      if (weatherRes.ok) {
        const wData = await weatherRes.json();
        const current = wData.current || {};
        const daily = wData.daily || {};

        const code = current.weather_code ?? 1;
        let condition = 'Partly Cloudy';
        let icon = '⛅';

        if (code === 0) { condition = 'Clear Sky'; icon = '☀️'; }
        else if (code >= 1 && code <= 3) { condition = 'Partly Cloudy'; icon = '⛅'; }
        else if (code >= 45 && code <= 48) { condition = 'Foggy'; icon = '🌫️'; }
        else if (code >= 51 && code <= 67) { condition = 'Light Rain'; icon = '🌧️'; }
        else if (code >= 71 && code <= 77) { condition = 'Snowy'; icon = '❄️'; }
        else if (code >= 80 && code <= 82) { condition = 'Rain Showers'; icon = '🌦️'; }
        else if (code >= 95) { condition = 'Thunderstorm'; icon = '⛈️'; }

        return res.json({
          temp: Math.round(current.temperature_2m ?? 75),
          condition,
          feelsLike: Math.round(current.apparent_temperature ?? 76),
          highTemp: Math.round(daily.temperature_2m_max?.[0] ?? 80),
          lowTemp: Math.round(daily.temperature_2m_min?.[0] ?? 65),
          city: cityName,
          icon,
          isLive: true,
        });
      }

      // Default fallback weather
      res.json({
        temp: 78,
        condition: 'Partly Cloudy',
        feelsLike: 80,
        highTemp: 82,
        lowTemp: 68,
        city: 'New York',
        icon: '⛅',
        isLive: false,
      });
    } catch (error) {
      console.error('Weather error:', error);
      res.json({
        temp: 75,
        condition: 'Partly Cloudy',
        feelsLike: 77,
        highTemp: 81,
        lowTemp: 66,
        city: 'New York',
        icon: '⛅',
        isLive: false,
      });
    }
  });

  // 1. UPGRADED CLOTHING IMAGE ANALYSIS ROUTE (Gemini Vision)
  app.post('/api/gemini/analyze-outfit', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data is required' });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const promptText = `
You are Drippy AI, an expert computer vision cataloger and digital wardrobe analyst.
Analyze this outfit photo carefully and identify all distinct visible clothing items (e.g. inner top, outer overshirt/jacket, trousers/shorts, sneakers, accessories).

LAYERING DIRECTIVE:
If the person is wearing 2 tops (such as an inner t-shirt or polo layered underneath an open button-down shirt, cardigan, sweater, or jacket), identify BOTH as distinct pieces!

For each item identified, extract detailed structured fashion metadata in JSON:
- category: top | bottom | outerwear | shoes | accessory
- subcategory: specific item type (e.g., oversized t-shirt, textured polo, relaxed denim jeans, leather loafers, baseball cap, chore jacket)
- name: concise stylish title (e.g. "Green Textured Short Sleeve Shirt", "Beige Drawstring Trousers", "Dark Green Striped Overshirt")
- primaryColor: main color name (e.g. "black", "white", "beige", "navy", "green", "burgundy")
- secondaryColors: array of minor colors if any
- hue: approximate hue descriptor e.g. "warm earthy", "cool neutral", "deep muted"
- saturation: neutral | muted | vibrant
- brightness: dark | mid | light
- pattern: solid | graphic | striped | plaid | textured | patterned
- material: cotton | linen | denim | wool | leather | polyester | knit | canvas | unknown
- fit: slim | regular | relaxed | oversized | unknown
- silhouette: boxy | tailored | athletic | flowy | unknown
- style: casual | streetwear | minimal | smart casual | formal | sporty | vintage
- season: array e.g. ["spring", "summer", "autumn"]
- formality: casual | smart casual | formal | sporty
- formalityScore: integer between 1 and 10
- layeringWeight: light | mid | heavy
- visualWeight: light | medium | statement
- texture: ribbed | smooth | denim | waffle | leather | suede | unknown
- confidence: numeric value between 0.8 and 1.0

If any attribute is uncertain, use "unknown" or reasonable fashion estimation.
`;

      const reqContent = [
        {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: promptText },
          ],
        },
      ];

      const reqConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  subcategory: { type: Type.STRING },
                  name: { type: Type.STRING },
                  primaryColor: { type: Type.STRING },
                  secondaryColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hue: { type: Type.STRING },
                  saturation: { type: Type.STRING },
                  brightness: { type: Type.STRING },
                  pattern: { type: Type.STRING },
                  material: { type: Type.STRING },
                  fit: { type: Type.STRING },
                  silhouette: { type: Type.STRING },
                  style: { type: Type.STRING },
                  season: { type: Type.ARRAY, items: { type: Type.STRING } },
                  formality: { type: Type.STRING },
                  formalityScore: { type: Type.INTEGER },
                  layeringWeight: { type: Type.STRING },
                  visualWeight: { type: Type.STRING },
                  texture: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ['category', 'subcategory', 'name', 'primaryColor', 'style', 'formality'],
              },
            },
          },
          required: ['items'],
        },
      };

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: reqContent,
          config: reqConfig,
        });
        responseText = response.text || '';
      } catch (primaryErr) {
        console.warn('gemini-3.6-flash failed for outfit analysis:', primaryErr);
        try {
          const fallbackResp = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: reqContent,
            config: reqConfig,
          });
          responseText = fallbackResp.text || '';
        } catch (secondaryErr) {
          console.warn('Fallback model also failed:', secondaryErr);
        }
      }

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            // Map primaryColor to color property for backward compatibility
            const mappedItems = parsed.items.map((i: any) => ({
              ...i,
              color: i.primaryColor || i.color || 'black',
            }));
            return res.json({ items: mappedItems });
          }
        } catch (e) {
          console.warn('JSON parse error from Gemini vision response:', e);
        }
      }

      // Fallback
      return res.json({
        items: [
          {
            category: 'top',
            subcategory: 'shirt',
            name: 'Uploaded Outfit Top',
            color: 'black',
            primaryColor: 'black',
            pattern: 'solid',
            style: 'casual',
            season: ['spring', 'summer', 'autumn', 'winter'],
            formality: 'casual',
            formalityScore: 4,
            confidence: 0.88,
          },
          {
            category: 'bottom',
            subcategory: 'pants',
            name: 'Uploaded Outfit Bottom',
            color: 'blue',
            primaryColor: 'blue',
            pattern: 'solid',
            style: 'casual',
            season: ['spring', 'summer', 'autumn', 'winter'],
            formality: 'casual',
            formalityScore: 4,
            confidence: 0.85,
          },
        ],
      });
    } catch (error: any) {
      console.error('Error analyzing outfit image with Gemini:', error);
      return res.json({
        items: [
          {
            category: 'top',
            subcategory: 'apparel',
            name: 'Uploaded Apparel Item',
            color: 'black',
            primaryColor: 'black',
            pattern: 'solid',
            style: 'casual',
            season: ['spring', 'summer', 'autumn', 'winter'],
            formality: 'casual',
            formalityScore: 4,
            confidence: 0.8,
          },
        ],
      });
    }
  });

// Helper for honest wardrobe gap analysis
function analyzeWardrobeGap(wardrobeItems: any[], weatherInfo?: any, occasion?: string): { reason: string; note: string } {
  if (!wardrobeItems || wardrobeItems.length === 0) {
    return {
      reason: "Your closet is currently empty. Add a few essential pieces (tops, bottoms, shoes) to unlock outfit recommendations.",
      note: "Add 2-3 basic wardrobe items to get started.",
    };
  }

  const tops = wardrobeItems.filter((i: any) => i.category === 'top' || i.category === 'outerwear');
  const bottoms = wardrobeItems.filter((i: any) => i.category === 'bottom');
  const shoes = wardrobeItems.filter((i: any) => i.category === 'shoes');

  if (tops.length === 0) {
    return {
      reason: "Your closet is missing tops (t-shirts, shirts, or hoodies). Add a top to generate complete outfits.",
      note: "Add 1-2 tops to unlock recommendations.",
    };
  }
  if (bottoms.length === 0) {
    return {
      reason: "Your closet is missing bottoms (jeans, trousers, or shorts). Add a pair of bottoms to generate complete outfits.",
      note: "Add 1-2 bottoms to unlock recommendations.",
    };
  }
  if (shoes.length === 0) {
    return {
      reason: "Your closet is missing footwear. Add sneakers, loafers, or shoes to complete your look.",
      note: "Add a pair of shoes to complete your outfits.",
    };
  }

  const tempF = weatherInfo?.temp ?? 70;
  const occ = (occasion || '').toLowerCase();

  // Weather gap check
  if (tempF <= 42) {
    const hasLongPants = bottoms.some((b: any) => !(b.subcategory || '').toLowerCase().includes('shorts'));
    if (!hasLongPants) {
      return {
        reason: `Your wardrobe currently only has warm-weather shorts, which aren't suitable for today's chilly ${tempF}°F weather.`,
        note: "Add long pants or jeans for cold weather.",
      };
    }
  }

  if (tempF >= 82) {
    const hasLightTops = tops.some((t: any) => t.category === 'top' && t.layeringWeight !== 'heavy');
    if (!hasLightTops) {
      return {
        reason: `Your wardrobe mainly consists of heavy winter jackets and coats, which are too warm for today's ${tempF}°F heat.`,
        note: "Add lightweight t-shirts or short-sleeve tops for warm weather.",
      };
    }
  }

  // Occasion gap check
  if (occ.includes('formal') || occ.includes('wedding') || occ.includes('gala')) {
    const hasFormalShoes = shoes.some(
      (s: any) => !(s.subcategory || '').toLowerCase().includes('slides') && !(s.subcategory || '').toLowerCase().includes('running') && !(s.subcategory || '').toLowerCase().includes('flip flop')
    );
    if (!hasFormalShoes) {
      return {
        reason: `Your closet has great casual footwear, but lacks suitable formal shoes for today's ${occasion} occasion.`,
        note: "Add clean dress shoes or loafers for formal events.",
      };
    }
  }

  return {
    reason: `We evaluated all combinations from your wardrobe, but couldn't find a suitable outfit for today's ${tempF}°F conditions and ${occasion} occasion.`,
    note: "Try adding a few versatile items to expand your matching possibilities.",
  };
}

  // 2. MULTI-STAGE RECOMMENDATION ENGINE PIPELINE (Deterministic + AI Fashion Critic)
  app.post('/api/gemini/recommend-outfit', async (req, res) => {
    try {
      const {
        wardrobeItems,
        weatherInfo,
        occasion = 'Casual',
        preferredStyle = 'Streetwear',
        physiqueProfile,
        excludedCombinations = [],
        outfitHistory = [],
      } = req.body;

      if (!wardrobeItems || !Array.isArray(wardrobeItems)) {
        return res.status(400).json({ error: 'Wardrobe items array is required.' });
      }

      // STAGE 1: Automatic Stylist Structure Decision
      const structureDecision = decideOutfitStructure(weatherInfo, occasion, preferredStyle);

      // Check for insufficient wardrobe
      if (wardrobeItems.length < 2) {
        const gap = analyzeWardrobeGap(wardrobeItems, weatherInfo, occasion);
        return res.json({
          outfitName: "We Couldn't Find a Great Match",
          selectedItemIds: [],
          reason: gap.reason,
          weatherSuitability: 0,
          occasionSuitability: 0,
          styleDescription: preferredStyle,
          insufficientWardrobeNote: gap.note,
          debugInfo: {
            candidates: [],
            rejectedCandidates: [],
            selectedOutfit: null,
            structureDecision,
            weightsUsed: RECOMMENDATION_WEIGHTS,
          },
        });
      }

      // STAGE 2: Generate Candidate Outfits adhering to Structure Decision
      const rawCandidates = generateCandidateOutfits(wardrobeItems, structureDecision, 32);

      // STAGE 3: Deterministic Filtering & Scoring
      const excludedCombosSet = new Set<string>(
        Array.isArray(excludedCombinations) ? excludedCombinations : []
      );

      const { scoredCandidates, rejectedCandidates } = scoreCandidates(
        rawCandidates,
        preferredStyle,
        occasion,
        weatherInfo,
        structureDecision,
        excludedCombosSet
      );

      if (scoredCandidates.length === 0) {
        const gap = analyzeWardrobeGap(wardrobeItems, weatherInfo, occasion);
        return res.json({
          outfitName: "We Couldn't Find a Great Match",
          selectedItemIds: [],
          reason: gap.reason,
          weatherSuitability: 0,
          occasionSuitability: 0,
          styleDescription: preferredStyle,
          insufficientWardrobeNote: gap.note,
          debugInfo: {
            candidates: [],
            rejectedCandidates,
            selectedOutfit: null,
            structureDecision,
            weightsUsed: RECOMMENDATION_WEIGHTS,
          },
        });
      }

      // STAGE 4: AI FASHION CRITIC EVALUATION (Second Gemini Pass)
      const topCandidatesForCritic = scoredCandidates.slice(0, 4);
      const wardrobeMap = new Map<string, any>(wardrobeItems.map((i: any) => [i.id, i]));

      const criticPromptPayload = topCandidatesForCritic.map((cand) => {
        const fullItems = cand.itemIds.map((id) => wardrobeMap.get(id)).filter(Boolean);
        return {
          candidateId: cand.id,
          items: fullItems.map((item) => ({
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            color: item.primaryColor || item.colors?.[0] || item.name,
            pattern: item.pattern,
            style: item.style,
            formality: item.formality,
            layeringWeight: item.layeringWeight,
          })),
          deterministicScore: cand.overallScore,
        };
      });

      const criticPromptText = `
You are the Drippy AI Fashion Critic — an encouraging, stylish personal stylist.
Your job is to evaluate candidate outfit combinations for a user attending a "${occasion}" occasion in ${weatherInfo?.temp || 75}°F weather (${weatherInfo?.condition || 'clear'}), seeking a "${preferredStyle}" aesthetic.

CRITICAL EVALUATION PRINCIPLES:
1. WEARABILITY OVER PERFECTION: Simple, everyday combinations (e.g. hoodie + jeans + sneakers, or t-shirt + chinos + sneakers) are VALID and WEARABLE. Mark them "approved": true with a score between 60 and 85. Do NOT reject an outfit merely because it is simple or basic.
2. REJECT ONLY FUNDAMENTAL IMPOSSIBILITIES: Set "approved": false ONLY if the outfit has a severe practical flaw (e.g. heavy winter coat in 85°F heat, gym slides to a formal wedding, 2 pairs of pants).
3. SCORE RANGE:
   - Excellent looks: 88 - 100
   - Good looks: 75 - 87
   - Acceptable / Simple looks: 60 - 74
   - Unwearable / Severely flawed: < 50

Candidates to Critique:
${JSON.stringify(criticPromptPayload, null, 2)}

Provide your critique as structured JSON for each candidate:
- evaluations: array of objects containing:
  - candidateId: matching string ID
  - approved: boolean
  - score: integer score from 0 to 100
  - strengths: array of short strings
  - problems: array of short strings
  - reason: concise 1-2 sentence stylist summary
`;

      const criticConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  candidateId: { type: Type.STRING },
                  approved: { type: Type.BOOLEAN },
                  score: { type: Type.INTEGER },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  problems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reason: { type: Type.STRING },
                },
                required: ['candidateId', 'approved', 'score', 'strengths', 'problems', 'reason'],
              },
            },
          },
          required: ['evaluations'],
        },
      };

      try {
        const criticResponse = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: criticPromptText,
          config: criticConfig,
        });

        if (criticResponse.text) {
          const criticParsed = JSON.parse(criticResponse.text);
          if (criticParsed && Array.isArray(criticParsed.evaluations)) {
            const evalMap = new Map<string, any>(criticParsed.evaluations.map((e: any) => [e.candidateId, e]));

            topCandidatesForCritic.forEach((cand: any) => {
              const evalData = evalMap.get(cand.id);
              if (evalData) {
                cand.criticEvaluation = {
                  score: evalData.score,
                  approved: evalData.approved,
                  strengths: evalData.strengths || [],
                  problems: evalData.problems || [],
                  reason: evalData.reason || cand.reasoning,
                };

                if (!evalData.approved && evalData.score < 50) {
                  cand.overallScore = 45; // Hard penalty for fundamentally bad combinations
                  cand.criticRejected = true;
                } else {
                  cand.overallScore = Math.round(cand.overallScore * 0.5 + evalData.score * 0.5);
                }
                cand.reasoning = evalData.reason || cand.reasoning;
              }
            });
          }
        }
      } catch (criticErr) {
        console.warn('AI Fashion Critic step bypassed or failed:', criticErr);
      }

      // STAGE 5: Final Selection Hierarchy (Levels 1 to 4)
      scoredCandidates.sort((a, b) => b.overallScore - a.overallScore);

      const winner = scoredCandidates.find((c: any) => !c.criticRejected && c.overallScore >= 88) ||
                     scoredCandidates.find((c: any) => !c.criticRejected && c.overallScore >= 75) ||
                     scoredCandidates.find((c: any) => !c.criticRejected && c.overallScore >= 60) ||
                     scoredCandidates.find((c: any) => !c.criticRejected && c.overallScore >= 50) ||
                     scoredCandidates.find((c: any) => c.overallScore >= 50);

      if (!winner) {
        const gap = analyzeWardrobeGap(wardrobeItems, weatherInfo, occasion);
        return res.json({
          outfitName: "We Couldn't Find a Great Match",
          selectedItemIds: [],
          reason: gap.reason,
          weatherSuitability: 0,
          occasionSuitability: 0,
          styleDescription: preferredStyle,
          insufficientWardrobeNote: gap.note,
          debugInfo: {
            candidates: scoredCandidates,
            rejectedCandidates,
            selectedOutfit: null,
            structureDecision,
            weightsUsed: RECOMMENDATION_WEIGHTS,
          },
        });
      }

      // Verify returned item IDs belong strictly to user wardrobe
      const validWardrobeIds = new Set(wardrobeItems.map((i: any) => i.id));
      const verifiedItemIds = winner.itemIds.filter((id: string) => validWardrobeIds.has(id));

      if (verifiedItemIds.length === 0) {
        return res.status(400).json({ error: 'Security verification failed: Selected items do not belong to user wardrobe.' });
      }

      const winnerItems = verifiedItemIds.map((id: string) => wardrobeMap.get(id)).filter(Boolean);
      const topNames = winnerItems.map((i: any) => i.name).slice(0, 2).join(' & ');

      let outfitName = `${preferredStyle} ${occasion} Drip`;
      if (winner.overallScore < 75) {
        outfitName = `Best Available ${preferredStyle} Fit`;
      }

      let finalReason = winner.reasoning || `A cohesive pairing of ${topNames} selected for ${occasion.toLowerCase()} wear in ${weatherInfo?.temp || 75}° weather.`;

      const responsePayload = {
        outfitName,
        selectedItemIds: verifiedItemIds,
        reason: finalReason,
        weatherSuitability: Math.round(winner.overallScore) / 100, // Overall match score
        occasionSuitability: Math.round(winner.occasionSuitability) / 100,
        styleDescription: preferredStyle,
        debugInfo: {
          candidates: scoredCandidates,
          rejectedCandidates,
          selectedOutfit: winner,
          structureDecision,
          weightsUsed: RECOMMENDATION_WEIGHTS,
        },
      };

      return res.json(responsePayload);
    } catch (error: any) {
      console.error('Error generating outfit recommendation pipeline:', error);
      const itemsList = Array.isArray(req.body?.wardrobeItems) ? req.body.wardrobeItems : [];
      const fallbackIds = itemsList.slice(0, 3).map((i: any) => i.id);
      return res.json({
        outfitName: 'Fresh Everyday Drip',
        selectedItemIds: fallbackIds,
        reason: 'Clean combination of your wardrobe items suited for today.',
        weatherSuitability: 0.88,
        occasionSuitability: 0.85,
        styleDescription: req.body?.preferredStyle || 'Everyday casual',
      });
    }
  });

  // Vite middleware for dev mode or static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Drippy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Drippy server:', err);
});
