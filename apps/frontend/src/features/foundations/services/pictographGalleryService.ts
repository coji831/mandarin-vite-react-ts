/**
 * @file services/pictographGalleryService.ts
 * @description Pictograph gallery data and mini-game question generation
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game)
 *
 * This service provides hardcoded pictograph data and question generation
 * for the Pictograph Match mini-game. It is a standalone client-side
 * exception to the quiz strategy pattern — no API calls, no backend.
 */

export interface PictographData {
  glyph: string;
  meaning: string;
  etymology: string;
}

export interface MatchQuestion {
  oracleBoneDescription: string;
  correctAnswer: string;
  options: string[];
}

export const PICTOGRAPH_SET: PictographData[] = [
  {
    glyph: "日",
    meaning: "sun",
    etymology:
      "Depicts the sun as a circle with a dot in the center; evolved into the modern square form.",
  },
  {
    glyph: "月",
    meaning: "moon",
    etymology: "Depicts a crescent moon; the curved shape represents the moon's phase.",
  },
  {
    glyph: "山",
    meaning: "mountain",
    etymology: "Depicts three peaks of a mountain range; the central peak is tallest.",
  },
  {
    glyph: "水",
    meaning: "water",
    etymology: "Depicts flowing water with ripples and splashes; represents a river or stream.",
  },
  {
    glyph: "火",
    meaning: "fire",
    etymology:
      "Depicts flames rising upward from a fire; the shape represents flickering tongues of fire.",
  },
  {
    glyph: "木",
    meaning: "tree/wood",
    etymology: "Depicts a tree with a trunk, branches above, and roots below.",
  },
  {
    glyph: "田",
    meaning: "field",
    etymology: "Depicts a field divided into plots; the grid pattern represents cultivated land.",
  },
  {
    glyph: "口",
    meaning: "mouth",
    etymology: "Depicts an open mouth; the square shape represents the oral cavity.",
  },
  {
    glyph: "目",
    meaning: "eye",
    etymology: "Depicts an eye; the original form was horizontal, later rotated to vertical.",
  },
  {
    glyph: "耳",
    meaning: "ear",
    etymology: "Depicts a human ear with its distinctive outer shape.",
  },
  {
    glyph: "手",
    meaning: "hand",
    etymology: "Depicts a hand with fingers extending upward from the palm.",
  },
  {
    glyph: "足",
    meaning: "foot",
    etymology: "Depicts a foot with toes; the upper part represents the leg above the ankle.",
  },
  {
    glyph: "人",
    meaning: "person",
    etymology: "Depicts a person standing in profile, with arms and legs visible.",
  },
  {
    glyph: "大",
    meaning: "big",
    etymology: "Depicts a person standing with arms outstretched, indicating 'big' or 'great'.",
  },
  {
    glyph: "女",
    meaning: "woman",
    etymology: "Depicts a woman with arms crossed or folded, in a kneeling or seated posture.",
  },
  {
    glyph: "子",
    meaning: "child",
    etymology: "Depicts a swaddled infant with arms sticking out; represents a child or baby.",
  },
  {
    glyph: "鸟",
    meaning: "bird",
    etymology: "Depicts a bird in profile with beak, wings, and tail feathers clearly visible.",
  },
  {
    glyph: "鱼",
    meaning: "fish",
    etymology:
      "Depicts a fish with head, scales, fins, and tail; one of the most pictographically accurate characters.",
  },
  {
    glyph: "马",
    meaning: "horse",
    etymology: "Depicts a horse in profile, showing the mane, legs, and flowing tail.",
  },
  {
    glyph: "牛",
    meaning: "cow",
    etymology: "Depicts the front view of a cow's head with distinctive horns curving upward.",
  },
];

/** Shuffle an array using Fisher-Yates algorithm */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a set of match questions for the pictograph mini-game.
 *
 * @param count - Number of questions to generate (default 10)
 * @returns Array of MatchQuestion objects
 */
export function generateMatchQuestions(count: number = 10): MatchQuestion[] {
  const shuffled = shuffle(PICTOGRAPH_SET);
  const selected = shuffled.slice(0, Math.min(count, PICTOGRAPH_SET.length));

  return selected.map((pictograph) => {
    // Pick 3 distractors from the remaining pictographs (excluding the correct one)
    const distractors = PICTOGRAPH_SET.filter((p) => p.glyph !== pictograph.glyph)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.glyph);

    const options = shuffle([pictograph.glyph, ...distractors]);

    return {
      oracleBoneDescription: `In ancient oracle bone script, this character ${pictograph.etymology}`,
      correctAnswer: pictograph.glyph,
      options,
    };
  });
}
