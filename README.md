💧 Drippy — DRIP. SERVED DAILY.
AI-powered digital wardrobe, weather-aware outfit stylist, and daily fashion companion.
![Image](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![Image](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![Image](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Image](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![Image](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)
![Image](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?logo=firebase&logoColor=black)
![Image](https://img.shields.io/badge/Mobile-Expo_%26_React_Native-000020?logo=expo&logoColor=white)
📖 Overview
Drippy is a personal digital stylist designed to eliminate morning decision fatigue and elevate personal fashion. By combining computer vision cataloging, real-time hyper-local weather data, rule-based fashion color/silhouette theory, and Gemini AI styling intelligence, Drippy generates curated outfits every single morning from items you already own.
✨ Core Features & Progress
1. 🌤️ Daily Drip & Weather-Aware Styling
Real-Time Weather Integration: Live temperature, weather conditions, feels-like readings, and daily highs/lows using Open-Meteo & reverse geocoding (automatic GPS or manual city selection).
Today's Drip: Morning outfit recommendation tailored to current weather and day's occasion.
Feedback & Decision Loop:
Wear This: Logs wear count on items and advances your daily Drip Streak.
Not Wearing: Smart pass mechanism that prompts an instant fresh fit alternative.
Save & Share: Bookmark favorites to your personal style vault or publish directly to the community feed.
2. 🧠 Hybrid Recommendation Engine
Drippy balances mathematical styling logic with creative generative AI:
Color Harmony: Monochromatic palettes, neutral balancing, complementary & analogous harmony.
Silhouette & Visual Weight: Balances fitted vs. oversized cuts and statement versus minimal pieces.
Weather Suitability: Temperature thresholds for layering, fabric breathability, and rain/wind protection.
Wear Fatigue Mitigation: Prevents repetitive outfit suggestions by penalizing recently worn items.
Physique Alignment: Adapts proportions to user body type, height, and fit preferences.
Editorial AI Rationale: Provides professional stylist explanations for why pieces work together.
3. 📸 AI Wardrobe Digitizer (Gemini Vision)
Instant Photo Extraction: Upload a photo of clothing or an entire outfit—Gemini automatically detects, separates, and catalogs each garment.
Rich Fashion Metadata: Extracts category, subcategory, primary/secondary colors, hue, pattern, fabric material, fit, silhouette, season, formality score (1–10), and layering weight.
Layering Detection: Identifies layered garments (e.g., inner t-shirt + open overshirt + coat).
4. 🗄️ Digital Wardrobe Vault
Browse items across categories: Tops, Bottoms, Outerwear, Shoes, and Accessories.
Search by color, material, style, and seasonal tags.
Detailed item modal with times-worn counter, confidence scores, and custom notes.
5. 🔥 Drip Streaks & Gamification
Track daily styling consistency with the Drip Streak banner.
Milestones, longest streak tracking, and styling motivation badges.
6. 🌐 Community Discover Feed
Share your best daily fits with the Drippy community.
Explore streetwear, smart casual, minimal, and vintage inspirations from other creators.
Interactive likes, bookmarking, and discussion comments.
7. 📱 Cross-Platform Architecture (Web + Mobile App)
Web App: Responsive desktop & mobile web experience built with React 19, Tailwind CSS v4, and Motion.
Mobile App: Native iOS & Android companion in /mobile built with Expo, Expo Router, React Native Safe Area Context, and custom Lucide icons.
🎨 Visual Identity & Design System
Drippy features a distinctive editorial aesthetic inspired by high-fashion journals and contemporary streetwear culture:
Token	Hex / Value	Usage
Burgundy	#8B1E3F	Primary brand accent, active tabs, action buttons
Burgundy Dark	#721833	Gradients, deep contrast, hover states
Cream	#F5F0E8	Warm editorial background, card surfaces
Charcoal	#111111	Primary typography, deep widgets, bold headings
Muted Gray	#777777	Secondary text, subtitles, category tags
Border Gray	#D8D0C4	Subtle borders, dividers, frame outlines
📂 Project Structure
code
Text
├── src/                          # Web Frontend & Shared Client Logic
│   ├── components/               # UI components (Header, WeatherCard, OutfitCard, etc.)
│   ├── views/                    # Primary views (Home, Wardrobe, Add, Discover, Profile)
│   ├── lib/                      # Recommendation engine, color theory, Firebase client
│   ├── types.ts                  # Shared TypeScript interfaces & models
│   ├── App.tsx                   # Main React entry & tab state router
│   ├── main.tsx                  # React DOM mount point
│   └── index.css                 # Global CSS with Tailwind v4 theme
├── server.ts                     # Full-stack Node/Express backend & Gemini API proxy
├── mobile/                       # Expo / React Native Mobile Application
│   ├── app/                      # Expo Router navigation (tabs: Home, Wardrobe, Add, Discover, Profile)
│   ├── src/
│   │   ├── components/           # React Native components (OutfitCard, WeatherCard, Header, etc.)
│   │   ├── constants/            # Theme tokens (COLORS, FONTS, RADIUS)
│   │   ├── services/             # Mobile data services & mock seeds
│   │   └── types/                # Mobile TypeScript types
│   ├── app.json                  # Expo application configuration
│   └── package.json              # Mobile app dependencies
├── firebase-blueprint.json       # Firestore database schemas & permissions
├── firestore.rules               # Firestore security rules
└── package.json                  # Root dependencies & build scripts
🚀 Getting Started
Prerequisites
Node.js (v18+ recommended)
npm or bun
Environment Configuration
Create a .env file in the root directory (refer to .env.example):
code
Bash
GEMINI_API_KEY=your_google_gemini_api_key_here
Running the Web Application
code
Bash
# Install dependencies
npm install

# Start the full-stack development server (Express backend + Vite HMR)
npm run dev

# The app will be running at http://localhost:3000
Production Build
code
Bash
# Build both frontend bundle and Node server
npm run build

# Start the production server
npm start
Running the Mobile App (Expo)
code
Bash
cd mobile

# Install mobile dependencies
npm install

# Start the Expo development server
npm start

# Or run directly on an emulator:
# npm run ios
# npm run android
🛠️ API Reference
Endpoint	Method	Description
/api/health	GET	Health check & Gemini API key status
/api/weather	GET	Fetches live weather by city name or lat/lon coordinates
/api/gemini/analyze-outfit	POST	Computer vision breakdown of clothing photo into structured items
/api/gemini/recommend-outfit	POST	AI-assisted daily outfit curation given weather, wardrobe, and preferences
🗺️ Roadmap & Next Steps
📄 License
Private repository. All rights reserved.
DRIP. SERVED DAILY. 💧
