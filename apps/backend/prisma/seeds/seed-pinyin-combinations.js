/**
 * @file apps/backend/prisma/seeds/seed-pinyin-combinations.js
 * @description Seed pinyin combinations into PinyinCombination using a
 *   programmatic generator driven by a validity map of real initial+final
 *   pairs (tone 1 preferred; fallback tone noted per entry).
 */

// ── Pinyin phoneme definitions ──────────────────────────────────────────────

const INITIALS = [
  "b",
  "p",
  "m",
  "f",
  "d",
  "t",
  "n",
  "l",
  "g",
  "k",
  "h",
  "j",
  "q",
  "x",
  "zh",
  "ch",
  "sh",
  "r",
  "z",
  "c",
  "s",
];

const FINALS = [
  { id: "fin_a", pinyin: "a", examples: { 1: "ā", 2: "á", 3: "ǎ", 4: "à", 0: "a" } },
  { id: "fin_o", pinyin: "o", examples: { 1: "ō", 2: "ó", 3: "ǒ", 4: "ò", 0: "o" } },
  { id: "fin_e", pinyin: "e", examples: { 1: "ē", 2: "é", 3: "ě", 4: "è", 0: "e" } },
  { id: "fin_i", pinyin: "i", examples: { 1: "ī", 2: "í", 3: "ǐ", 4: "ì", 0: "i" } },
  { id: "fin_u", pinyin: "u", examples: { 1: "ū", 2: "ú", 3: "ǔ", 4: "ù", 0: "u" } },
  { id: "fin_v", pinyin: "ü", examples: { 1: "ǖ", 2: "ǘ", 3: "ǚ", 4: "ǜ", 0: "ü" } },
  { id: "fin_ai", pinyin: "ai", examples: { 1: "āi", 2: "ái", 3: "ǎi", 4: "ài", 0: "ai" } },
  { id: "fin_ei", pinyin: "ei", examples: { 1: "ēi", 2: "éi", 3: "ěi", 4: "èi", 0: "ei" } },
  { id: "fin_ao", pinyin: "ao", examples: { 1: "āo", 2: "áo", 3: "ǎo", 4: "ào", 0: "ao" } },
  { id: "fin_ou", pinyin: "ou", examples: { 1: "ōu", 2: "óu", 3: "ǒu", 4: "òu", 0: "ou" } },
  { id: "fin_an", pinyin: "an", examples: { 1: "ān", 2: "án", 3: "ǎn", 4: "àn", 0: "an" } },
  { id: "fin_en", pinyin: "en", examples: { 1: "ēn", 2: "én", 3: "ěn", 4: "èn", 0: "en" } },
  { id: "fin_ang", pinyin: "ang", examples: { 1: "āng", 2: "áng", 3: "ǎng", 4: "àng", 0: "ang" } },
  { id: "fin_eng", pinyin: "eng", examples: { 1: "ēng", 2: "éng", 3: "ěng", 4: "èng", 0: "eng" } },
  { id: "fin_ing", pinyin: "ing", examples: { 1: "īng", 2: "íng", 3: "ǐng", 4: "ìng", 0: "ing" } },
  { id: "fin_ia", pinyin: "ia", examples: { 1: "iā", 2: "iá", 3: "iǎ", 4: "ià", 0: "ia" } },
  { id: "fin_ie", pinyin: "ie", examples: { 1: "iē", 2: "ié", 3: "iě", 4: "iè", 0: "ie" } },
  { id: "fin_iu", pinyin: "iu", examples: { 1: "iū", 2: "iú", 3: "iǔ", 4: "iù", 0: "iu" } },
  { id: "fin_in", pinyin: "in", examples: { 1: "īn", 2: "ín", 3: "ǐn", 4: "ìn", 0: "in" } },
  { id: "fin_ian", pinyin: "ian", examples: { 1: "iān", 2: "ián", 3: "iǎn", 4: "iàn", 0: "ian" } },
  {
    id: "fin_iang",
    pinyin: "iang",
    examples: { 1: "iāng", 2: "iáng", 3: "iǎng", 4: "iàng", 0: "iang" },
  },
  {
    id: "fin_iong",
    pinyin: "iong",
    examples: { 1: "iōng", 2: "ióng", 3: "iǒng", 4: "iòng", 0: "iong" },
  },
  { id: "fin_ua", pinyin: "ua", examples: { 1: "uā", 2: "uá", 3: "uǎ", 4: "uà", 0: "ua" } },
  { id: "fin_uo", pinyin: "uo", examples: { 1: "uō", 2: "uó", 3: "uǒ", 4: "uò", 0: "uo" } },
  { id: "fin_uai", pinyin: "uai", examples: { 1: "uāi", 2: "uái", 3: "uǎi", 4: "uài", 0: "uai" } },
  { id: "fin_ui", pinyin: "ui", examples: { 1: "uī", 2: "uí", 3: "uǐ", 4: "uì", 0: "ui" } },
  { id: "fin_un", pinyin: "un", examples: { 1: "ūn", 2: "ún", 3: "ǔn", 4: "ùn", 0: "un" } },
  { id: "fin_uan", pinyin: "uan", examples: { 1: "uān", 2: "uán", 3: "uǎn", 4: "uàn", 0: "uan" } },
  {
    id: "fin_uang",
    pinyin: "uang",
    examples: { 1: "uāng", 2: "uáng", 3: "uǎng", 4: "uàng", 0: "uang" },
  },
  { id: "fin_ve", pinyin: "üe", examples: { 1: "üē", 2: "üé", 3: "üě", 4: "üè", 0: "üe" } },
];

// ── Validity map ───────────────────────────────────────────────────────────
// Key:  "{initial}_{final}"  (final key is the part after "fin_")
// Value:  { char, meaning, tone? }
// tone defaults to 1.  Only set when a combo is rare in tone 1.

const VALID_COMBOS = {
  // ═════════════════════════════════════════════════════════════════════════
  // b (10)
  // ═════════════════════════════════════════════════════════════════════════
  b_a: { char: "八", meaning: "eight" },
  b_ai: { char: "掰", meaning: "break off" },
  b_an: { char: "班", meaning: "class" },
  b_ao: { char: "包", meaning: "bag" },
  b_ei: { char: "杯", meaning: "cup" },
  b_i: { char: "逼", meaning: "force" },
  b_ian: { char: "边", meaning: "side" },
  b_ie: { char: "憋", meaning: "suppress" },
  b_ing: { char: "冰", meaning: "ice" },
  b_u: { char: "逋", meaning: "flee" },

  // ═════════════════════════════════════════════════════════════════════════
  // p (10)
  // ═════════════════════════════════════════════════════════════════════════
  p_a: { char: "趴", meaning: "lie prone" },
  p_ai: { char: "拍", meaning: "clap" },
  p_an: { char: "攀", meaning: "climb" },
  p_ao: { char: "抛", meaning: "throw" },
  p_ei: { char: "胚", meaning: "embryo" },
  p_i: { char: "批", meaning: "criticize" },
  p_ian: { char: "偏", meaning: "slant" },
  p_ie: { char: "瞥", meaning: "glance" },
  p_in: { char: "拼", meaning: "spell" },
  p_u: { char: "扑", meaning: "pounce" },

  // ═════════════════════════════════════════════════════════════════════════
  // m (10)
  // ═════════════════════════════════════════════════════════════════════════
  m_a: { char: "妈", meaning: "mother" },
  m_ai: { char: "埋", meaning: "bury", tone: 2 },
  m_an: { char: "瞒", meaning: "conceal", tone: 2 },
  m_ao: { char: "猫", meaning: "cat" },
  m_e: { char: "么", meaning: "what" },
  m_ei: { char: "没", meaning: "not have", tone: 2 },
  m_i: { char: "咪", meaning: "meow" },
  m_ian: { char: "棉", meaning: "cotton", tone: 2 },
  m_ie: { char: "咩", meaning: "baa" },
  m_ing: { char: "明", meaning: "bright", tone: 2 },

  // ═════════════════════════════════════════════════════════════════════════
  // f (6)
  // ═════════════════════════════════════════════════════════════════════════
  f_a: { char: "发", meaning: "send" },
  f_an: { char: "翻", meaning: "flip" },
  f_ang: { char: "方", meaning: "square" },
  f_ei: { char: "飞", meaning: "fly" },
  f_en: { char: "分", meaning: "divide" },
  f_u: { char: "夫", meaning: "husband" },

  // ═════════════════════════════════════════════════════════════════════════
  // d (11)
  // ═════════════════════════════════════════════════════════════════════════
  d_a: { char: "搭", meaning: "build" },
  d_ai: { char: "呆", meaning: "foolish" },
  d_an: { char: "单", meaning: "single" },
  d_ang: { char: "当", meaning: "equal" },
  d_ao: { char: "刀", meaning: "knife" },
  d_e: { char: "德", meaning: "virtue", tone: 2 },
  d_i: { char: "低", meaning: "low" },
  d_ian: { char: "颠", meaning: "summit" },
  d_ie: { char: "爹", meaning: "dad" },
  d_ing: { char: "丁", meaning: "nail" },
  d_u: { char: "督", meaning: "supervise" },

  // ═════════════════════════════════════════════════════════════════════════
  // t (9)
  // ═════════════════════════════════════════════════════════════════════════
  t_a: { char: "他", meaning: "he" },
  t_ai: { char: "胎", meaning: "fetus" },
  t_an: { char: "贪", meaning: "greedy" },
  t_ang: { char: "汤", meaning: "soup" },
  t_ao: { char: "涛", meaning: "wave" },
  t_i: { char: "梯", meaning: "ladder" },
  t_ian: { char: "天", meaning: "sky" },
  t_ie: { char: "贴", meaning: "stick" },
  t_u: { char: "秃", meaning: "bald" },

  // ═════════════════════════════════════════════════════════════════════════
  // n (10)
  // ═════════════════════════════════════════════════════════════════════════
  n_a: { char: "那", meaning: "that", tone: 4 },
  n_ai: { char: "奶", meaning: "milk", tone: 3 },
  n_an: { char: "男", meaning: "male", tone: 2 },
  n_ao: { char: "闹", meaning: "noisy", tone: 4 },
  n_e: { char: "呢", meaning: "particle" },
  n_i: { char: "泥", meaning: "mud", tone: 2 },
  n_ian: { char: "年", meaning: "year", tone: 2 },
  n_ie: { char: "捏", meaning: "pinch" },
  n_u: { char: "奴", meaning: "slave", tone: 2 },
  n_v: { char: "女", meaning: "woman", tone: 3 },

  // ═════════════════════════════════════════════════════════════════════════
  // l (10)
  // ═════════════════════════════════════════════════════════════════════════
  l_a: { char: "拉", meaning: "pull" },
  l_ai: { char: "来", meaning: "come", tone: 2 },
  l_an: { char: "兰", meaning: "orchid", tone: 2 },
  l_ao: { char: "捞", meaning: "drag out" },
  l_e: { char: "乐", meaning: "happy", tone: 4 },
  l_i: { char: "离", meaning: "leave", tone: 2 },
  l_ian: { char: "连", meaning: "connect", tone: 2 },
  l_ie: { char: "咧", meaning: "grin" },
  l_u: { char: "炉", meaning: "stove", tone: 2 },
  l_v: { char: "绿", meaning: "green", tone: 4 },

  // ═════════════════════════════════════════════════════════════════════════
  // g (10)
  // ═════════════════════════════════════════════════════════════════════════
  g_a: { char: "嘎", meaning: "cackle" },
  g_ai: { char: "该", meaning: "should" },
  g_an: { char: "干", meaning: "dry" },
  g_ang: { char: "刚", meaning: "just" },
  g_ao: { char: "高", meaning: "tall" },
  g_e: { char: "歌", meaning: "song" },
  g_ei: { char: "给", meaning: "give", tone: 3 },
  g_ou: { char: "勾", meaning: "hook" },
  g_u: { char: "姑", meaning: "aunt" },
  g_uo: { char: "锅", meaning: "pot" },

  // ═════════════════════════════════════════════════════════════════════════
  // k (9)
  // ═════════════════════════════════════════════════════════════════════════
  k_a: { char: "卡", meaning: "block", tone: 3 },
  k_ai: { char: "开", meaning: "open" },
  k_an: { char: "刊", meaning: "publish" },
  k_ang: { char: "康", meaning: "healthy" },
  k_e: { char: "科", meaning: "science" },
  k_ou: { char: "抠", meaning: "dig" },
  k_u: { char: "哭", meaning: "cry" },
  k_ua: { char: "夸", meaning: "boast" },
  k_uo: { char: "扩", meaning: "expand", tone: 4 },

  // ═════════════════════════════════════════════════════════════════════════
  // h (9)
  // ═════════════════════════════════════════════════════════════════════════
  h_a: { char: "哈", meaning: "laugh" },
  h_ai: { char: "咳", meaning: "sigh" },
  h_an: { char: "酣", meaning: "merry" },
  h_ang: { char: "行", meaning: "okay", tone: 2 },
  h_e: { char: "喝", meaning: "drink" },
  h_ei: { char: "黑", meaning: "black" },
  h_ou: { char: "喉", meaning: "throat", tone: 2 },
  h_u: { char: "呼", meaning: "shout" },
  h_ua: { char: "花", meaning: "flower" },

  // ═════════════════════════════════════════════════════════════════════════
  // j (10 — i/ü series only)
  // ═════════════════════════════════════════════════════════════════════════
  j_i: { char: "鸡", meaning: "chicken" },
  j_ia: { char: "家", meaning: "home" },
  j_ian: { char: "间", meaning: "between" },
  j_iang: { char: "将", meaning: "will" },
  j_ie: { char: "接", meaning: "receive" },
  j_in: { char: "今", meaning: "today" },
  j_ing: { char: "经", meaning: "pass through" },
  j_iu: { char: "揪", meaning: "pull" },
  j_v: { char: "居", meaning: "reside" },
  j_ve: { char: "决", meaning: "decide", tone: 2 },

  // ═════════════════════════════════════════════════════════════════════════
  // q (10 — i/ü series only)
  // ═════════════════════════════════════════════════════════════════════════
  q_i: { char: "七", meaning: "seven" },
  q_ia: { char: "掐", meaning: "pinch" },
  q_ian: { char: "千", meaning: "thousand" },
  q_iang: { char: "枪", meaning: "gun" },
  q_ie: { char: "切", meaning: "cut" },
  q_in: { char: "亲", meaning: "dear" },
  q_ing: { char: "清", meaning: "clear" },
  q_iu: { char: "秋", meaning: "autumn" },
  q_v: { char: "区", meaning: "area" },
  q_ve: { char: "缺", meaning: "lack" },

  // ═════════════════════════════════════════════════════════════════════════
  // x (10 — i/ü series only)
  // ═════════════════════════════════════════════════════════════════════════
  x_i: { char: "西", meaning: "west" },
  x_ia: { char: "虾", meaning: "shrimp" },
  x_ian: { char: "先", meaning: "first" },
  x_iang: { char: "香", meaning: "fragrant" },
  x_ie: { char: "些", meaning: "some" },
  x_in: { char: "新", meaning: "new" },
  x_ing: { char: "星", meaning: "star" },
  x_iu: { char: "修", meaning: "repair" },
  x_v: { char: "需", meaning: "need" },
  x_ve: { char: "雪", meaning: "snow", tone: 3 },

  // ═════════════════════════════════════════════════════════════════════════
  // zh (10)
  // ═════════════════════════════════════════════════════════════════════════
  zh_a: { char: "扎", meaning: "prick" },
  zh_ai: { char: "摘", meaning: "pick" },
  zh_an: { char: "沾", meaning: "touch" },
  zh_ang: { char: "张", meaning: "open" },
  zh_ao: { char: "招", meaning: "beckon" },
  zh_e: { char: "遮", meaning: "cover" },
  zh_i: { char: "知", meaning: "know" },
  zh_ou: { char: "州", meaning: "prefecture" },
  zh_u: { char: "猪", meaning: "pig" },
  zh_uan: { char: "专", meaning: "special" },

  // ═════════════════════════════════════════════════════════════════════════
  // ch (10)
  // ═════════════════════════════════════════════════════════════════════════
  ch_a: { char: "差", meaning: "difference" },
  ch_ai: { char: "拆", meaning: "tear open" },
  ch_an: { char: "掺", meaning: "mix" },
  ch_ang: { char: "昌", meaning: "prosperous" },
  ch_ao: { char: "超", meaning: "exceed" },
  ch_e: { char: "车", meaning: "vehicle" },
  ch_i: { char: "吃", meaning: "eat" },
  ch_ou: { char: "抽", meaning: "pull" },
  ch_u: { char: "出", meaning: "out" },
  ch_uan: { char: "穿", meaning: "wear" },

  // ═════════════════════════════════════════════════════════════════════════
  // sh (10)
  // ═════════════════════════════════════════════════════════════════════════
  sh_a: { char: "沙", meaning: "sand" },
  sh_ai: { char: "筛", meaning: "sieve" },
  sh_an: { char: "山", meaning: "mountain" },
  sh_ang: { char: "伤", meaning: "hurt" },
  sh_ao: { char: "烧", meaning: "burn" },
  sh_e: { char: "奢", meaning: "extravagant" },
  sh_i: { char: "师", meaning: "teacher" },
  sh_ou: { char: "收", meaning: "receive" },
  sh_u: { char: "书", meaning: "book" },
  sh_uan: { char: "拴", meaning: "tie" },

  // ═════════════════════════════════════════════════════════════════════════
  // r (7)
  // ═════════════════════════════════════════════════════════════════════════
  r_an: { char: "然", meaning: "correct", tone: 2 },
  r_ang: { char: "嚷", meaning: "shout" },
  r_ao: { char: "饶", meaning: "forgive", tone: 2 },
  r_e: { char: "热", meaning: "hot", tone: 4 },
  r_en: { char: "人", meaning: "person", tone: 2 },
  r_i: { char: "日", meaning: "sun", tone: 4 },
  r_u: { char: "如", meaning: "like", tone: 2 },

  // ═════════════════════════════════════════════════════════════════════════
  // z (8)
  // ═════════════════════════════════════════════════════════════════════════
  z_a: { char: "扎", meaning: "tie" },
  z_ai: { char: "灾", meaning: "disaster" },
  z_an: { char: "簪", meaning: "hairpin" },
  z_ao: { char: "糟", meaning: "pickle" },
  z_e: { char: "则", meaning: "rule", tone: 2 },
  z_i: { char: "资", meaning: "fund" },
  z_u: { char: "租", meaning: "rent" },
  z_uo: { char: "作", meaning: "do" },

  // ═════════════════════════════════════════════════════════════════════════
  // c (8)
  // ═════════════════════════════════════════════════════════════════════════
  c_a: { char: "擦", meaning: "wipe" },
  c_ai: { char: "猜", meaning: "guess" },
  c_an: { char: "参", meaning: "participate" },
  c_ao: { char: "操", meaning: "drill" },
  c_e: { char: "册", meaning: "volume", tone: 4 },
  c_i: { char: "词", meaning: "word", tone: 2 },
  c_u: { char: "粗", meaning: "thick" },
  c_ui: { char: "催", meaning: "urge" },

  // ═════════════════════════════════════════════════════════════════════════
  // s (8)
  // ═════════════════════════════════════════════════════════════════════════
  s_a: { char: "撒", meaning: "scatter" },
  s_ai: { char: "腮", meaning: "cheek" },
  s_an: { char: "三", meaning: "three" },
  s_ao: { char: "搔", meaning: "scratch" },
  s_e: { char: "色", meaning: "color", tone: 4 },
  s_i: { char: "丝", meaning: "silk" },
  s_u: { char: "苏", meaning: "revive" },
  s_ui: { char: "虽", meaning: "although" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build finals lookup by id. */
const finalsMap = new Map(FINALS.map((f) => [f.id, f]));

/**
 * Build the full accented syllable for an initial + final + tone.
 * Special case: j, q, x drop the ü umlaut (→ u).
 */
function getFullSyllable(initial, finalId, tone) {
  const finalObj = finalsMap.get(finalId);
  if (!finalObj) return "";

  const toned = tone === 0 ? finalObj.pinyin : finalObj.examples[tone];

  // j, q, x + ü/üe → drop umlaut
  if (["j", "q", "x"].includes(initial)) {
    const cleaned = toned
      .replace(/ǖ/g, "ū")
      .replace(/ǘ/g, "ú")
      .replace(/ǚ/g, "ǔ")
      .replace(/ǜ/g, "ù")
      .replace(/ü/g, "u");
    return initial + cleaned;
  }

  return initial + toned;
}

// ── Seed function ──────────────────────────────────────────────────────────

export async function seedPinyinCombinations(prisma) {
  // 1. Clear existing data
  await prisma.pinyinCombination.deleteMany();
  console.log("Cleared existing pinyin combinations");

  // 2. Build entries from the validity map
  const entries = [];

  for (const [key, data] of Object.entries(VALID_COMBOS)) {
    const [initialKey, finalKey] = key.split("_");
    const initialId = `init_${initialKey}`;
    const finalId = `fin_${finalKey}`;
    const tone = data.tone ?? 1;

    if (!finalsMap.has(finalId)) {
      console.warn(`  ⚠ Skipping unknown finalId ${finalId} for key "${key}"`);
      continue;
    }

    const syllable = getFullSyllable(initialKey, finalId, tone);

    entries.push({
      initialId,
      finalId,
      tone,
      syllable,
      character: data.char,
      meaning: data.meaning,
    });
  }

  // 3. Upsert all entries
  let count = 0;
  for (const combo of entries) {
    const id = `${combo.initialId}-${combo.finalId}-${combo.tone}`;
    await prisma.pinyinCombination.upsert({
      where: { id },
      update: {},
      create: { id, ...combo },
    });
    count++;
  }

  console.log(`Seeded ${count} pinyin combinations`);
}
