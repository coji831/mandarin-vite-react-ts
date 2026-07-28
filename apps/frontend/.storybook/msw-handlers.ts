/**
 * MSW handlers for Storybook
 *
 * Covers the API endpoints that stories exercise during render.
 * Only add handlers for endpoints that stories actually hit.
 */
import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3001/api/v1";

/**
 * Pre-built phase-gate response bodies for each phase.
 */
const PHASE_GATE_BODIES = {
  phase1: {
    id: "pg-storybook-1",
    currentPhase: 1,
    phase1Passed: false,
    phase2Passed: false,
    phase3Passed: false,
    phase4Unlocked: false,
    qualificationScore: null,
    placedPhase: null,
    phase1Retention: null,
    phase2Retention: null,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  phase2: {
    id: "pg-storybook-2",
    currentPhase: 2,
    phase1Passed: true,
    phase2Passed: false,
    phase3Passed: false,
    phase4Unlocked: false,
    qualificationScore: 85,
    placedPhase: null,
    phase1Retention: null,
    phase2Retention: null,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  phase3: {
    id: "pg-storybook-3",
    currentPhase: 3,
    phase1Passed: true,
    phase2Passed: true,
    phase3Passed: false,
    phase4Unlocked: false,
    qualificationScore: 90,
    placedPhase: null,
    phase1Retention: 92,
    phase2Retention: 88,
    phase3Retention: null,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  phase4: {
    id: "pg-storybook-4",
    currentPhase: 4,
    phase1Passed: true,
    phase2Passed: true,
    phase3Passed: true,
    phase4Unlocked: true,
    qualificationScore: 95,
    placedPhase: null,
    phase1Retention: 94,
    phase2Retention: 91,
    phase3Retention: 89,
    gateCriteria: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
};

/**
 * Pre-built radical progress response bodies for Storybook.
 * Maps radical IDs to memorized progress records.
 */
const RADICAL_PROGRESS_BODIES = {
  all: [
    {
      id: "rp-rad_0001",
      userId: "storybook-user",
      radicalId: "rad_0001",
      memorized: true,
      recognitionLevel: 5,
      reviewedAt: "2026-07-01T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-07-01T00:00:00Z",
    },
    {
      id: "rp-rad_0002",
      userId: "storybook-user",
      radicalId: "rad_0002",
      memorized: true,
      recognitionLevel: 4,
      reviewedAt: "2026-06-28T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-06-28T00:00:00Z",
    },
    {
      id: "rp-rad_0003",
      userId: "storybook-user",
      radicalId: "rad_0003",
      memorized: true,
      recognitionLevel: 3,
      reviewedAt: "2026-06-25T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-06-25T00:00:00Z",
    },
    {
      id: "rp-rad_0008",
      userId: "storybook-user",
      radicalId: "rad_0008",
      memorized: true,
      recognitionLevel: 4,
      reviewedAt: "2026-07-05T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-07-05T00:00:00Z",
    },
    {
      id: "rp-rad_0009",
      userId: "storybook-user",
      radicalId: "rad_0009",
      memorized: true,
      recognitionLevel: 5,
      reviewedAt: "2026-07-10T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-07-10T00:00:00Z",
    },
    {
      id: "rp-rad_0030",
      userId: "storybook-user",
      radicalId: "rad_0030",
      memorized: false,
      recognitionLevel: 2,
      reviewedAt: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ],
};

export const mswHandlers = {
  auth: [
    // Token refresh — called by AuthProvider on mount
    http.post(`${API_BASE}/auth/refresh`, () => {
      return HttpResponse.json({ data: { accessToken: "storybook-mock-token" } }, { status: 200 });
    }),
    // Get current user — called by AuthProvider after refresh
    http.get(`${API_BASE}/auth/me`, () => {
      return HttpResponse.json(
        {
          data: {
            user: {
              id: "storybook-user",
              email: "user@example.com",
              displayName: "Storybook User",
            },
          },
        },
        { status: 200 },
      );
    }),
  ],
  progression: {
    phaseGate: (phase?: 1 | 2 | 3 | 4) =>
      http.get(`${API_BASE}/progression/phase-gate`, () => {
        // return empty await to simulate loading state
        if (phase === undefined) return new Promise(() => {});
        const key = `phase${phase}` as keyof typeof PHASE_GATE_BODIES;
        return HttpResponse.json(PHASE_GATE_BODIES[key], { status: 200 });
      }),
    radicalProgress: {
      default: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () =>
          HttpResponse.json(RADICAL_PROGRESS_BODIES.all, { status: 200 }),
        ),
      loading: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () => new Promise(() => {})),
      empty: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () =>
          HttpResponse.json([], { status: 200 }),
        ),
      error: () =>
        http.get(`${API_BASE}/progression/radical-progress`, () =>
          HttpResponse.json({ error: "Failed to load radical progress" }, { status: 500 }),
        ),
    },
  },
  radicals: {
    default: () =>
      http.get(`${API_BASE}/radicals`, () =>
        HttpResponse.json([
          {
            id: "rad_0001",
            glyph: "一",
            alternate_glyphs: [],
            name_pinyin: "yī",
            name_chinese: "一",
            meaning: "one",
            stroke_count: 1,
            is_recommended: true,
            kangxi_index: 1,
            metadata: {
              etymology: "Pictograph of a single horizontal stroke representing the number one",
              frequency_rank: 1,
              notes: "The first radical in the Kangxi system. Also a character meaning 'one'.",
              hsk_characters: [
                { glyph: "一", pinyin: "yī", meaning: "one" },
                { glyph: "七", pinyin: "qī", meaning: "seven" },
                { glyph: "三", pinyin: "sān", meaning: "three" },
                { glyph: "上", pinyin: "shàng", meaning: "above/up" },
                { glyph: "下", pinyin: "xià", meaning: "below/down" },
                { glyph: "不", pinyin: "bù", meaning: "not/no" },
                { glyph: "世", pinyin: "shì", meaning: "world/generation" },
                { glyph: "东", pinyin: "dōng", meaning: "east" },
                { glyph: "丝", pinyin: "sī", meaning: "silk" },
                { glyph: "两", pinyin: "liǎng", meaning: "two/both" },
                { glyph: "且", pinyin: "qiě", meaning: "moreover" },
                { glyph: "丘", pinyin: "qiū", meaning: "mound/hill" },
              ],
            },
          },
          {
            id: "rad_0002",
            glyph: "丨",
            alternate_glyphs: [],
            name_pinyin: "gǔn",
            name_chinese: "丨",
            meaning: "line",
            stroke_count: 1,
            is_recommended: true,
            kangxi_index: 2,
            metadata: {
              etymology: "Pictograph of a vertical line or rod",
              frequency_rank: 2,
              notes: "Represents a vertical line. Rarely used alone but common as a component.",
              hsk_characters: [
                { glyph: "中", pinyin: "zhōng", meaning: "middle/center" },
                { glyph: "串", pinyin: "chuàn", meaning: "string/skewer" },
                { glyph: "旧", pinyin: "jiù", meaning: "old/former" },
                { glyph: "北", pinyin: "běi", meaning: "north" },
                { glyph: "卡", pinyin: "kǎ", meaning: "card/block" },
                { glyph: "引", pinyin: "yǐn", meaning: "lead/guide" },
                { glyph: "丰", pinyin: "fēng", meaning: "abundant" },
                { glyph: "半", pinyin: "bàn", meaning: "half" },
                { glyph: "申", pinyin: "shēn", meaning: "state/explain" },
                { glyph: "畅", pinyin: "chàng", meaning: "smooth/unimpeded" },
                { glyph: "肃", pinyin: "sù", meaning: "solemn" },
              ],
            },
          },
          {
            id: "rad_0003",
            glyph: "丶",
            alternate_glyphs: [],
            name_pinyin: "zhǔ",
            name_chinese: "丶",
            meaning: "dot",
            stroke_count: 1,
            is_recommended: true,
            kangxi_index: 3,
            metadata: {
              etymology: "Pictograph of a dot or mark",
              frequency_rank: 3,
              notes: "Represents a simple dot stroke. Found in many characters as a component.",
              hsk_characters: [
                { glyph: "主", pinyin: "zhǔ", meaning: "main/owner" },
                { glyph: "玉", pinyin: "yù", meaning: "jade" },
                { glyph: "丹", pinyin: "dān", meaning: "red/cinnabar" },
                { glyph: "丸", pinyin: "wán", meaning: "pill/ball" },
                { glyph: "为", pinyin: "wèi", meaning: "for/do" },
                { glyph: "丽", pinyin: "lì", meaning: "beautiful" },
                { glyph: "举", pinyin: "jǔ", meaning: "lift/raise" },
                { glyph: "州", pinyin: "zhōu", meaning: "prefecture/state" },
                { glyph: "良", pinyin: "liáng", meaning: "good/fine" },
                { glyph: "求", pinyin: "qiú", meaning: "seek/request" },
                { glyph: "永", pinyin: "yǒng", meaning: "forever" },
              ],
            },
          },
          {
            id: "rad_0008",
            glyph: "氵",
            alternate_glyphs: ["⺡", "氺"],
            name_pinyin: "sāndiǎnshuǐ",
            meaning: "water radical",
            stroke_count: 3,
            is_recommended: true,
            kangxi_index: 8,
            metadata: {
              etymology: "Derived from 水 (shuǐ) — water",
              frequency_rank: 12,
              notes: "One of the most common radicals. Appears on the left side of characters.",
              hsk_characters: [
                { glyph: "水", pinyin: "shuǐ", meaning: "water" },
                { glyph: "江", pinyin: "jiāng", meaning: "river" },
                { glyph: "河", pinyin: "hé", meaning: "river" },
                { glyph: "湖", pinyin: "hú", meaning: "lake" },
                { glyph: "海", pinyin: "hǎi", meaning: "sea/ocean" },
                { glyph: "洗", pinyin: "xǐ", meaning: "wash" },
                { glyph: "活", pinyin: "huó", meaning: "live/alive" },
                { glyph: "法", pinyin: "fǎ", meaning: "law/method" },
                { glyph: "清", pinyin: "qīng", meaning: "clear" },
                { glyph: "汉", pinyin: "hàn", meaning: "Han/Chinese" },
                { glyph: "汁", pinyin: "zhī", meaning: "juice" },
                { glyph: "汗", pinyin: "hàn", meaning: "sweat" },
              ],
            },
          },
          {
            id: "rad_0009",
            glyph: "亻",
            alternate_glyphs: ["人"],
            name_pinyin: "rén",
            name_chinese: "人",
            meaning: "man",
            stroke_count: 2,
            is_recommended: true,
            kangxi_index: 9,
            metadata: {
              etymology:
                "Derived from 人 (rén) — person. The left-side form of the 'person' radical.",
              frequency_rank: 9,
              notes:
                "Common left-side form of the person radical. Appears in characters related to people.",
              hsk_characters: [
                { glyph: "他", pinyin: "tā", meaning: "he/him" },
                { glyph: "们", pinyin: "men", meaning: "plural marker" },
                { glyph: "你", pinyin: "nǐ", meaning: "you" },
                { glyph: "作", pinyin: "zuò", meaning: "make/do" },
                { glyph: "体", pinyin: "tǐ", meaning: "body" },
                { glyph: "住", pinyin: "zhù", meaning: "live/reside" },
                { glyph: "什", pinyin: "shén", meaning: "what" },
                { glyph: "候", pinyin: "hòu", meaning: "wait/period" },
                { glyph: "借", pinyin: "jiè", meaning: "borrow/lend" },
                { glyph: "假", pinyin: "jiǎ", meaning: "false/fake" },
                { glyph: "价", pinyin: "jià", meaning: "price" },
                { glyph: "做", pinyin: "zuò", meaning: "do/make" },
              ],
            },
          },
          {
            id: "rad_0018",
            glyph: "刂",
            alternate_glyphs: ["刀"],
            name_pinyin: "dāo",
            name_chinese: "刀",
            meaning: "knife",
            stroke_count: 2,
            is_recommended: true,
            kangxi_index: 18,
            metadata: {
              etymology:
                "Derived from 刀 (dāo) — knife/sword. The right-side form of the 'knife' radical.",
              frequency_rank: 10,
              notes:
                "Common right-side form. Appears in characters involving cutting or separating.",
              hsk_characters: [
                { glyph: "到", pinyin: "dào", meaning: "arrive" },
                { glyph: "利", pinyin: "lì", meaning: "sharp/benefit" },
                { glyph: "制", pinyin: "zhì", meaning: "control/make" },
                { glyph: "刻", pinyin: "kè", meaning: "carve/moment" },
                { glyph: "划", pinyin: "huá", meaning: "scratch/row" },
                { glyph: "刑", pinyin: "xíng", meaning: "punishment" },
                { glyph: "刚", pinyin: "gāng", meaning: "just/firm" },
                { glyph: "创", pinyin: "chuàng", meaning: "create" },
                { glyph: "别", pinyin: "bié", meaning: "other/separate" },
                { glyph: "判", pinyin: "pàn", meaning: "judge" },
                { glyph: "刺", pinyin: "cì", meaning: "stab" },
                { glyph: "刮", pinyin: "guā", meaning: "scrape" },
              ],
            },
          },
          {
            id: "rad_0019",
            glyph: "力",
            alternate_glyphs: [],
            name_pinyin: "lì",
            name_chinese: "力",
            meaning: "power",
            stroke_count: 2,
            is_recommended: true,
            kangxi_index: 19,
            metadata: {
              etymology: "Pictograph of a muscular arm showing strength",
              frequency_rank: 11,
              notes:
                "Also a standalone character meaning 'strength' or 'power'. Found in characters related to effort.",
              hsk_characters: [
                { glyph: "力", pinyin: "lì", meaning: "power/strength" },
                { glyph: "加", pinyin: "jiā", meaning: "add" },
                { glyph: "助", pinyin: "zhù", meaning: "help" },
                { glyph: "动", pinyin: "dòng", meaning: "move/action" },
                { glyph: "劲", pinyin: "jìn", meaning: "strong/energy" },
                { glyph: "劳", pinyin: "láo", meaning: "labor" },
                { glyph: "男", pinyin: "nán", meaning: "male" },
                { glyph: "勇", pinyin: "yǒng", meaning: "brave" },
                { glyph: "努", pinyin: "nǔ", meaning: "exert/strive" },
                { glyph: "势", pinyin: "shì", meaning: "power/situation" },
                { glyph: "勒", pinyin: "lè", meaning: "restrain" },
                { glyph: "劣", pinyin: "liè", meaning: "inferior" },
              ],
            },
          },
          {
            id: "rad_0025",
            glyph: "白",
            alternate_glyphs: [],
            name_pinyin: "bái",
            meaning: "white",
            stroke_count: 5,
            is_recommended: true,
            kangxi_index: 25,
            metadata: {
              etymology: "Pictograph of a white rice grain",
              frequency_rank: 45,
              is_also_character: true,
              hsk_characters: [
                { glyph: "白", pinyin: "bái", meaning: "white" },
                { glyph: "百", pinyin: "bǎi", meaning: "hundred" },
                { glyph: "的", pinyin: "de", meaning: "possessive particle" },
                { glyph: "皇", pinyin: "huáng", meaning: "emperor" },
                { glyph: "泉", pinyin: "quán", meaning: "spring/fountain" },
                { glyph: "皂", pinyin: "zào", meaning: "soap" },
                { glyph: "皓", pinyin: "hào", meaning: "bright/white" },
                { glyph: "皈", pinyin: "guī", meaning: "convert" },
                { glyph: "帛", pinyin: "bó", meaning: "silk" },
                { glyph: "皆", pinyin: "jiē", meaning: "all/every" },
                { glyph: "碧", pinyin: "bì", meaning: "green jade" },
                { glyph: "魄", pinyin: "pò", meaning: "soul" },
              ],
            },
          },
          {
            id: "rad_0029",
            glyph: "又",
            alternate_glyphs: [],
            name_pinyin: "yòu",
            name_chinese: "又",
            meaning: "again",
            stroke_count: 2,
            is_recommended: true,
            kangxi_index: 29,
            metadata: {
              etymology: "Pictograph of a right hand reaching — extended to mean 'again' or 'also'",
              frequency_rank: 15,
              notes:
                "Also a standalone character meaning 'again'. Found in characters related to hands or repetition.",
              hsk_characters: [
                { glyph: "又", pinyin: "yòu", meaning: "again" },
                { glyph: "友", pinyin: "yǒu", meaning: "friend" },
                { glyph: "取", pinyin: "qǔ", meaning: "take/obtain" },
                { glyph: "受", pinyin: "shòu", meaning: "receive" },
                { glyph: "变", pinyin: "biàn", meaning: "change" },
                { glyph: "双", pinyin: "shuāng", meaning: "pair/double" },
                { glyph: "反", pinyin: "fǎn", meaning: "opposite/reverse" },
                { glyph: "发", pinyin: "fā", meaning: "send/emit" },
                { glyph: "叛", pinyin: "pàn", meaning: "betray" },
                { glyph: "叙", pinyin: "xù", meaning: "narrate" },
                { glyph: "叠", pinyin: "dié", meaning: "stack/fold" },
              ],
            },
          },
          {
            id: "rad_0030",
            glyph: "口",
            alternate_glyphs: [],
            name_pinyin: "kǒu",
            name_chinese: "口",
            meaning: "mouth",
            stroke_count: 3,
            is_recommended: true,
            kangxi_index: 30,
            metadata: {
              etymology: "Pictograph of an open mouth",
              frequency_rank: 4,
              notes:
                "One of the most common radicals. Found in hundreds of characters related to speech, eating, and sound.",
              is_also_character: true,
              hsk_characters: [
                { glyph: "口", pinyin: "kǒu", meaning: "mouth" },
                { glyph: "吃", pinyin: "chī", meaning: "eat" },
                { glyph: "喝", pinyin: "hē", meaning: "drink" },
                { glyph: "唱", pinyin: "chàng", meaning: "sing" },
                { glyph: "吐", pinyin: "tǔ", meaning: "spit/vomit" },
                { glyph: "叫", pinyin: "jiào", meaning: "call/shout" },
                { glyph: "吸", pinyin: "xī", meaning: "inhale" },
                { glyph: "味", pinyin: "wèi", meaning: "taste/flavor" },
                { glyph: "告", pinyin: "gào", meaning: "tell/inform" },
                { glyph: "如", pinyin: "rú", meaning: "like/as" },
                { glyph: "扣", pinyin: "kòu", meaning: "button/deduct" },
                { glyph: "召", pinyin: "zhào", meaning: "summon" },
              ],
            },
          },
        ]),
      ),
    loading: () => http.get(`${API_BASE}/radicals`, () => new Promise(() => {})),
    empty: () => http.get(`${API_BASE}/radicals`, () => HttpResponse.json([])),
    error: () =>
      http.get(`${API_BASE}/radicals`, () =>
        HttpResponse.json({ error: "Failed to load radicals" }, { status: 500 }),
      ),
  },
  mnemonics: {
    /** Returns a sample mnemonic story for a character */
    default: (character = "好") =>
      http.get(`${API_BASE}/v1/mnemonics/${character}`, () =>
        HttpResponse.json({
          id: "mne_storybook_001",
          characterGlyph: character,
          story: `A woman (女) with a child (子) is good — a classic compound ideograph.`,
          radicalIds: ["rad_0025"],
          isEdited: false,
          isPictograph: false,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        }),
      ),
    /** Returns an edited mnemonic story */
    edited: (character = "好") =>
      http.get(`${API_BASE}/v1/mnemonics/${character}`, () =>
        HttpResponse.json({
          id: "mne_storybook_002",
          characterGlyph: character,
          story: `A woman (女) with a child (子) is good — a classic compound ideograph.`,
          radicalIds: ["rad_0025"],
          isEdited: true,
          isPictograph: false,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        }),
      ),
    /** Returns 404 (empty state) */
    empty: (character = "好") =>
      http.get(`${API_BASE}/v1/mnemonics/${character}`, () =>
        HttpResponse.json(null, { status: 404 }),
      ),
    /** Never resolves (loading state) */
    loading: (character = "好") =>
      http.get(`${API_BASE}/v1/mnemonics/${character}`, () => new Promise(() => {})),
    /** Returns 500 error */
    error: (character = "好") =>
      http.get(`${API_BASE}/v1/mnemonics/${character}`, () =>
        HttpResponse.json({ error: "Failed to load mnemonic" }, { status: 500 }),
      ),
    /** Catch-all 404 for any character not explicitly handled */
    notFound: http.get(new RegExp(`^${API_BASE}/v1/mnemonics/.+`), () =>
      HttpResponse.json(null, { status: 404 }),
    ),
    /** POST handler — generates a new mnemonic */
    generate: (character = "好") =>
      http.post(`${API_BASE}/v1/mnemonics/${character}`, () =>
        HttpResponse.json({
          id: "mne_gen_storybook_001",
          characterGlyph: character,
          story: `Generated: A woman (女) and a child (子) together represent goodness.`,
          radicalIds: ["rad_0025"],
          isEdited: false,
          isPictograph: false,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        }),
      ),
    /** POST handler that never resolves (generating state) */
    generating: (character = "好") =>
      http.post(`${API_BASE}/v1/mnemonics/${character}`, () => new Promise(() => {})),
    /** POST handler that returns error */
    generateError: (character = "好") =>
      http.post(`${API_BASE}/v1/mnemonics/${character}`, () =>
        HttpResponse.json({ error: "Generation failed" }, { status: 500 }),
      ),
  },
  characters: {
    /** Returns full character detail for a known glyph */
    default: (glyph: string) =>
      http.get(`${API_BASE}/characters/${glyph}`, () => {
        const body = CHARACTER_DETAIL_BODIES[glyph as keyof typeof CHARACTER_DETAIL_BODIES];
        if (body) return HttpResponse.json(body, { status: 200 });
        // Fallback: return minimal data for unknown glyphs
        return HttpResponse.json(
          {
            data: {
              glyph,
              traditional: glyph,
              strokeCount: 0,
              hskLevel: 0,
              definition: "",
              readings: [],
            },
          },
          { status: 200 },
        );
      }),
    /** Never resolves (loading state) */
    loading: () => http.get(new RegExp(`^${API_BASE}/characters/.+`), () => new Promise(() => {})),
    /** Returns 500 error */
    error: () =>
      http.get(new RegExp(`^${API_BASE}/characters/.+`), () =>
        HttpResponse.json({ error: "Failed to load character detail" }, { status: 500 }),
      ),
    /** Catch-all returns minimal data for any glyph */
    fallback: http.get(new RegExp(`^${API_BASE}/characters/.+`), ({ params }) => {
      const glyph = params[0] as string;
      const body = CHARACTER_DETAIL_BODIES[glyph as keyof typeof CHARACTER_DETAIL_BODIES];
      if (body) return HttpResponse.json(body, { status: 200 });
      return HttpResponse.json(
        {
          data: {
            glyph,
            traditional: glyph,
            strokeCount: 0,
            hskLevel: 0,
            definition: "",
            readings: [],
          },
        },
        { status: 200 },
      );
    }),
  },
  foundations: {
    default: () => [
      http.get(`${API_BASE}/foundations/data/pinyin-tones`, () =>
        HttpResponse.json({
          initials: [
            { id: "b", pinyin: "b", ipa: "p", description: "b as in boy" },
            { id: "p", pinyin: "p", ipa: "pʰ", description: "p as in pay" },
            { id: "m", pinyin: "m", ipa: "m", description: "m as in may" },
            { id: "f", pinyin: "f", ipa: "f", description: "f as in fun" },
            { id: "d", pinyin: "d", ipa: "t", description: "d as in day" },
            { id: "t", pinyin: "t", ipa: "tʰ", description: "t as in take" },
            { id: "n", pinyin: "n", ipa: "n", description: "n as in no" },
            { id: "l", pinyin: "l", ipa: "l", description: "l as in love" },
            { id: "g", pinyin: "g", ipa: "k", description: "g as in go" },
            { id: "k", pinyin: "k", ipa: "kʰ", description: "k as in kind" },
            { id: "h", pinyin: "h", ipa: "x", description: "h as in hello" },
            { id: "j", pinyin: "j", ipa: "tɕ", description: "j as in jeep" },
            { id: "q", pinyin: "q", ipa: "tɕʰ", description: "q as in cheek" },
            { id: "x", pinyin: "x", ipa: "ɕ", description: "x as in she" },
            { id: "zh", pinyin: "zh", ipa: "ʈʂ", description: "zh as in judge" },
            { id: "sh", pinyin: "sh", ipa: "ʂ", description: "sh as in shirt" },
          ],
          finals: [
            { id: "a", pinyin: "a", description: "a as in father", type: "simple" },
            { id: "o", pinyin: "o", description: "o as in go", type: "simple" },
            { id: "e", pinyin: "e", description: "e as in her", type: "simple" },
            { id: "i", pinyin: "i", description: "i as in bee", type: "simple" },
            { id: "u", pinyin: "u", description: "u as in too", type: "simple" },
            { id: "ai", pinyin: "ai", description: "ai as in eye", type: "compound" },
            { id: "ei", pinyin: "ei", description: "ei as in eight", type: "compound" },
            { id: "ao", pinyin: "ao", description: "ao as in now", type: "compound" },
            { id: "ou", pinyin: "ou", description: "ou as in go", type: "compound" },
            { id: "an", pinyin: "an", description: "an as in on", type: "nasal" },
            { id: "en", pinyin: "en", description: "en as in end", type: "nasal" },
            { id: "ang", pinyin: "ang", description: "ang as in song", type: "nasal" },
          ],
          combinations: [
            // b + finals
            { initial: "b", final: "a", tones: ["bā", "bá", "bǎ", "bà", "ba"] },
            { initial: "b", final: "o", tones: ["bō", "bó", "bǒ", "bò", "bo"] },
            { initial: "b", final: "i", tones: ["bī", "bí", "bǐ", "bì", "bi"] },
            { initial: "b", final: "u", tones: ["bū", "bú", "bǔ", "bù", "bu"] },
            { initial: "b", final: "ai", tones: ["bāi", "bái", "bǎi", "bài", "bai"] },
            { initial: "b", final: "ei", tones: ["bēi", "béi", "běi", "bèi", "bei"] },
            { initial: "b", final: "ao", tones: ["bāo", "báo", "bǎo", "bào", "bao"] },
            { initial: "b", final: "an", tones: ["bān", "bán", "bǎn", "bàn", "ban"] },
            { initial: "b", final: "en", tones: ["bēn", "bén", "běn", "bèn", "ben"] },
            { initial: "b", final: "ang", tones: ["bāng", "báng", "bǎng", "bàng", "bang"] },
            { initial: "b", final: "eng", tones: ["bēng", "béng", "běng", "bèng", "beng"] },
            // p + finals
            { initial: "p", final: "a", tones: ["pā", "pá", "pǎ", "pà", "pa"] },
            { initial: "p", final: "o", tones: ["pō", "pó", "pǒ", "pò", "po"] },
            { initial: "p", final: "i", tones: ["pī", "pí", "pǐ", "pì", "pi"] },
            { initial: "p", final: "u", tones: ["pū", "pú", "pǔ", "pù", "pu"] },
            { initial: "p", final: "ai", tones: ["pāi", "pái", "pǎi", "pài", "pai"] },
            { initial: "p", final: "ei", tones: ["pēi", "péi", "pěi", "pèi", "pei"] },
            { initial: "p", final: "ao", tones: ["pāo", "páo", "pǎo", "pào", "pao"] },
            { initial: "p", final: "ou", tones: ["pōu", "póu", "pǒu", "pòu", "pou"] },
            { initial: "p", final: "an", tones: ["pān", "pán", "pǎn", "pàn", "pan"] },
            { initial: "p", final: "en", tones: ["pēn", "pén", "pěn", "pèn", "pen"] },
            { initial: "p", final: "ang", tones: ["pāng", "páng", "pǎng", "pàng", "pang"] },
            { initial: "p", final: "eng", tones: ["pēng", "péng", "pěng", "pèng", "peng"] },
            // m + finals
            { initial: "m", final: "a", tones: ["mā", "má", "mǎ", "mà", "ma"] },
            { initial: "m", final: "o", tones: ["mō", "mó", "mǒ", "mò", "mo"] },
            { initial: "m", final: "e", tones: ["mē", "mé", "mě", "mè", "me"] },
            { initial: "m", final: "i", tones: ["mī", "mí", "mǐ", "mì", "mi"] },
            { initial: "m", final: "u", tones: ["mū", "mú", "mǔ", "mù", "mu"] },
            { initial: "m", final: "ai", tones: ["māi", "mái", "mǎi", "mài", "mai"] },
            { initial: "m", final: "ei", tones: ["mēi", "méi", "měi", "mèi", "mei"] },
            { initial: "m", final: "ao", tones: ["māo", "máo", "mǎo", "mào", "mao"] },
            { initial: "m", final: "ou", tones: ["mōu", "móu", "mǒu", "mòu", "mou"] },
            { initial: "m", final: "an", tones: ["mān", "mán", "mǎn", "màn", "man"] },
            { initial: "m", final: "en", tones: ["mēn", "mén", "měn", "mèn", "men"] },
            { initial: "m", final: "ang", tones: ["māng", "máng", "mǎng", "màng", "mang"] },
            { initial: "m", final: "eng", tones: ["mēng", "méng", "měng", "mèng", "meng"] },
            // f + finals (some gaps — no f+i, no f+u)
            { initial: "f", final: "a", tones: ["fā", "fá", "fǎ", "fà", "fa"] },
            { initial: "f", final: "o", tones: ["fō", "fó", "fǒ", "fò", "fo"] },
            { initial: "f", final: "ei", tones: ["fēi", "féi", "fěi", "fèi", "fei"] },
            { initial: "f", final: "ou", tones: ["fōu", "fóu", "fǒu", "fòu", "fou"] },
            { initial: "f", final: "an", tones: ["fān", "fán", "fǎn", "fàn", "fan"] },
            { initial: "f", final: "en", tones: ["fēn", "fén", "fěn", "fèn", "fen"] },
            { initial: "f", final: "ang", tones: ["fāng", "fáng", "fǎng", "fàng", "fang"] },
            { initial: "f", final: "eng", tones: ["fēng", "féng", "fěng", "fèng", "feng"] },
            // d + finals (some gaps — no d+o, no d+e)
            { initial: "d", final: "a", tones: ["dā", "dá", "dǎ", "dà", "da"] },
            { initial: "d", final: "i", tones: ["dī", "dí", "dǐ", "dì", "di"] },
            { initial: "d", final: "u", tones: ["dū", "dú", "dǔ", "dù", "du"] },
            { initial: "d", final: "ai", tones: ["dāi", "dái", "dǎi", "dài", "dai"] },
            { initial: "d", final: "ei", tones: ["dēi", "déi", "děi", "dèi", "dei"] },
            { initial: "d", final: "ao", tones: ["dāo", "dáo", "dǎo", "dào", "dao"] },
            { initial: "d", final: "ou", tones: ["dōu", "dóu", "dǒu", "dòu", "dou"] },
            { initial: "d", final: "an", tones: ["dān", "dán", "dǎn", "dàn", "dan"] },
            { initial: "d", final: "en", tones: ["dēn", "dén", "děn", "dèn", "den"] },
            { initial: "d", final: "ang", tones: ["dāng", "dáng", "dǎng", "dàng", "dang"] },
            { initial: "d", final: "eng", tones: ["dēng", "déng", "děng", "dèng", "deng"] },
            { initial: "d", final: "ong", tones: ["dōng", "dóng", "dǒng", "dòng", "dong"] },
            // t + finals (gap at t+o, t+e)
            { initial: "t", final: "a", tones: ["tā", "tá", "tǎ", "tà", "ta"] },
            { initial: "t", final: "i", tones: ["tī", "tí", "tǐ", "tì", "ti"] },
            { initial: "t", final: "u", tones: ["tū", "tú", "tǔ", "tù", "tu"] },
            { initial: "t", final: "ai", tones: ["tāi", "tái", "tǎi", "tài", "tai"] },
            { initial: "t", final: "ei", tones: ["tēi", "téi", "těi", "tèi", "tei"] },
            { initial: "t", final: "ao", tones: ["tāo", "táo", "tǎo", "tào", "tao"] },
            { initial: "t", final: "ou", tones: ["tōu", "tóu", "tǒu", "tòu", "tou"] },
            { initial: "t", final: "an", tones: ["tān", "tán", "tǎn", "tàn", "tan"] },
            { initial: "t", final: "ang", tones: ["tāng", "táng", "tǎng", "tàng", "tang"] },
            { initial: "t", final: "eng", tones: ["tēng", "téng", "těng", "tèng", "teng"] },
            { initial: "t", final: "ong", tones: ["tōng", "tóng", "tǒng", "tòng", "tong"] },
            // n + finals (gap at n+o)
            { initial: "n", final: "a", tones: ["nā", "ná", "nǎ", "nà", "na"] },
            { initial: "n", final: "e", tones: ["nē", "né", "ně", "nè", "ne"] },
            { initial: "n", final: "i", tones: ["nī", "ní", "nǐ", "nì", "ni"] },
            { initial: "n", final: "u", tones: ["nū", "nú", "nǔ", "nù", "nu"] },
            { initial: "n", final: "ü", tones: ["nǖ", "nǘ", "nǚ", "nǜ", "nü"] },
            { initial: "n", final: "ai", tones: ["nāi", "nái", "nǎi", "nài", "nai"] },
            { initial: "n", final: "ei", tones: ["nēi", "néi", "něi", "nèi", "nei"] },
            { initial: "n", final: "ao", tones: ["nāo", "náo", "nǎo", "nào", "nao"] },
            { initial: "n", final: "ou", tones: ["nōu", "nóu", "nǒu", "nòu", "nou"] },
            { initial: "n", final: "an", tones: ["nān", "nán", "nǎn", "nàn", "nan"] },
            { initial: "n", final: "en", tones: ["nēn", "nén", "něn", "nèn", "nen"] },
            { initial: "n", final: "ang", tones: ["nāng", "náng", "nǎng", "nàng", "nang"] },
            { initial: "n", final: "eng", tones: ["nēng", "néng", "něng", "nèng", "neng"] },
            // l + finals
            { initial: "l", final: "a", tones: ["lā", "lá", "lǎ", "là", "la"] },
            { initial: "l", final: "o", tones: ["lō", "ló", "lǒ", "lò", "lo"] },
            { initial: "l", final: "e", tones: ["lē", "lé", "lě", "lè", "le"] },
            { initial: "l", final: "i", tones: ["lī", "lí", "lǐ", "lì", "li"] },
            { initial: "l", final: "u", tones: ["lū", "lú", "lǔ", "lù", "lu"] },
            { initial: "l", final: "ü", tones: ["lǖ", "lǘ", "lǚ", "lǜ", "lü"] },
            { initial: "l", final: "ai", tones: ["lāi", "lái", "lǎi", "lài", "lai"] },
            { initial: "l", final: "ei", tones: ["lēi", "léi", "lěi", "lèi", "lei"] },
            { initial: "l", final: "ao", tones: ["lāo", "láo", "lǎo", "lào", "lao"] },
            { initial: "l", final: "ou", tones: ["lōu", "lóu", "lǒu", "lòu", "lou"] },
            { initial: "l", final: "an", tones: ["lān", "lán", "lǎn", "làn", "lan"] },
            { initial: "l", final: "en", tones: ["lēn", "lén", "lěn", "lèn", "len"] },
            { initial: "l", final: "ang", tones: ["lāng", "láng", "lǎng", "làng", "lang"] },
            { initial: "l", final: "eng", tones: ["lēng", "léng", "lěng", "lèng", "leng"] },
            { initial: "l", final: "ong", tones: ["lōng", "lóng", "lǒng", "lòng", "long"] },
            // g + finals (gaps: no g+i, no g+ü)
            { initial: "g", final: "a", tones: ["gā", "gá", "gǎ", "gà", "ga"] },
            { initial: "g", final: "e", tones: ["gē", "gé", "gě", "gè", "ge"] },
            { initial: "g", final: "u", tones: ["gū", "gú", "gǔ", "gù", "gu"] },
            { initial: "g", final: "ai", tones: ["gāi", "gái", "gǎi", "gài", "gai"] },
            { initial: "g", final: "ei", tones: ["gēi", "géi", "gěi", "gèi", "gei"] },
            { initial: "g", final: "ao", tones: ["gāo", "gáo", "gǎo", "gào", "gao"] },
            { initial: "g", final: "ou", tones: ["gōu", "góu", "gǒu", "gòu", "gou"] },
            { initial: "g", final: "an", tones: ["gān", "gán", "gǎn", "gàn", "gan"] },
            { initial: "g", final: "en", tones: ["gēn", "gén", "gěn", "gèn", "gen"] },
            { initial: "g", final: "ang", tones: ["gāng", "gáng", "gǎng", "gàng", "gang"] },
            { initial: "g", final: "eng", tones: ["gēng", "géng", "gěng", "gèng", "geng"] },
            { initial: "g", final: "ong", tones: ["gōng", "góng", "gǒng", "gòng", "gong"] },
            // k + finals
            { initial: "k", final: "a", tones: ["kā", "ká", "kǎ", "kà", "ka"] },
            { initial: "k", final: "e", tones: ["kē", "ké", "kě", "kè", "ke"] },
            { initial: "k", final: "u", tones: ["kū", "kú", "kǔ", "kù", "ku"] },
            { initial: "k", final: "ai", tones: ["kāi", "kái", "kǎi", "kài", "kai"] },
            { initial: "k", final: "ei", tones: ["kēi", "kéi", "kěi", "kèi", "kei"] },
            { initial: "k", final: "ao", tones: ["kāo", "káo", "kǎo", "kào", "kao"] },
            { initial: "k", final: "ou", tones: ["kōu", "kóu", "kǒu", "kòu", "kou"] },
            { initial: "k", final: "an", tones: ["kān", "kán", "kǎn", "kàn", "kan"] },
            { initial: "k", final: "en", tones: ["kēn", "kén", "kěn", "kèn", "ken"] },
            { initial: "k", final: "ang", tones: ["kāng", "káng", "kǎng", "kàng", "kang"] },
            { initial: "k", final: "eng", tones: ["kēng", "kéng", "kěng", "kèng", "keng"] },
            { initial: "k", final: "ong", tones: ["kōng", "kóng", "kǒng", "kòng", "kong"] },
            // h + finals
            { initial: "h", final: "a", tones: ["hā", "há", "hǎ", "hà", "ha"] },
            { initial: "h", final: "e", tones: ["hē", "hé", "hě", "hè", "he"] },
            { initial: "h", final: "u", tones: ["hū", "hú", "hǔ", "hù", "hu"] },
            { initial: "h", final: "ai", tones: ["hāi", "hái", "hǎi", "hài", "hai"] },
            { initial: "h", final: "ei", tones: ["hēi", "héi", "hěi", "hèi", "hei"] },
            { initial: "h", final: "ao", tones: ["hāo", "háo", "hǎo", "hào", "hao"] },
            { initial: "h", final: "ou", tones: ["hōu", "hóu", "hǒu", "hòu", "hou"] },
            { initial: "h", final: "an", tones: ["hān", "hán", "hǎn", "hàn", "han"] },
            { initial: "h", final: "en", tones: ["hēn", "hén", "hěn", "hèn", "hen"] },
            { initial: "h", final: "ang", tones: ["hāng", "háng", "hǎng", "hàng", "hang"] },
            { initial: "h", final: "eng", tones: ["hēng", "héng", "hěng", "hèng", "heng"] },
            { initial: "h", final: "ong", tones: ["hōng", "hóng", "hǒng", "hòng", "hong"] },
          ],
          toneInfo: [
            {
              number: 1,
              name: "First Tone",
              mark: "ˉ",
              contour: [4, 4.5, 5, 5, 5],
              description: "High level",
              pinyinExample: "mā",
              chineseExample: "妈",
              color: "#FF4444",
            },
            {
              number: 2,
              name: "Second Tone",
              mark: "ˊ",
              contour: [3, 3.5, 4, 4.5, 5],
              description: "Rising",
              pinyinExample: "má",
              chineseExample: "麻",
              color: "#ffaa00",
            },
            {
              number: 3,
              name: "Third Tone",
              mark: "ˇ",
              contour: [2, 1, 0.5, 1.5, 3],
              description: "Dip",
              pinyinExample: "mǎ",
              chineseExample: "马",
              color: "#00aa00",
            },
            {
              number: 4,
              name: "Fourth Tone",
              mark: "ˋ",
              contour: [5, 4, 3, 2, 1],
              description: "Falling",
              pinyinExample: "mà",
              chineseExample: "骂",
              color: "#0066ff",
            },
            {
              number: 0,
              name: "Neutral Tone",
              mark: "",
              contour: [3, 3, 3, 3, 2],
              description: "Light",
              pinyinExample: "ma",
              chineseExample: "吗",
              color: "#888888",
            },
          ],
          tonePairs: [
            {
              id: "tp-1-1",
              chinese: "妈妈",
              dictionaryPinyin: "mā mā",
              spokenPinyin: "mā mā",
              rule: "1+1",
              pattern: "1-1",
            },
            {
              id: "tp-1-2",
              chinese: "麻烦",
              dictionaryPinyin: "má fan",
              spokenPinyin: "má fan",
              rule: "2+0",
              pattern: "2-0",
            },
            {
              id: "tp-3-3",
              chinese: "你好",
              dictionaryPinyin: "nǐ hǎo",
              spokenPinyin: "ní hǎo",
              rule: "3+3 → 2+3",
              pattern: "3-3",
            },
          ],
          toneRules: [
            {
              id: "tr-third-tone-sandhi",
              title: "Third Tone Sandhi",
              rule: "3+3 → 2+3",
              examples: [
                { chinese: "你好", dictionary: "nǐ hǎo", spoken: "ní hǎo" },
                { chinese: "很好", dictionary: "hěn hǎo", spoken: "hén hǎo" },
              ],
            },
            {
              id: "tr-yi-tone-change",
              title: "Yī Tone Change",
              rule: "yī + 4 → yí",
              examples: [
                { chinese: "一个", dictionary: "yī gè", spoken: "yí gè" },
                { chinese: "一次", dictionary: "yī cì", spoken: "yí cì" },
              ],
            },
            {
              id: "tr-bu-tone-change",
              title: "Bù Tone Change",
              rule: "bù + 4 → bú",
              examples: [
                { chinese: "不是", dictionary: "bù shì", spoken: "bú shì" },
                { chinese: "不对", dictionary: "bù duì", spoken: "bú duì" },
              ],
            },
          ],
        }),
      ),
      http.get(`${API_BASE}/foundations/data/pinyin-character-map`, () =>
        HttpResponse.json({
          ma: "妈",
          ma1: "妈",
          ma2: "麻",
          ma3: "马",
          ma4: "骂",
          ba: "八",
          ba1: "八",
          ba2: "拔",
          ba3: "把",
          ba4: "爸",
          po: "坡",
          po1: "坡",
          po4: "破",
          da: "大",
          da4: "大",
          ta: "他",
          ta1: "他",
          ni: "你",
          ni3: "你",
          li: "力",
          li4: "力",
          ge: "哥",
          ge1: "哥",
          ke: "可",
          ke3: "可",
          hao: "好",
          hao3: "好",
          ji: "鸡",
          ji1: "鸡",
          qi: "七",
          qi1: "七",
          xi: "西",
          xi1: "西",
          zhi: "知",
          zhi1: "知",
          chi: "吃",
          chi1: "吃",
          shi: "是",
          shi2: "十",
          shi4: "是",
          ri: "日",
          ri4: "日",
          ren: "人",
          ren2: "人",
          xiao: "小",
          shui: "水",
          huo: "火",
          mu: "木",
          yue: "月",
        }),
      ),
      http.get(`${API_BASE}/foundations/data/strokes`, () =>
        HttpResponse.json({
          strokes: [
            { id: "dot", glyph: "丶", pinyin: "diǎn", meaning: "Dot", order: 1 },
            { id: "horizontal", glyph: "一", pinyin: "héng", meaning: "Horizontal", order: 2 },
            { id: "vertical", glyph: "丨", pinyin: "shù", meaning: "Vertical", order: 3 },
            { id: "left-falling", glyph: "丿", pinyin: "piě", meaning: "Left-falling", order: 4 },
            { id: "right-falling", glyph: "㇏", pinyin: "nà", meaning: "Right-falling", order: 5 },
            { id: "rise", glyph: "㇀", pinyin: "tí", meaning: "Rise", order: 6 },
            { id: "bend", glyph: "㇍", pinyin: "zhé", meaning: "Bend", order: 7 },
            { id: "hook", glyph: "㇠", pinyin: "gōu", meaning: "Hook", order: 8 },
          ],
          strokeOrderRules: [
            {
              id: "top-to-bottom",
              number: 1,
              name: "Top → Bottom",
              rule: "top stroke first",
              example: "三",
              description: "Write strokes from top to bottom",
            },
            {
              id: "left-to-right",
              number: 2,
              name: "Left → Right",
              rule: "left stroke first",
              example: "川",
              description: "Write strokes from left to right",
            },
            {
              id: "outside-inside",
              number: 3,
              name: "Outside → Inside",
              rule: "frame before contents",
              example: "日",
              description: "Write the outer frame first, then fill the inside",
            },
            {
              id: "close-last",
              number: 4,
              name: "Close frame last",
              rule: "fill then close",
              example: "回",
              description: "Write the frame, fill the contents, then close the bottom",
            },
          ],
          suggestedCharacters: ["一", "丨", "人", "大", "口", "水", "火", "木", "日", "月"],
        }),
      ),
    ],
    loading: () => [
      http.get(`${API_BASE}/foundations/data/pinyin-tones`, () => new Promise(() => {})),
      http.get(`${API_BASE}/foundations/data/pinyin-character-map`, () => new Promise(() => {})),
      http.get(`${API_BASE}/foundations/data/strokes`, () => new Promise(() => {})),
    ],
    error: () => [
      http.get(`${API_BASE}/foundations/data/pinyin-tones`, () =>
        HttpResponse.json({ error: "Failed to load pinyin tones data" }, { status: 500 }),
      ),
      http.get(`${API_BASE}/foundations/data/pinyin-character-map`, () =>
        HttpResponse.json({ error: "Failed to load pinyin character map" }, { status: 500 }),
      ),
    ],
  },
  readers: {
    passages: {
      default: () =>
        http.get(`${API_BASE}/readers/passages`, () =>
          HttpResponse.json(
            {
              data: [
                { id: "p1", title: "你好", hskLevel: 1, knownWordRatio: 95, isBookmarked: true },
                { id: "p2", title: "我的家", hskLevel: 1, knownWordRatio: 88 },
                {
                  id: "p3",
                  title: "学校生活",
                  hskLevel: 2,
                  knownWordRatio: 76,
                  isBookmarked: true,
                },
                { id: "p4", title: "中国的节日", hskLevel: 2, knownWordRatio: 70 },
                { id: "p5", title: "去旅行", hskLevel: 3, knownWordRatio: 65 },
                { id: "p6", title: "环境保护", hskLevel: 3, knownWordRatio: 58 },
                { id: "p7", title: "健康饮食", hskLevel: 4, knownWordRatio: 45 },
                { id: "p8", title: "经济发展", hskLevel: 4, knownWordRatio: 40 },
                { id: "p9", title: "科技与创新", hskLevel: 5, knownWordRatio: 28 },
                { id: "p10", title: "社会学研究", hskLevel: 5, knownWordRatio: 22 },
                { id: "p11", title: "古典文学", hskLevel: 6, knownWordRatio: 15 },
                {
                  id: "p12",
                  title: "哲学思考",
                  hskLevel: 6,
                  knownWordRatio: 10,
                  isBookmarked: true,
                },
              ],
            },
            { status: 200 },
          ),
        ),
      loading: () => http.get(`${API_BASE}/readers/passages`, () => new Promise(() => {})),
      empty: () =>
        http.get(`${API_BASE}/readers/passages`, () =>
          HttpResponse.json({ data: [] }, { status: 200 }),
        ),
      error: () =>
        http.get(`${API_BASE}/readers/passages`, () =>
          HttpResponse.json({ error: "Failed to load passages" }, { status: 500 }),
        ),
    },
    passageDetail: {
      default: () =>
        http.get(`${API_BASE}/readers/passages/:id`, ({ params }) =>
          HttpResponse.json(
            {
              data: {
                id: params.id,
                title: "学校生活",
                hskLevel: 2,
                sentences: [
                  {
                    index: 0,
                    text: "我是学生。",
                    pinyin: "Wǒ shì xuéshēng.",
                    words: [
                      { glyph: "我", wordId: "w_001", hskLevel: 1, pinyin: "wǒ", isKnown: true },
                      { glyph: "是", wordId: "w_002", hskLevel: 1, pinyin: "shì", isKnown: true },
                      {
                        glyph: "学生",
                        wordId: "w_003",
                        hskLevel: 1,
                        pinyin: "xuéshēng",
                        isKnown: true,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 1,
                    text: "我每天去学校。",
                    pinyin: "Wǒ měi tiān qù xuéxiào.",
                    words: [
                      { glyph: "我", wordId: "w_001", hskLevel: 1, pinyin: "wǒ", isKnown: true },
                      {
                        glyph: "每天",
                        wordId: "w_004",
                        hskLevel: 2,
                        pinyin: "měitiān",
                        isKnown: false,
                      },
                      { glyph: "去", wordId: "w_005", hskLevel: 1, pinyin: "qù", isKnown: true },
                      {
                        glyph: "学校",
                        wordId: "w_006",
                        hskLevel: 1,
                        pinyin: "xuéxiào",
                        isKnown: true,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 2,
                    text: "我喜欢学中文。",
                    pinyin: "Wǒ xǐhuān xué zhōngwén.",
                    words: [
                      { glyph: "我", wordId: "w_001", hskLevel: 1, pinyin: "wǒ", isKnown: true },
                      {
                        glyph: "喜欢",
                        wordId: "w_007",
                        hskLevel: 2,
                        pinyin: "xǐhuān",
                        isKnown: false,
                      },
                      { glyph: "学", wordId: "w_008", hskLevel: 1, pinyin: "xué", isKnown: true },
                      {
                        glyph: "中文",
                        wordId: "w_009",
                        hskLevel: 1,
                        pinyin: "zhōngwén",
                        isKnown: true,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 3,
                    text: "我的老师很好。",
                    pinyin: "Wǒ de lǎoshī hěn hǎo.",
                    words: [
                      {
                        glyph: "我的",
                        wordId: "w_010",
                        hskLevel: 1,
                        pinyin: "wǒ de",
                        isKnown: true,
                      },
                      {
                        glyph: "老师",
                        wordId: "w_011",
                        hskLevel: 1,
                        pinyin: "lǎoshī",
                        isKnown: true,
                      },
                      { glyph: "很", wordId: "w_012", hskLevel: 1, pinyin: "hěn", isKnown: true },
                      { glyph: "好", wordId: "w_013", hskLevel: 1, pinyin: "hǎo", isKnown: true },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 4,
                    text: "我有很多朋友。",
                    pinyin: "Wǒ yǒu hěn duō péngyǒu.",
                    words: [
                      { glyph: "我", wordId: "w_001", hskLevel: 1, pinyin: "wǒ", isKnown: true },
                      { glyph: "有", wordId: "w_014", hskLevel: 1, pinyin: "yǒu", isKnown: true },
                      {
                        glyph: "很多",
                        wordId: "w_015",
                        hskLevel: 1,
                        pinyin: "hěn duō",
                        isKnown: false,
                      },
                      {
                        glyph: "朋友",
                        wordId: "w_016",
                        hskLevel: 1,
                        pinyin: "péngyǒu",
                        isKnown: true,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                ],
              },
            },
            { status: 200 },
          ),
        ),
      hsk1: () =>
        http.get(`${API_BASE}/readers/passages/:id`, () =>
          HttpResponse.json(
            {
              data: {
                id: "p-hsk1",
                title: "你好",
                hskLevel: 1,
                sentences: [
                  {
                    index: 0,
                    text: "你好。",
                    pinyin: "Nǐ hǎo.",
                    words: [
                      {
                        glyph: "你好",
                        wordId: "w_hello",
                        hskLevel: 1,
                        pinyin: "nǐhǎo",
                        isKnown: true,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 1,
                    text: "我叫小明。",
                    pinyin: "Wǒ jiào Xiǎomíng.",
                    words: [
                      { glyph: "我", wordId: "w_001", hskLevel: 1, pinyin: "wǒ", isKnown: true },
                      { glyph: "叫", wordId: "w_call", hskLevel: 1, pinyin: "jiào", isKnown: true },
                      {
                        glyph: "小明",
                        wordId: "w_xm",
                        hskLevel: 1,
                        pinyin: "xiǎomíng",
                        isKnown: false,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 2,
                    text: "我是学生。",
                    pinyin: "Wǒ shì xuéshēng.",
                    words: [
                      { glyph: "我", wordId: "w_001", hskLevel: 1, pinyin: "wǒ", isKnown: true },
                      { glyph: "是", wordId: "w_is", hskLevel: 1, pinyin: "shì", isKnown: true },
                      {
                        glyph: "学生",
                        wordId: "w_stu",
                        hskLevel: 1,
                        pinyin: "xuéshēng",
                        isKnown: false,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                ],
              },
            },
            { status: 200 },
          ),
        ),
      hsk4: () =>
        http.get(`${API_BASE}/readers/passages/:id`, () =>
          HttpResponse.json(
            {
              data: {
                id: "p-hsk4",
                title: "环境保护",
                hskLevel: 4,
                sentences: [
                  {
                    index: 0,
                    text: "环境保护是现代社会的重要议题。",
                    pinyin: "Huánjìng bǎohù shì xiàndài shèhuì de zhòngyào yìtí.",
                    words: [
                      {
                        glyph: "环境",
                        wordId: "w_env",
                        hskLevel: 4,
                        pinyin: "huánjìng",
                        isKnown: false,
                      },
                      {
                        glyph: "保护",
                        wordId: "w_protect",
                        hskLevel: 3,
                        pinyin: "bǎohù",
                        isKnown: false,
                      },
                      { glyph: "是", wordId: "w_is", hskLevel: 1, pinyin: "shì", isKnown: true },
                      {
                        glyph: "现代",
                        wordId: "w_modern",
                        hskLevel: 4,
                        pinyin: "xiàndài",
                        isKnown: false,
                      },
                      {
                        glyph: "社会",
                        wordId: "w_soc",
                        hskLevel: 3,
                        pinyin: "shèhuì",
                        isKnown: false,
                      },
                      { glyph: "的", wordId: "w_de", hskLevel: 1, pinyin: "de", isKnown: true },
                      {
                        glyph: "重要",
                        wordId: "w_imp",
                        hskLevel: 3,
                        pinyin: "zhòngyào",
                        isKnown: false,
                      },
                      {
                        glyph: "议题",
                        wordId: "w_topic",
                        hskLevel: 5,
                        pinyin: "yìtí",
                        isKnown: false,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 1,
                    text: "我们应该减少使用塑料袋。",
                    pinyin: "Wǒmen yīnggāi jiǎnshǎo shǐyòng sùliàodài.",
                    words: [
                      {
                        glyph: "我们",
                        wordId: "w_we",
                        hskLevel: 1,
                        pinyin: "wǒmen",
                        isKnown: true,
                      },
                      {
                        glyph: "应该",
                        wordId: "w_should",
                        hskLevel: 3,
                        pinyin: "yīnggāi",
                        isKnown: false,
                      },
                      {
                        glyph: "减少",
                        wordId: "w_reduce",
                        hskLevel: 4,
                        pinyin: "jiǎnshǎo",
                        isKnown: false,
                      },
                      {
                        glyph: "使用",
                        wordId: "w_use",
                        hskLevel: 3,
                        pinyin: "shǐyòng",
                        isKnown: false,
                      },
                      {
                        glyph: "塑料",
                        wordId: "w_plastic",
                        hskLevel: 4,
                        pinyin: "sùliào",
                        isKnown: false,
                      },
                      { glyph: "袋", wordId: "w_bag", hskLevel: 5, pinyin: "dài", isKnown: false },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                ],
              },
            },
            { status: 200 },
          ),
        ),
      hsk6: () =>
        http.get(`${API_BASE}/readers/passages/:id`, () =>
          HttpResponse.json(
            {
              data: {
                id: "p-hsk6",
                title: "古典文学与现代思想",
                hskLevel: 6,
                sentences: [
                  {
                    index: 0,
                    text: "古典文学承载着丰富的哲学思想。",
                    pinyin: "Gǔdiǎn wénxué chéngzài zhe fēngfù de zhéxué sīxiǎng.",
                    words: [
                      {
                        glyph: "古典",
                        wordId: "w_classic",
                        hskLevel: 5,
                        pinyin: "gǔdiǎn",
                        isKnown: false,
                      },
                      {
                        glyph: "文学",
                        wordId: "w_lit",
                        hskLevel: 4,
                        pinyin: "wénxué",
                        isKnown: false,
                      },
                      {
                        glyph: "承载",
                        wordId: "w_carry",
                        hskLevel: 6,
                        pinyin: "chéngzài",
                        isKnown: false,
                      },
                      { glyph: "着", wordId: "w_zhe", hskLevel: 3, pinyin: "zhe", isKnown: false },
                      {
                        glyph: "丰富",
                        wordId: "w_rich",
                        hskLevel: 3,
                        pinyin: "fēngfù",
                        isKnown: false,
                      },
                      { glyph: "的", wordId: "w_de", hskLevel: 1, pinyin: "de", isKnown: true },
                      {
                        glyph: "哲学",
                        wordId: "w_phil",
                        hskLevel: 5,
                        pinyin: "zhéxué",
                        isKnown: false,
                      },
                      {
                        glyph: "思想",
                        wordId: "w_thought",
                        hskLevel: 4,
                        pinyin: "sīxiǎng",
                        isKnown: false,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                  {
                    index: 1,
                    text: "这些作品对当代社会仍有深远影响。",
                    pinyin: "Zhèxiē zuòpǐn duì dāngdài shèhuì réng yǒu shēnyuǎn yǐngxiǎng.",
                    words: [
                      {
                        glyph: "这些",
                        wordId: "w_these",
                        hskLevel: 2,
                        pinyin: "zhèxiē",
                        isKnown: false,
                      },
                      {
                        glyph: "作品",
                        wordId: "w_work",
                        hskLevel: 4,
                        pinyin: "zuòpǐn",
                        isKnown: false,
                      },
                      { glyph: "对", wordId: "w_to", hskLevel: 2, pinyin: "duì", isKnown: true },
                      {
                        glyph: "当代",
                        wordId: "w_contemp",
                        hskLevel: 5,
                        pinyin: "dāngdài",
                        isKnown: false,
                      },
                      {
                        glyph: "社会",
                        wordId: "w_soc",
                        hskLevel: 3,
                        pinyin: "shèhuì",
                        isKnown: false,
                      },
                      {
                        glyph: "仍",
                        wordId: "w_still",
                        hskLevel: 6,
                        pinyin: "réng",
                        isKnown: false,
                      },
                      { glyph: "有", wordId: "w_have", hskLevel: 1, pinyin: "yǒu", isKnown: true },
                      {
                        glyph: "深远",
                        wordId: "w_deep",
                        hskLevel: 6,
                        pinyin: "shēnyuǎn",
                        isKnown: false,
                      },
                      {
                        glyph: "影响",
                        wordId: "w_infl",
                        hskLevel: 3,
                        pinyin: "yǐngxiǎng",
                        isKnown: false,
                      },
                      { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
                    ],
                  },
                ],
              },
            },
            { status: 200 },
          ),
        ),
      loading: () => http.get(`${API_BASE}/readers/passages/:id`, () => new Promise(() => {})),
      error: () =>
        http.get(`${API_BASE}/readers/passages/:id`, () =>
          HttpResponse.json({ error: "Failed to load passage" }, { status: 500 }),
        ),
    },
    wordDetail: {
      default: () =>
        http.get(`${API_BASE}/words/:word`, ({ params }) =>
          HttpResponse.json(
            {
              data: {
                glyph: params.word,
                pinyin: "xǐhuān",
                definitions: ["to like; to be fond of", "to love; to be keen on"],
                hskLevel: 2,
                constituentCharacters: [
                  { glyph: "喜", pinyin: "xǐ", meaning: "happy; like" },
                  { glyph: "欢", pinyin: "huān", meaning: "joy; happy" },
                ],
              },
            },
            { status: 200 },
          ),
        ),
      loading: () => http.get(`${API_BASE}/words/:word`, () => new Promise(() => {})),
      error: () =>
        http.get(`${API_BASE}/words/:word`, () =>
          HttpResponse.json({ error: "Failed to load word" }, { status: 500 }),
        ),
      notFound: () =>
        http.get(`${API_BASE}/words/:word`, () => HttpResponse.json(null, { status: 404 })),
    },
  },
};
