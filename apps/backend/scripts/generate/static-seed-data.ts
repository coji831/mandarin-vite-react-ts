/**
 * @file apps/backend/scripts/generate/static-seed-data.ts
 * @description Phase 1 extractor: extracts hardcoded data arrays from existing
 *   seed files (measure words, demo passages) into raw JSON files.
 *
 * Writes multiple output files to content/seed/phase1/:
 *   - measure-words.json
 *   - demo-passages.json
 *
 * No enrichment, no DB writes, no ID resolution.
 * Idempotent: always overwrites output.
 *
 * Run: cd apps/backend && npx tsx scripts/generate/static-seed-data.ts
 */

import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("gen:static");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");

// ── Types ──

interface MeasureWordEntry {
  glyph: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  nouns: string[];
}

interface DemoPassageSentence {
  text: string;
  words: string[];
}

interface DemoPassageContent {
  sentences: DemoPassageSentence[];
}

interface DemoPassageEntry {
  title: string;
  hskLevel: number;
  content: DemoPassageContent;
  metadata: {
    wordCount: number;
    uniqueChars: number;
  };
}

// ── Measure Words Data ──

const MEASURE_WORDS: MeasureWordEntry[] = [
  {
    glyph: "个",
    pinyin: "gè",
    meaning: "generic individual unit",
    hskLevel: 1,
    nouns: ["人", "朋友", "学生"],
  },
  {
    glyph: "本",
    pinyin: "běn",
    meaning: "bound volumes (books, magazines)",
    hskLevel: 1,
    nouns: ["书", "词典", "杂志"],
  },
  {
    glyph: "张",
    pinyin: "zhāng",
    meaning: "flat objects, sheets",
    hskLevel: 1,
    nouns: ["纸", "票", "床", "桌子"],
  },
  {
    glyph: "条",
    pinyin: "tiáo",
    meaning: "long slender objects",
    hskLevel: 1,
    nouns: ["鱼", "路", "裤子", "河"],
  },
  {
    glyph: "只",
    pinyin: "zhǐ",
    meaning: "one of a pair; animals",
    hskLevel: 1,
    nouns: ["猫", "狗", "鸟", "鞋"],
  },
  { glyph: "杯", pinyin: "bēi", meaning: "cup of", hskLevel: 1, nouns: ["水", "茶", "咖啡"] },
  { glyph: "碗", pinyin: "wǎn", meaning: "bowl of", hskLevel: 2, nouns: ["饭", "面", "汤"] },
  {
    glyph: "块",
    pinyin: "kuài",
    meaning: "piece, lump; yuan (money)",
    hskLevel: 1,
    nouns: ["钱", "蛋糕", "石头"],
  },
  {
    glyph: "件",
    pinyin: "jiàn",
    meaning: "item, article (clothing, matters)",
    hskLevel: 2,
    nouns: ["衣服", "事", "礼物"],
  },
  { glyph: "双", pinyin: "shuāng", meaning: "pair of", hskLevel: 2, nouns: ["鞋", "筷子", "手"] },
  {
    glyph: "对",
    pinyin: "duì",
    meaning: "pair, couple",
    hskLevel: 2,
    nouns: ["耳朵", "夫妻", "眼睛"],
  },
  {
    glyph: "片",
    pinyin: "piàn",
    meaning: "slice, thin piece",
    hskLevel: 3,
    nouns: ["面包", "药", "树叶"],
  },
  {
    glyph: "把",
    pinyin: "bǎ",
    meaning: "handful; objects with handles",
    hskLevel: 2,
    nouns: ["刀", "钥匙", "椅子", "伞"],
  },
  {
    glyph: "辆",
    pinyin: "liàng",
    meaning: "wheeled vehicles",
    hskLevel: 2,
    nouns: ["车", "自行车", "公共汽车"],
  },
  {
    glyph: "台",
    pinyin: "tái",
    meaning: "machines, devices",
    hskLevel: 3,
    nouns: ["电脑", "电视", "手机"],
  },
  {
    glyph: "部",
    pinyin: "bù",
    meaning: "department; literary works",
    hskLevel: 3,
    nouns: ["电影", "电话", "小说"],
  },
  { glyph: "间", pinyin: "jiān", meaning: "room of", hskLevel: 2, nouns: ["房间", "教室", "公司"] },
  {
    glyph: "所",
    pinyin: "suǒ",
    meaning: "institutions, buildings",
    hskLevel: 3,
    nouns: ["学校", "医院", "房子"],
  },
  {
    glyph: "家",
    pinyin: "jiā",
    meaning: "family, business",
    hskLevel: 1,
    nouns: ["公司", "商店", "餐厅", "人"],
  },
  {
    glyph: "座",
    pinyin: "zuò",
    meaning: "large structures",
    hskLevel: 3,
    nouns: ["山", "桥", "城市"],
  },
  {
    glyph: "门",
    pinyin: "mén",
    meaning: "subject, branch",
    hskLevel: 3,
    nouns: ["课", "语言", "技术"],
  },
  {
    glyph: "口",
    pinyin: "kǒu",
    meaning: "mouthful; family members",
    hskLevel: 2,
    nouns: ["人", "水"],
  },
  {
    glyph: "头",
    pinyin: "tóu",
    meaning: "head of (animals)",
    hskLevel: 3,
    nouns: ["牛", "猪", "大象"],
  },
  { glyph: "匹", pinyin: "pǐ", meaning: "bolt of cloth; horse", hskLevel: 3, nouns: ["马", "布"] },
  {
    glyph: "封",
    pinyin: "fēng",
    meaning: "sealed item (letters)",
    hskLevel: 3,
    nouns: ["信", "邮件"],
  },
  {
    glyph: "份",
    pinyin: "fèn",
    meaning: "portion, copy",
    hskLevel: 3,
    nouns: ["报纸", "工作", "礼物"],
  },
  {
    glyph: "首",
    pinyin: "shǒu",
    meaning: "piece of (poetry, song)",
    hskLevel: 3,
    nouns: ["歌", "诗"],
  },
  {
    glyph: "篇",
    pinyin: "piān",
    meaning: "piece of writing",
    hskLevel: 3,
    nouns: ["文章", "日记"],
  },
  { glyph: "页", pinyin: "yè", meaning: "page", hskLevel: 3, nouns: ["书", "纸"] },
  { glyph: "层", pinyin: "céng", meaning: "layer, floor", hskLevel: 3, nouns: ["楼", "土"] },
  { glyph: "朵", pinyin: "duǒ", meaning: "flower, cloud", hskLevel: 3, nouns: ["花", "云"] },
  {
    glyph: "颗",
    pinyin: "kē",
    meaning: "small round objects",
    hskLevel: 3,
    nouns: ["星", "牙", "心"],
  },
  {
    glyph: "粒",
    pinyin: "lì",
    meaning: "small grain-like objects",
    hskLevel: 3,
    nouns: ["米", "药"],
  },
  {
    glyph: "根",
    pinyin: "gēn",
    meaning: "long slender objects (hair, sticks)",
    hskLevel: 3,
    nouns: ["头发", "香蕉", "筷子"],
  },
  {
    glyph: "支",
    pinyin: "zhī",
    meaning: "slim rod-like objects",
    hskLevel: 3,
    nouns: ["笔", "烟", "枪"],
  },
  {
    glyph: "段",
    pinyin: "duàn",
    meaning: "section, segment",
    hskLevel: 3,
    nouns: ["时间", "路", "话"],
  },
  {
    glyph: "节",
    pinyin: "jié",
    meaning: "class period; section",
    hskLevel: 3,
    nouns: ["课", "车厢"],
  },
  {
    glyph: "种",
    pinyin: "zhǒng",
    meaning: "kind, type, sort",
    hskLevel: 1,
    nouns: ["人", "动物", "颜色"],
  },
  { glyph: "样", pinyin: "yàng", meaning: "kind, type", hskLevel: 3, nouns: ["东西", "菜"] },
  { glyph: "类", pinyin: "lèi", meaning: "category, class", hskLevel: 3, nouns: ["问题", "活动"] },
  {
    glyph: "级",
    pinyin: "jí",
    meaning: "level, grade, rank",
    hskLevel: 3,
    nouns: ["台阶", "考试"],
  },
  { glyph: "等", pinyin: "děng", meaning: "class, grade, rank", hskLevel: 3, nouns: ["人"] },
  { glyph: "号", pinyin: "hào", meaning: "number, size", hskLevel: 2, nouns: ["房间", "鞋"] },
  {
    glyph: "位",
    pinyin: "wèi",
    meaning: "polite person counter",
    hskLevel: 2,
    nouns: ["人", "老师", "客人"],
  },
  {
    glyph: "名",
    pinyin: "míng",
    meaning: "person (formal)",
    hskLevel: 3,
    nouns: ["学生", "记者", "医生"],
  },
  {
    glyph: "项",
    pinyin: "xiàng",
    meaning: "item (abstract)",
    hskLevel: 3,
    nouns: ["工作", "任务"],
  },
  { glyph: "任", pinyin: "rèn", meaning: "term of office", hskLevel: 4, nouns: ["总统", "经理"] },
  { glyph: "届", pinyin: "jiè", meaning: "session, term", hskLevel: 4, nouns: ["会议", "学生"] },
  { glyph: "句", pinyin: "jù", meaning: "sentence, line", hskLevel: 2, nouns: ["话", "台词"] },
  { glyph: "顿", pinyin: "dùn", meaning: "meal", hskLevel: 3, nouns: ["饭", "早餐"] },
  { glyph: "场", pinyin: "chǎng", meaning: "event, match", hskLevel: 3, nouns: ["电影", "比赛"] },
  { glyph: "遍", pinyin: "biàn", meaning: "time (through)", hskLevel: 3, nouns: ["书"] },
];

// ── Demo Passages Data ──

const DEMO_PASSAGES: DemoPassageEntry[] = [
  {
    title: "我的学校",
    hskLevel: 1,
    content: {
      sentences: [
        { text: "我是学生。", words: ["我", "是", "学生"] },
        { text: "我喜欢学习中文。", words: ["我", "喜欢", "学习", "中文"] },
        { text: "我每天看书。", words: ["我", "每天", "看", "书"] },
        { text: "我的老师很好。", words: ["我", "的", "老师", "很", "好"] },
      ],
    },
    metadata: { wordCount: 15, uniqueChars: 18 },
  },
  {
    title: "我的朋友",
    hskLevel: 2,
    content: {
      sentences: [
        { text: "我有一个好朋友。", words: ["我", "有", "一个", "好", "朋友"] },
        { text: "他每天去学校学习。", words: ["他", "每天", "去", "学校", "学习"] },
        { text: "我们一起看书和写字。", words: ["我们", "一起", "看", "书", "和", "写", "字"] },
        { text: "他的中文很好。", words: ["他", "的", "中文", "很", "好"] },
      ],
    },
    metadata: { wordCount: 18, uniqueChars: 20 },
  },
  {
    title: "周末的计划",
    hskLevel: 3,
    content: {
      sentences: [
        { text: "这个周末我打算去游泳。", words: ["这个", "周末", "我", "打算", "去", "游泳"] },
        { text: "天气很好，太阳很大。", words: ["天气", "很好", "太阳", "很大"] },
        {
          text: "我朋友也想去，但是他太忙了。",
          words: ["我", "朋友", "也", "想去", "但是", "他", "太忙", "了"],
        },
        { text: "我们决定下次一起去。", words: ["我们", "决定", "下次", "一起", "去"] },
      ],
    },
    metadata: { wordCount: 23, uniqueChars: 32 },
  },
  {
    title: "健康的生活",
    hskLevel: 4,
    content: {
      sentences: [
        {
          text: "健康的生活对每个人都很重要。",
          words: ["健康", "的", "生活", "对", "每个人", "都", "很", "重要"],
        },
        {
          text: "我们应该每天运动，吃健康的食物。",
          words: ["我们", "应该", "每天", "运动", "吃", "健康", "的", "食物"],
        },
        { text: "早睡早起也是一个好习惯。", words: ["早睡", "早起", "也是", "一个", "好", "习惯"] },
        {
          text: "只要坚持，身体就会越来越好。",
          words: ["只要", "坚持", "身体", "就会", "越来越", "好"],
        },
      ],
    },
    metadata: { wordCount: 28, uniqueChars: 35 },
  },
  {
    title: "环境保护",
    hskLevel: 5,
    content: {
      sentences: [
        {
          text: "随着经济的发展，环境问题越来越严重。",
          words: ["随着", "经济", "的", "发展", "环境", "问题", "越来越", "严重"],
        },
        {
          text: "我们应该采取行动保护我们的地球。",
          words: ["我们", "应该", "采取", "行动", "保护", "我们", "的", "地球"],
        },
        {
          text: "减少使用塑料袋，节约用水用电，这些都是简单有效的方法。",
          words: [
            "减少",
            "使用",
            "塑料",
            "袋",
            "节约",
            "用水",
            "用电",
            "这些",
            "都",
            "是",
            "简单",
            "有效",
            "的",
            "方法",
          ],
        },
        {
          text: "每个人都可以为环境保护贡献一份力量。",
          words: ["每个人", "都", "可以", "为", "环境", "保护", "贡献", "一份", "力量"],
        },
      ],
    },
    metadata: { wordCount: 39, uniqueChars: 44 },
  },
  {
    title: "传统节日",
    hskLevel: 6,
    content: {
      sentences: [
        {
          text: "春节是中国最重要的传统节日。",
          words: ["春节", "是", "中国", "最", "重要", "的", "传统", "节日"],
        },
        {
          text: "无论身在何处，人们都会想方设法回家团聚。",
          words: ["无论", "身在", "何处", "人们", "都会", "想方设法", "回家", "团聚"],
        },
        {
          text: "除夕之夜，全家人围坐在一起吃年夜饭，观看春节联欢晚会。",
          words: [
            "除夕",
            "之",
            "夜",
            "全家人",
            "围坐",
            "在",
            "一起",
            "吃",
            "年夜饭",
            "观看",
            "春节",
            "联欢",
            "晚会",
          ],
        },
        {
          text: "这种深厚的文化传统已经延续了数千年。",
          words: ["这种", "深厚", "的", "文化", "传统", "已经", "延续", "了", "数千年"],
        },
      ],
    },
    metadata: { wordCount: 38, uniqueChars: 47 },
  },
];

// ── Main ──

function main(): void {
  logger.info("=== Phase 1: Extract Static Seed Data ===");

  ensureDir(OUTPUT_DIR);

  // Write measure-words.json
  const mwPath = path.join(OUTPUT_DIR, "measure-words.json");
  writeJsonAtomic(mwPath, MEASURE_WORDS);
  logger.info(`Wrote ${MEASURE_WORDS.length} measure words to ${mwPath}`);

  // Write demo-passages.json
  const dpPath = path.join(OUTPUT_DIR, "demo-passages.json");
  writeJsonAtomic(dpPath, DEMO_PASSAGES);
  logger.info(`Wrote ${DEMO_PASSAGES.length} demo passages to ${dpPath}`);

  logger.info("Done.");
}

main();
