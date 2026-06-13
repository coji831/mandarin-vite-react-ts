/**
 * Pinyin Tone Conversion Map
 *
 * Converts numeric pinyin notation to tone marks (e.g., ma3 → mǎ, ban1 → bān)
 *
 * Tone mark placement follows standard pinyin rules:
 * - Priority: a > o > e > i/u (tone mark goes on the highest priority vowel)
 * - Multi-vowel combinations are processed before single vowels
 * - Nasal finals (an, en, in, un, ang, eng, ing, ong) are processed as units
 *
 * Used by: ToneInput component (Story 15.5)
 */

export const toneMap: Record<string, string> = {
  // Multi-vowel combinations (must be processed first)
  ao1: "āo",
  ao2: "áo",
  ao3: "ǎo",
  ao4: "ào",
  ou1: "ōu",
  ou2: "óu",
  ou3: "ǒu",
  ou4: "òu",
  ai1: "āi",
  ai2: "ái",
  ai3: "ǎi",
  ai4: "ài",
  ei1: "ēi",
  ei2: "éi",
  ei3: "ěi",
  ei4: "èi",
  ui1: "uī",
  ui2: "uí",
  ui3: "uǐ",
  ui4: "uì",
  iu1: "iū",
  iu2: "iú",
  iu3: "iǔ",
  iu4: "iù",
  // Nasal finals (an, en, in, un, ang, eng, ing, ong)
  ang1: "āng",
  ang2: "áng",
  ang3: "ǎng",
  ang4: "àng",
  eng1: "ēng",
  eng2: "éng",
  eng3: "ěng",
  eng4: "èng",
  ing1: "īng",
  ing2: "íng",
  ing3: "ǐng",
  ing4: "ìng",
  ong1: "ōng",
  ong2: "óng",
  ong3: "ǒng",
  ong4: "òng",
  an1: "ān",
  an2: "án",
  an3: "ǎn",
  an4: "àn",
  en1: "ēn",
  en2: "én",
  en3: "ěn",
  en4: "èn",
  in1: "īn",
  in2: "ín",
  in3: "ǐn",
  in4: "ìn",
  un1: "ūn",
  un2: "ún",
  un3: "ǔn",
  un4: "ùn",
  // Single vowels
  a1: "ā",
  a2: "á",
  a3: "ǎ",
  a4: "à",
  o1: "ō",
  o2: "ó",
  o3: "ǒ",
  o4: "ò",
  e1: "ē",
  e2: "é",
  e3: "ě",
  e4: "è",
  i1: "ī",
  i2: "í",
  i3: "ǐ",
  i4: "ì",
  u1: "ū",
  u2: "ú",
  u3: "ǔ",
  u4: "ù",
  ü1: "ǖ",
  ü2: "ǘ",
  ü3: "ǚ",
  ü4: "ǜ",
};

/**
 * Pre-sorted tone map keys (by length, longest first)
 * Used for efficient pattern matching without runtime sorting
 */
export const toneMapKeys = Object.keys(toneMap).sort((a, b) => b.length - a.length);
