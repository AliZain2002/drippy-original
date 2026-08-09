import { WardrobeItem, WeatherData, CandidateOutfit, OutfitHistoryItem } from '../types';

export const RECOMMENDATION_WEIGHTS = {
  colorHarmony: 0.25,
  styleCoherence: 0.20,
  weatherSuitability: 0.20,
  occasionSuitability: 0.20,
  formalityConsistency: 0.10,
  novelty: 0.05,
};

const NEUTRAL_COLORS = new Set([
  'black', 'white', 'cream', 'beige', 'gray', 'charcoal', 'navy', 'brown', 'tan', 'khaki', 'denim', 'stone', 'ivory'
]);

export function normalizeColor(colorStr: string = ''): string {
  const c = colorStr.toLowerCase().trim();
  if (c.includes('black') || c.includes('dark gray') || c.includes('charcoal')) return 'black';
  if (c.includes('white') || c.includes('off-white') || c.includes('ivory')) return 'white';
  if (c.includes('beige') || c.includes('cream') || c.includes('tan') || c.includes('khaki') || c.includes('sand')) return 'beige';
  if (c.includes('blue') || c.includes('denim') || c.includes('navy')) return 'navy';
  if (c.includes('gray') || c.includes('grey') || c.includes('silver')) return 'gray';
  if (c.includes('green') || c.includes('olive') || c.includes('sage') || c.includes('forest')) return 'green';
  if (c.includes('brown') || c.includes('chocolate') || c.includes('mocha')) return 'brown';
  if (c.includes('red') || c.includes('burgundy') || c.includes('maroon')) return 'burgundy';
  return c || 'neutral';
}

// 1. STYLIST AUTOMATIC OUTFIT STRUCTURE DECISION (BEFORE CANDIDATE GENERATION)
export interface StructureDecision {
  allowLayering: boolean;
  layeringMode: 'none' | 'light_outer' | 'warm_layer' | 'full_layer';
  reasoning: string;
}

export function decideOutfitStructure(
  weather?: Partial<WeatherData>,
  occasion?: string,
  _style?: string
): StructureDecision {
  if (!weather || typeof weather.temp !== 'number') {
    return {
      allowLayering: true,
      layeringMode: 'light_outer',
      reasoning: 'Standard weather; single tops and light layers are both valid options.',
    };
  }

  let tempF = weather.temp;
  if (tempF < 45 && tempF > 0 && weather.temp < 35) {
    tempF = Math.round(tempF * 1.8 + 32);
  }

  const condition = (weather.condition || '').toLowerCase();
  const isRain = condition.includes('rain') || condition.includes('drizzle');
  const isWind = condition.includes('wind') || condition.includes('breezy');

  // Hot Weather: Above 80°F
  if (tempF >= 80) {
    return {
      allowLayering: false,
      layeringMode: 'none',
      reasoning: `Hot weather (${tempF}°F) favors lightweight single tops. Layering is not recommended.`,
    };
  }

  // Warm Weather: 72°F - 79°F
  if (tempF >= 72) {
    if (isRain || isWind) {
      return {
        allowLayering: true,
        layeringMode: 'light_outer',
        reasoning: `Warm (${tempF}°F) but with ${weather.condition}; a very light layer or overshirt is acceptable.`,
      };
    }
    return {
      allowLayering: true,
      layeringMode: 'light_outer',
      reasoning: `Warm temperature (${tempF}°F) favors single tops or optional unbuttoned light overshirts.`,
    };
  }

  // Mild Weather: 60°F - 71°F
  if (tempF >= 60) {
    return {
      allowLayering: true,
      layeringMode: 'light_outer',
      reasoning: `Mild temperature (${tempF}°F) allows single tops (hoodies/sweaters) or light layering (jacket/overshirt).`,
    };
  }

  // Cool Weather: 50°F - 59°F
  if (tempF >= 50) {
    return {
      allowLayering: true,
      layeringMode: 'warm_layer',
      reasoning: `Cool temperature (${tempF}°F) works well with hoodies, sweaters, or jacket layering.`,
    };
  }

  // Cold Weather: Below 50°F
  return {
    allowLayering: true,
    layeringMode: 'full_layer',
    reasoning: `Cold temperature (${tempF}°F) favors warm hoodies, sweaters, or outerwear.`,
  };
}

// 2. ENHANCED COLOR HARMONY & PATTERN/TEXTURE COMPATIBILITY (0 - 100)
export function calculateColorHarmony(items: WardrobeItem[]): number {
  if (items.length <= 1) return 85;

  const mainItems = items.filter((i) => i.category !== 'accessory');
  const colors = mainItems.map((i) => normalizeColor(i.primaryColor || i.colors?.[0] || i.name));
  const nonNeutrals = colors.filter((c) => !NEUTRAL_COLORS.has(c));

  let score = 90;

  // Patterns
  const patternedItems = mainItems.filter((i) => {
    const p = (i.pattern || '').toLowerCase();
    return p.includes('striped') || p.includes('plaid') || p.includes('graphic') || p.includes('patterned') || p.includes('check');
  });

  // Textures
  const texturedItems = mainItems.filter((i) => {
    const t = (i.texture || '').toLowerCase();
    const p = (i.pattern || '').toLowerCase();
    return t.includes('ribbed') || t.includes('textured') || t.includes('waffle') || p.includes('textured');
  });

  // HARD PENALTY: Multiple patterned items competing
  if (patternedItems.length >= 2) {
    score -= 35; // Severe clash
  }

  // HARD PENALTY: Conflicting pattern + heavy texture in same color family (e.g. Green Textured + Dark Green Striped)
  if (patternedItems.length >= 1 && texturedItems.length >= 1) {
    const patColor = normalizeColor(patternedItems[0].primaryColor || patternedItems[0].colors?.[0]);
    const texColor = normalizeColor(texturedItems[0].primaryColor || texturedItems[0].colors?.[0]);
    if (patColor === texColor && patColor !== 'black' && patColor !== 'white') {
      score -= 40; // Visually muddy green-on-green textured clash
    }
  }

  // Color harmony rules
  if (nonNeutrals.length === 0) {
    score += 8; // All neutrals
  } else if (nonNeutrals.length === 1) {
    score += 10; // Pop of color with neutrals
  } else if (nonNeutrals.length === 2) {
    const [c1, c2] = nonNeutrals;
    if (
      (c1 === 'green' && c2 === 'brown') || (c1 === 'brown' && c2 === 'green') ||
      (c1 === 'burgundy' && c2 === 'navy') || (c1 === 'navy' && c2 === 'burgundy') ||
      (c1 === 'green' && c2 === 'navy') || (c1 === 'navy' && c2 === 'green')
    ) {
      score += 5;
    } else if (c1 === c2) {
      score += 4; // Monochromatic
    } else {
      score -= 20; // Clashing non-neutrals
    }
  } else {
    score -= 30; // 3+ non-neutrals
  }

  return Math.min(100, Math.max(10, score));
}

// 3. FORMALITY ESTIMATOR (1 - 10)
export function getFormalityScore(item: WardrobeItem): number {
  if (typeof item.formality === 'number' && item.formality >= 1 && item.formality <= 10) {
    return item.formality;
  }
  if (item.formalityScore && item.formalityScore >= 1 && item.formalityScore <= 10) {
    return item.formalityScore;
  }

  const sub = (item.subcategory || '').toLowerCase();
  const form = String(item.formality || '').toLowerCase();

  if (form === 'formal') return 8;
  if (form === 'smart casual') return 6;
  if (form === 'sporty') return 2;

  if (sub.includes('blazer') || sub.includes('suit') || sub.includes('loafers') || sub.includes('tuxedo')) return 9;
  if (sub.includes('trousers') || sub.includes('button-down') || sub.includes('dress')) return 7;
  if (sub.includes('chino') || sub.includes('polo') || sub.includes('overshirt') || sub.includes('cardigan')) return 6;
  if (sub.includes('jeans') || sub.includes('sweater') || sub.includes('sweatshirt')) return 5;
  if (sub.includes('t-shirt') || sub.includes('tee') || sub.includes('sneakers') || sub.includes('shorts')) return 3;
  if (sub.includes('tank') || sub.includes('joggers') || sub.includes('sweatpants') || sub.includes('slides')) return 2;

  return 4;
}

// 4. STYLE COHERENCE & FORMALITY CONSISTENCY (0 - 100)
export function calculateStyleAndFormality(
  items: WardrobeItem[],
  targetStyle: string,
  _targetOccasion: string
): { styleScore: number; formalityScore: number } {
  if (items.length === 0) return { styleScore: 80, formalityScore: 80 };

  const formalityValues = items.map(getFormalityScore);
  const minForm = Math.min(...formalityValues);
  const maxForm = Math.max(...formalityValues);
  const diff = maxForm - minForm;

  let formalityScore = 95 - diff * 15;
  formalityScore = Math.min(100, Math.max(10, formalityScore));

  let styleScore = 80;
  const target = targetStyle.toLowerCase();

  items.forEach((item) => {
    const itemStyle = (item.style || '').toLowerCase();
    if (itemStyle.includes(target) || target.includes(itemStyle)) {
      styleScore += 6;
    }
  });

  styleScore = Math.min(100, Math.max(30, styleScore));

  return { styleScore, formalityScore };
}

// 5. WEATHER SUITABILITY CALCULATOR (0 - 100)
export function calculateWeatherSuitability(items: WardrobeItem[], weather?: Partial<WeatherData>): number {
  if (!weather || typeof weather.temp !== 'number') return 88;

  let tempF = weather.temp;
  if (tempF < 45 && tempF > 0 && weather.temp < 35) {
    tempF = Math.round(tempF * 1.8 + 32);
  }

  let score = 90;

  const topItems = items.filter((i) => i.category === 'top' || i.category === 'outerwear');
  const hasOuterwear = items.some((i) => i.category === 'outerwear' || (i.layeringWeight && i.layeringWeight !== 'light'));
  const hasHeavyOuterwear = items.some(
    (i) => (i.category === 'outerwear' && i.layeringWeight === 'heavy') || (i.subcategory || '').toLowerCase().includes('puffer') || (i.subcategory || '').toLowerCase().includes('heavy coat')
  );
  const hasShorts = items.some((i) => (i.subcategory || '').toLowerCase().includes('shorts'));

  if (tempF >= 80) {
    if (hasHeavyOuterwear) score -= 55;
    else if (hasOuterwear) score -= 35;
    if (topItems.length >= 2) score -= 30;
    if (hasShorts) score += 5;
  } else if (tempF >= 72) {
    if (hasHeavyOuterwear) score -= 35;
    if (topItems.length >= 2) score -= 15;
  } else if (tempF >= 50 && tempF < 60) {
    // 50°F - 59°F (e.g. 54°F)
    // Both single top (hoodie/sweater/tee) and layered tops are valid!
    if (topItems.length >= 2) score += 5;
    if (hasShorts) score -= 20; // Mild quality penalty, NOT a hard fail
  } else if (tempF < 50) {
    if (!hasOuterwear && topItems.length === 1) score -= 20; // Mild quality penalty for single tee in cold
    if (hasShorts) score -= 35;
  }

  return Math.min(100, Math.max(20, score));
}

// 6. OCCASION SUITABILITY CALCULATOR (0 - 100)
export function calculateOccasionSuitability(items: WardrobeItem[], occasion: string): number {
  const occ = occasion.toLowerCase();
  let targetFormalityRange = [3, 6];

  if (occ.includes('university') || occ.includes('school') || occ.includes('casual')) {
    targetFormalityRange = [2, 6];
  } else if (occ.includes('date') || occ.includes('dinner')) {
    targetFormalityRange = [5, 8];
  } else if (occ.includes('wedding') || occ.includes('formal') || occ.includes('gala')) {
    targetFormalityRange = [7, 10];
  } else if (occ.includes('gym') || occ.includes('workout') || occ.includes('sport')) {
    targetFormalityRange = [1, 4];
  } else if (occ.includes('party') || occ.includes('night out') || occ.includes('club')) {
    targetFormalityRange = [4, 8];
  }

  let totalPenalty = 0;
  items.forEach((item) => {
    const form = getFormalityScore(item);
    if (form < targetFormalityRange[0]) {
      totalPenalty += (targetFormalityRange[0] - form) * 10;
    } else if (form > targetFormalityRange[1]) {
      totalPenalty += (form - targetFormalityRange[1]) * 8;
    }
  });

  return Math.min(100, Math.max(20, 95 - totalPenalty));
}

// 7. HARD FILTERING RULES (HARD FAIL CHECK ONLY FOR FUNDAMENTAL IMPOSSIBILITIES)
export function checkHardRules(
  items: WardrobeItem[],
  weather: Partial<WeatherData> | undefined,
  occasion: string | undefined,
  structureDecision: StructureDecision
): { valid: boolean; reason?: string } {
  const mainItems = items.filter((i) => i.category !== 'accessory');
  if (mainItems.length < 2) {
    return { valid: false, reason: 'An outfit requires at least a top and bottom.' };
  }

  const bottoms = items.filter((i) => i.category === 'bottom');
  const shoes = items.filter((i) => i.category === 'shoes');
  const tops = items.filter((i) => i.category === 'top' || i.category === 'outerwear');

  if (bottoms.length > 1) {
    return { valid: false, reason: 'Cannot wear 2 pairs of bottoms at once.' };
  }
  if (shoes.length > 1) {
    return { valid: false, reason: 'Cannot wear 2 pairs of shoes at once.' };
  }
  if (tops.length === 0) {
    return { valid: false, reason: 'An outfit requires at least one top.' };
  }

  // HARD FAIL: Extreme weather layering violation (2+ tops in 80°F+ heat)
  if (!structureDecision.allowLayering && tops.length > 1 && weather && typeof weather.temp === 'number' && weather.temp >= 80) {
    return { valid: false, reason: `Weather (${weather.temp}°F) prohibits layered 2-top outfits.` };
  }

  // HARD FAIL: Temperature extremes
  if (weather && typeof weather.temp === 'number') {
    let tempF = weather.temp;
    if (tempF < 45 && tempF > 0 && weather.temp < 35) tempF = Math.round(tempF * 1.8 + 32);

    const hasHeavyOuterwear = items.some(
      (i) => i.category === 'outerwear' && (i.layeringWeight === 'heavy' || (i.subcategory || '').toLowerCase().includes('puffer') || (i.subcategory || '').toLowerCase().includes('heavy coat'))
    );
    if (tempF >= 80 && hasHeavyOuterwear) {
      return { valid: false, reason: 'Heavy wool coats or parkas are strictly invalid in 80°F+ heat.' };
    }

    const hasShorts = items.some((i) => (i.subcategory || '').toLowerCase().includes('shorts'));
    if (tempF <= 40 && hasShorts) {
      return { valid: false, reason: 'Shorts are invalid in freezing weather (<40°F).' };
    }
  }

  // HARD FAIL: Inappropriate footwear for formal events
  if (occasion) {
    const occ = occasion.toLowerCase();
    const hasGymShoes = items.some(
      (i) => i.category === 'shoes' && ((i.subcategory || '').toLowerCase().includes('slides') || (i.subcategory || '').toLowerCase().includes('flip flop'))
    );
    if ((occ.includes('wedding') || occ.includes('formal') || occ.includes('gala')) && hasGymShoes) {
      return { valid: false, reason: 'Slides or flip flops are strictly invalid for formal occasions.' };
    }
  }

  // HARD FAIL: Multiple loud patterned pieces competing
  const patterned = mainItems.filter((i) => {
    const p = (i.pattern || '').toLowerCase();
    return p.includes('striped') || p.includes('plaid') || p.includes('check') || p.includes('graphic');
  });
  if (patterned.length >= 2) {
    return { valid: false, reason: 'Multiple loud patterned pieces create unwearable visual noise.' };
  }

  return { valid: true };
}

// 8. GENERATE CANDIDATES FOLLOWING THE STYLIST STRUCTURE DECISION
export function generateCandidateOutfits(
  wardrobe: WardrobeItem[],
  structureDecision: StructureDecision,
  maxCandidates = 32
): Array<{ items: WardrobeItem[]; isLayered: boolean }> {
  const tops = wardrobe.filter((i) => i.category === 'top');
  const outerwears = wardrobe.filter((i) => i.category === 'outerwear');
  const bottoms = wardrobe.filter((i) => i.category === 'bottom');
  const shoes = wardrobe.filter((i) => i.category === 'shoes');
  const accessories = wardrobe.filter((i) => i.category === 'accessory');

  const combinations: Array<{ items: WardrobeItem[]; isLayered: boolean }> = [];

  // Single top candidates (1 Top + 1 Bottom + 1 Shoes)
  for (const t of tops) {
    for (const b of bottoms) {
      for (const s of shoes) {
        const combo = [t, b, s];
        if (accessories.length > 0 && Math.random() > 0.8) {
          combo.push(accessories[0]);
        }
        combinations.push({ items: combo, isLayered: false });
      }
    }
  }

  // Outerwear single top candidates if any
  for (const o of outerwears) {
    for (const b of bottoms) {
      for (const s of shoes) {
        combinations.push({ items: [o, b, s], isLayered: false });
      }
    }
  }

  // 2-Tops Layered candidates ONLY IF structureDecision allows layering!
  if (structureDecision.allowLayering) {
    const layerableOuterTops = [...outerwears, ...tops];
    for (const innerTop of tops) {
      for (const outerTop of layerableOuterTops) {
        if (innerTop.id === outerTop.id) continue;
        for (const b of bottoms) {
          for (const s of shoes) {
            const combo = [innerTop, outerTop, b, s];
            if (accessories.length > 0 && Math.random() > 0.8) {
              combo.push(accessories[0]);
            }
            combinations.push({ items: combo, isLayered: true });
          }
        }
      }
    }
  }

  // Fallback for limited wardrobes
  if (combinations.length === 0 && wardrobe.length >= 2) {
    combinations.push({ items: wardrobe.slice(0, 3), isLayered: false });
  }

  return combinations.slice(0, maxCandidates);
}

// 9. DETERMINISTIC CANDIDATE SCORING
export function scoreCandidates(
  candidates: Array<{ items: WardrobeItem[]; isLayered: boolean }>,
  targetStyle: string,
  occasion: string,
  weather?: Partial<WeatherData>,
  structureDecision: StructureDecision = { allowLayering: true, layeringMode: 'light_outer', reasoning: '' },
  excludedCombosSet: Set<string> = new Set()
): { scoredCandidates: CandidateOutfit[]; rejectedCandidates: Array<{ itemIds: string[]; reason: string }> } {
  const scoredCandidates: CandidateOutfit[] = [];
  const rejectedCandidates: Array<{ itemIds: string[]; reason: string }> = [];

  candidates.forEach((cand, idx) => {
    const itemIds = cand.items.map((i) => i.id);
    const comboKey = itemIds.slice().sort().join(',');

    // Exclude previously recommended exact combination if requested
    if (excludedCombosSet.has(comboKey)) {
      rejectedCandidates.push({ itemIds, reason: 'Previously generated outfit.' });
      return;
    }

    // Hard Rules Check
    const ruleCheck = checkHardRules(cand.items, weather, occasion, structureDecision);
    if (!ruleCheck.valid) {
      rejectedCandidates.push({ itemIds, reason: ruleCheck.reason || 'Hard filter violation' });
      return;
    }

    // Separate core items from optional accessories
    const coreItems = cand.items.filter((i) => i.category !== 'accessory');
    const accessoryItems = cand.items.filter((i) => i.category === 'accessory');

    // Calculate core scores
    const colorHarmony = calculateColorHarmony(coreItems);
    const { styleScore: styleCoherence, formalityScore: formalityConsistency } = calculateStyleAndFormality(
      coreItems,
      targetStyle,
      occasion
    );
    const weatherSuitability = calculateWeatherSuitability(coreItems, weather);
    const occasionSuitability = calculateOccasionSuitability(coreItems, occasion);

    let novelty = 90;

    // Calculate Core Outfit Score
    const coreScore = Math.round(
      colorHarmony * RECOMMENDATION_WEIGHTS.colorHarmony +
      styleCoherence * RECOMMENDATION_WEIGHTS.styleCoherence +
      weatherSuitability * RECOMMENDATION_WEIGHTS.weatherSuitability +
      occasionSuitability * RECOMMENDATION_WEIGHTS.occasionSuitability +
      formalityConsistency * RECOMMENDATION_WEIGHTS.formalityConsistency +
      novelty * RECOMMENDATION_WEIGHTS.novelty
    );

    // WEARABILITY FLOOR: Only reject if overall core score < 50
    if (coreScore < 50) {
      rejectedCandidates.push({ itemIds, reason: `Low core outfit quality score (${coreScore}/100).` });
      return;
    }

    let accessoryBonus = accessoryItems.length > 0 ? 2 : 0;
    const overallScore = Math.min(100, Math.max(50, coreScore + accessoryBonus));

    const titleParts = coreItems.map((i) => i.name).slice(0, 2).join(' & ');
    const reasoning = `Cohesive pairing of ${titleParts} tailored for ${occasion} in ${weather?.temp || 75}° weather.`;

    scoredCandidates.push({
      id: `cand_${idx}_${Date.now()}`,
      itemIds,
      style: targetStyle,
      reasoning,
      confidence: Math.round(overallScore) / 100,
      colorHarmony,
      styleCoherence,
      weatherSuitability,
      occasionSuitability,
      formalityConsistency,
      novelty,
      overallScore,
    });
  });

  scoredCandidates.sort((a, b) => b.overallScore - a.overallScore);

  return { scoredCandidates, rejectedCandidates };
}
