/**
 * MockContentSource
 *
 * Provides a ContentSource implementation with realistic sample data
 * so the LibraryPage renders actual content instead of an empty state.
 * Can be swapped for a real API-backed service when one becomes available.
 */

import type { ContentItem, ContentSource } from "shared/components";

const sampleItems: ContentItem[] = [
  // ── Foundations (Phase 1) ──
  {
    id: "ch_1001",
    contentType: "foundations",
    title: "好",
    subtitle: "hǎo",
    translation: "Good, well",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "ch_0342",
    contentType: "foundations",
    title: "没",
    subtitle: "méi",
    translation: "Not, have not",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_01",
    contentType: "foundations",
    title: "你好",
    subtitle: "nǐ hǎo",
    translation: "Hello",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_02",
    contentType: "foundations",
    title: "谢谢",
    subtitle: "xiè xiè",
    translation: "Thank you",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_03",
    contentType: "foundations",
    title: "学习",
    subtitle: "xuéxí",
    translation: "Study, learn",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_04",
    contentType: "foundations",
    title: "中国",
    subtitle: "zhōngguó",
    translation: "China",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_05",
    contentType: "foundations",
    title: "朋友",
    subtitle: "péngyǒu",
    translation: "Friend",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_06",
    contentType: "foundations",
    title: "老师",
    subtitle: "lǎoshī",
    translation: "Teacher",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_07",
    contentType: "foundations",
    title: "学生",
    subtitle: "xuéshēng",
    translation: "Student",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_08",
    contentType: "foundations",
    title: "大",
    subtitle: "dà",
    translation: "Big, large",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_09",
    contentType: "foundations",
    title: "小",
    subtitle: "xiǎo",
    translation: "Small, little",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_10",
    contentType: "foundations",
    title: "水",
    subtitle: "shuǐ",
    translation: "Water",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_11",
    contentType: "foundations",
    title: "火",
    subtitle: "huǒ",
    translation: "Fire",
    hskLevel: 1,
    phase: 1,
  },
  {
    id: "foundation_12",
    contentType: "foundations",
    title: "山",
    subtitle: "shān",
    translation: "Mountain",
    hskLevel: 1,
    phase: 1,
  },

  // ── Radicals (Phase 2) ──
  {
    id: "rad_0001",
    contentType: "radical",
    title: "一",
    subtitle: "yī",
    translation: "One",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0002",
    contentType: "radical",
    title: "丨",
    subtitle: "gǔn",
    translation: "Line",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0003",
    contentType: "radical",
    title: "丶",
    subtitle: "zhǔ",
    translation: "Dot",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0008",
    contentType: "radical",
    title: "亠",
    subtitle: "tóu",
    translation: "Lid",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0009",
    contentType: "radical",
    title: "人",
    subtitle: "rén",
    translation: "Person / Human",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0018",
    contentType: "radical",
    title: "刀",
    subtitle: "dāo",
    translation: "Knife / Sword",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0019",
    contentType: "radical",
    title: "力",
    subtitle: "lì",
    translation: "Power / Strength",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0025",
    contentType: "radical",
    title: "卜",
    subtitle: "bǔ",
    translation: "Divination",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0029",
    contentType: "radical",
    title: "又",
    subtitle: "yòu",
    translation: "Again / Right hand",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0030",
    contentType: "radical",
    title: "口",
    subtitle: "kǒu",
    translation: "Mouth / Opening",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0032",
    contentType: "radical",
    title: "土",
    subtitle: "tǔ",
    translation: "Earth / Ground",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0034",
    contentType: "radical",
    title: "夂",
    subtitle: "zhǐ",
    translation: "Walk slowly",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0037",
    contentType: "radical",
    title: "大",
    subtitle: "dà",
    translation: "Big / Great",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0038",
    contentType: "radical",
    title: "女",
    subtitle: "nǚ",
    translation: "Woman / Female",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0040",
    contentType: "radical",
    title: "宀",
    subtitle: "mián",
    translation: "Roof / Cover",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0041",
    contentType: "radical",
    title: "寸",
    subtitle: "cùn",
    translation: "Inch / Measure",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0061",
    contentType: "radical",
    title: "心",
    subtitle: "xīn",
    translation: "Heart / Mind",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0064",
    contentType: "radical",
    title: "手",
    subtitle: "shǒu",
    translation: "Hand",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0086",
    contentType: "radical",
    title: "火",
    subtitle: "huǒ",
    translation: "Fire",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "rad_0096",
    contentType: "radical",
    title: "玉",
    subtitle: "yù",
    translation: "Jade",
    hskLevel: 1,
    phase: 2,
  },

  // ── Phonetic (Phase 3) ──
  {
    id: "phonetic_01",
    contentType: "phonetic",
    title: "吗",
    subtitle: "ma",
    translation: "Question particle",
    hskLevel: 1,
    phase: 3,
  },
  {
    id: "phonetic_02",
    contentType: "phonetic",
    title: "他",
    subtitle: "tā",
    translation: "He / Him",
    hskLevel: 1,
    phase: 3,
  },
  {
    id: "phonetic_03",
    contentType: "phonetic",
    title: "她",
    subtitle: "tā",
    translation: "She / Her",
    hskLevel: 1,
    phase: 3,
  },
  {
    id: "phonetic_04",
    contentType: "phonetic",
    title: "们",
    subtitle: "men",
    translation: "Plural suffix",
    hskLevel: 1,
    phase: 3,
  },
  {
    id: "phonetic_05",
    contentType: "phonetic",
    title: "很",
    subtitle: "hěn",
    translation: "Very",
    hskLevel: 1,
    phase: 3,
  },

  // ── Reader (Phase 3) ──
  {
    id: "reader_01",
    contentType: "reader",
    title: "小明的故事",
    subtitle: "Xiǎo Míng de gùshì",
    translation: "Xiao Ming's Story",
    hskLevel: 2,
    phase: 3,
  },
  {
    id: "reader_02",
    contentType: "reader",
    title: "中国的节日",
    subtitle: "Zhōngguó de jiérì",
    translation: "Chinese Festivals",
    hskLevel: 2,
    phase: 3,
  },
  {
    id: "reader_03",
    contentType: "reader",
    title: "我的家庭",
    subtitle: "Wǒ de jiātíng",
    translation: "My Family",
    hskLevel: 1,
    phase: 3,
  },

  // ── Grammar (Phase 2) ──
  {
    id: "grammar_01",
    contentType: "grammar",
    title: "是...的",
    subtitle: "shì...de",
    translation: "Emphasis structure",
    hskLevel: 2,
    phase: 2,
  },
  {
    id: "grammar_02",
    contentType: "grammar",
    title: "把 construction",
    subtitle: "bǎ",
    translation: "Disposal / handle construction",
    hskLevel: 3,
    phase: 2,
  },
  {
    id: "grammar_03",
    contentType: "grammar",
    title: "了 particle",
    subtitle: "le",
    translation: "Perfective / change-of-state",
    hskLevel: 1,
    phase: 2,
  },
  {
    id: "grammar_04",
    contentType: "grammar",
    title: "被 construction",
    subtitle: "bèi",
    translation: "Passive voice marker",
    hskLevel: 3,
    phase: 2,
  },

  // ── Chengyu (Phase 4) ──
  {
    id: "chengyu_01",
    contentType: "chengyu",
    title: "一石二鸟",
    subtitle: "yī shí èr niǎo",
    translation: "Kill two birds with one stone",
    hskLevel: 4,
    phase: 4,
  },
  {
    id: "chengyu_02",
    contentType: "chengyu",
    title: "画龙点睛",
    subtitle: "huà lóng diǎn jīng",
    translation: "Add the finishing touch",
    hskLevel: 4,
    phase: 4,
  },
  {
    id: "chengyu_03",
    contentType: "chengyu",
    title: "马马虎虎",
    subtitle: "mǎ mǎ hǔ hǔ",
    translation: "So-so / careless",
    hskLevel: 3,
    phase: 4,
  },
];

/**
 * Creates a ContentSource that serves the sample items above.
 * Apply filtering, search, and pagination client-side.
 */
export function createMockContentSource(): ContentSource {
  return {
    getItems: async (params) => {
      // Simulate network delay for realistic loading state
      await new Promise((r) => setTimeout(r, 200));

      let filtered = [...sampleItems];

      // Filter by content type
      if (params.contentType) {
        filtered = filtered.filter((item) => item.contentType === params.contentType);
      }

      // Filter by search query (Chinese, pinyin, or English)
      if (params.searchQuery) {
        const q = params.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
            (item.translation && item.translation.toLowerCase().includes(q)),
        );
      }

      // Filter by HSK level
      if (params.hskLevel !== undefined) {
        filtered = filtered.filter((item) => item.hskLevel === params.hskLevel);
      }

      // Filter by phase
      if (params.phase !== undefined) {
        filtered = filtered.filter((item) => item.phase === params.phase);
      }

      const total = filtered.length;
      const start = (params.page - 1) * params.pageSize;
      const items = filtered.slice(start, start + params.pageSize);

      return { items, total };
    },
  };
}
