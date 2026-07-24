# Mandarin Chinese Fundamentals

**Purpose:** Central reference for Mandarin language structure to inform app design and architecture decisions.
**Last Updated:** 2026-07-24

---

## 1. Language Architecture Overview

**Hierarchy:** Strokes (笔画) → Radicals (部首) → Characters (汉字) → Words (词汇) → Phrases → Sentences

| Level               | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| Strokes             | Smallest structural units — ~30-36 distinct types               |
| Radicals            | 214 Kangxi radicals — semantic/organizational components        |
| Characters          | Logographs representing morphemes (one syllable each)           |
| Words               | Predominantly disyllabic in modern Chinese (~80% of vocabulary) |
| Phrases / Sentences | Built from words following SVO, topic-prominent grammar         |

**Key properties:**

- Characters are **morphosyllabic** — each character = one syllable + one morpheme
- Words are formed from 1-4+ characters, most commonly 2
- Strokes combine into radicals, radicals combine into characters, characters combine into words

---

## 2. Building Blocks

### 2.1 Strokes (笔画)

The character 永 (yǒng, "eternity") demonstrates the 8 basic stroke principles.

**Stroke categories (PRC national standard):**

| Category  | Chinese      | Description               |
| --------- | ------------ | ------------------------- |
| 横 (héng) | Horizontal   | Left-to-right line        |
| 竖 (shù)  | Vertical     | Top-to-bottom line        |
| 撇 (piě)  | Left-falling | Diagonal down-left        |
| 点 (diǎn) | Dot          | Small dot or tick         |
| 折 (zhé)  | Bent         | Right-angle or sharp turn |

**Extended 8 categories (including hooks):** 横, 提, 竖, 撇, 点, 捺, 折, 钩

**Unicode CJK Strokes block:** 36-38 stroke types defined.

**Stroke counts:**

- Average: ~9.7 strokes for common 3,500 characters
- Average: ~12.8 strokes for the full CJK set

**Stroke order rules:**

1. Horizontal before vertical
2. Left-falling before right-falling
3. Top before bottom
4. Left before right
5. Outside before inside

### 2.2 Radicals (部首)

- **214 Kangxi radicals** — standard since 1716 (Kangxi Dictionary)
- Originally derived from Shuowen Jiezi's 540 radicals (c. 100 CE)
- Radicals range from 1 to 17 strokes (median: 5)
- Modern dictionaries may use fewer (e.g., Xinhua Zidian: 201 radicals)

**Most common radicals by character count:**

| Radical | Meaning     | Approx. Characters |
| ------- | ----------- | ------------------ |
| 艸 (艹) | Grass       | ~1,900             |
| 水 (氵) | Water       | ~1,600             |
| 木      | Tree / wood | ~1,300             |
| 手 (扌) | Hand        | ~1,200             |
| 口      | Mouth       | ~1,100             |

> **Note:** The top 10 radicals account for ~34% of all CJK characters in Unicode.

### 2.3 Characters (汉字)

| Metric                     | Value                   |
| -------------------------- | ----------------------- |
| General literacy           | ~3,500–4,000 characters |
| Frequently used vocabulary | ~2,000–3,000 characters |
| Unicode (v17.0)            | 102,998 characters      |

**Simplified vs. Traditional:**

- **Simplified characters:** Mainland China, Singapore
- **Traditional characters:** Taiwan, Hong Kong, Macau

> Characters are **logographs** — they represent morphemes, not sounds directly.

### 2.4 Words (词汇)

- Modern Chinese vocabulary is **~80% disyllabic** (two-character words)
- Words formed from 1–4+ characters; most common is 2
- Single-character words tend to be function words or basic nouns/verbs

**Compounding patterns:**

| Pattern                  | Description                       | Example                                   |
| ------------------------ | --------------------------------- | ----------------------------------------- |
| 并列 (coordinate)        | Two synonyms or related morphemes | 朋友 (péngyou, friend)                    |
| 偏正 (modifier-head)     | Modifier + head noun              | 飞机 (fēijī, airplane — "fly machine")    |
| 动宾 (verb-object)       | Verb + object                     | 开车 (kāichē, drive — "open car")         |
| 主谓 (subject-predicate) | Subject + predicate               | 地震 (dìzhèn, earthquake — "earth shake") |

---

## 3. Character Classification

| Type                         | %       | Examples                                          | Description                            |
| ---------------------------- | ------- | ------------------------------------------------- | -------------------------------------- |
| Pictographs (象形字)         | ~5%     | 日 (sun), 月 (moon), 山 (mountain)                | Stylized pictures of objects           |
| Simple ideographs (指事字)   | Rare    | 上 (up), 下 (down), 一 (one)                      | Abstract concepts indicated by symbols |
| Compound ideographs (会意字) | ~3%     | 休 (rest: person + tree), 明 (bright: sun + moon) | Meaning combinations from components   |
| Phono-semantic (形声字)      | ~80–82% | 河 (river: 氵 water + 可 phonetic), 湖 (lake)     | Semantic radical + phonetic component  |

> **Key insight:** ~80%+ of characters are **phono-semantic compounds** — containing a meaning hint (radical) and a pronunciation hint (phonetic component). This directly informs the **Character Decomposition Viewer** and **Radical Explorer** features.

---

## 4. Phonetics & Pronunciation

### 4.1 Pinyin System

- Designed 1950s by Zhou Youguang et al., officially adopted 1958
- ISO standard since 1982, UN standard since 1986
- ~400 distinct syllables (ignoring tone); ~1,300 with tone
- Uses diacritics for tones (ā, á, ǎ, à)

### 4.2 Initials & Finals

**Initials (声母) — 21 total:**

| Group       | Initials      |
| ----------- | ------------- |
| Bilabial    | b, p, m       |
| Labiodental | f             |
| Alveolar    | d, t, n, l    |
| Velar       | g, k, h       |
| Palatal     | j, q, x       |
| Retroflex   | zh, ch, sh, r |
| Dental      | z, c, s       |

**Finals (韵母) — ~38 total:**

| Type           | Examples                                  |
| -------------- | ----------------------------------------- |
| Simple         | a, o, e, i, u, ü                          |
| Complex        | ai, ei, ao, ou, an, en, ang, eng, ong, er |
| With i- medial | ia, ian, iang, iao, ie, in, ing, iong, iu |
| With u- medial | ua, uai, uan, uang, ui, un, uo            |
| With ü- medial | üe, üan, ün                               |

**Syllable structure:** `(C)(G)V(X)` — optional initial consonant, optional glide medial, mandatory vowel nucleus, optional coda (-n, -ng, -r)

### 4.3 Tones & Tone Sandhi

| Tone    | Name              |   Chao Value    | Pinyin | Example                   |
| ------- | ----------------- | :-------------: | :----: | ------------------------- |
| 1st     | 阴平 (yīnpíng)    | 55 (high level) |   ā    | mā 妈 (mother)            |
| 2nd     | 阳平 (yángpíng)   |   35 (rising)   |   á    | má 麻 (hemp)              |
| 3rd     | 上声 (shǎngshēng) |  214 (dipping)  |   ǎ    | mǎ 马 (horse)             |
| 4th     | 去声 (qùshēng)    |  51 (falling)   |   à    | mà 骂 (scold)             |
| Neutral | 轻声 (qīngshēng)  |     varies      | (none) | ma 吗 (question particle) |

**Tone Sandhi Rules:**

| Rule      | Condition                 | Change            | Example                    |
| --------- | ------------------------- | ----------------- | -------------------------- |
| 3-3 → 2-3 | Two consecutive 3rd tones | First becomes 2nd | 你好 nǐ hǎo → **ní hǎo**   |
| 不 (bù)   | Before 4th tone           | Becomes 2nd (bú)  | 不是 bù shì → **bú shì**   |
| 一 (yī)   | Before 4th tone           | Becomes 2nd (yí)  | 一个 yī gè → **yí gè**     |
| 一 (yī)   | Before 1st/2nd/3rd        | Becomes 4th (yì)  | 一天 yī tiān → **yì tiān** |
| 一 (yī)   | Final or ordinal          | Remains 1st (yī)  | 第一 dì-yī                 |

> ~15-20% of syllables in writing are unstressed (neutral tone).

---

## 5. Vocabulary & Progression

### 5.1 HSK System

**HSK 2.0 (2010–2021) — current widely-used standard:**

| Level |  Vocabulary  | Characters | CEFR Equivalent |
| ----- | :----------: | :--------: | :-------------: |
| HSK 1 |  150 words   |    ~150    |       A1        |
| HSK 2 |  300 words   |    ~300    |      A1–A2      |
| HSK 3 |  600 words   |    ~600    |      A2–B1      |
| HSK 4 | 1,200 words  |   ~1,000   |      B1–B2      |
| HSK 5 | 2,500 words  |   ~1,700   |      B2–C1      |
| HSK 6 | 5,000+ words |   ~2,600   |      C1–C2      |

**HSK 3.0 (2025 — new standard):** 3 tiers, 9 levels

| Tier         | Levels |         Words         |
| ------------ | ------ | :-------------------: |
| Elementary   | 1–3    |  500 → 1,272 → 2,245  |
| Intermediate | 4–6    | 3,245 → 4,316 → 5,456 |
| Advanced     | 7–9    |     11,000+ total     |

> Speaking tests are mandatory from Level 3 onward in HSK 3.0.

### 5.2 Character Frequency & Coverage

| Character Count |       Coverage       | Literacy Level            |
| :-------------: | :------------------: | ------------------------- |
|      ~500       | ~80% of modern texts | Basic functional literacy |
|     ~1,000      | ~90% of modern texts | Simple text reading       |
|     ~2,400      | ~99% of modern texts | Newspaper reading (~98%)  |
|     3,500+      |    Full coverage     | Complete literacy         |

---

## 6. Chengyu (Idioms)

### 6.1 Definition & Structure

**Chengyu** (成语) are traditional Chinese idiomatic expressions, typically **4 characters** long, derived from classical Chinese literature (文言文).

- ~5,000 in common use
- Dictionaries list up to 20,000
- Follow Literary Chinese syntax and vocabulary

**Structural patterns:**

| Pattern           | Chinese | Example  | Translation                       |
| ----------------- | ------- | -------- | --------------------------------- |
| Parallel          | 并列    | 光明正大 | Open and upright                  |
| Subject-predicate | 主谓    | 叶公好龙 | Lord Ye's love of dragons         |
| Verb-object       | 动宾    | 守株待兔 | Guard the stump, wait for rabbits |
| Modifier-head     | 偏正    | 不速之客 | Uninvited guest                   |

### 6.2 Examples

| Chengyu  | Pinyin          | Literal Meaning          | Figurative Meaning    |
| -------- | --------------- | ------------------------ | --------------------- |
| 破釜沉舟 | pò fǔ chén zhōu | Break pots, sink ships   | Burning one's bridges |
| 画蛇添足 | huà shé tiān zú | Draw a snake, add feet   | Gilding the lily      |
| 瓜田李下 | guā tián lǐ xià | Melon field, under plums | Avoiding suspicion    |

### 6.3 Related Forms

| Form   | Chinese    | Description                  |
| ------ | ---------- | ---------------------------- |
| 惯用语 | guànyòngyǔ | Colloquial fixed expressions |
| 歇后语 | xiēhòuyǔ   | Two-part allegorical sayings |
| 谚语   | yànyǔ      | Proverbs                     |

---

## 7. Grammar Essentials

| Feature                       | Description                                                               | Example                                                        |
| ----------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **SVO word order**            | Subject-Verb-Object                                                       | 我打人 (wǒ dǎ rén) — "I hit person"                            |
| **Topic-prominent**           | Old info first, new info last                                             | 这本书我看过 (zhè běn shū wǒ kànguò) — "This book, I've read"  |
| **No inflection**             | No tense, number, or gender marking                                       | 吃 (chī) = eat / eats / ate / eating                           |
| **Aspect particles**          | 了 (perfective), 着 (ongoing), 过 (experiential), 正在 (in progress)      | 吃了 (ate), 吃着 (eating), 吃过 (have eaten)                   |
| **Measure words**             | Required with numerals; 个 (gè) is the general classifier                 | 一个人 (yī gè rén), 一本书 (yī běn shū)                        |
| **的/地/得**                  | 的 (possessive/modifier), 地 (adverb marker), 得 (resultative complement) | 我的书 (my book), 慢慢地走 (walk slowly), 做得很好 (done well) |
| **Question formation**        | 吗 (ma) particle or A-not-A construction                                  | 你好吗? / 你吃不吃?                                            |
| **Serial verb constructions** | Multiple verbs in sequence                                                | 我去买东西 (wǒ qù mǎi dōngxi) — "I go buy things"              |
| **Pro-drop**                  | Subject often omitted when inferable                                      | (我) 来了 — "(I) came"                                         |

---

## 8. Learning Pathways & Difficulty Points

### Typical Learning Order

1. Tones & Pinyin
2. Basic radicals
3. Simple characters (pictographs)
4. High-frequency words
5. Sentence patterns
6. Passages
7. Chengyu & classical Chinese

### Common Difficulty Points (for English Speakers)

|  #  | Difficulty                 | Description                                        |
| :-: | -------------------------- | -------------------------------------------------- |
|  1  | **Tones**                  | Distinguishing and producing the 4 tones correctly |
|  2  | **Character memorization** | Thousands of distinct glyphs (no alphabet)         |
|  3  | **Measure words**          | Dozens of classifiers with no English equivalent   |
|  4  | **Chengyu**                | Require classical Chinese knowledge                |
|  5  | **Homophones**             | Many characters share the same pinyin + tone       |
|  6  | **Stroke order**           | Rigid rules, not intuitive for beginners           |

> **SRS (Spaced Repetition Systems):** Highly effective for character/word retention — used by dominant apps (Anki, Pleco, Skritter).

---

## 9. Design Implications

Key takeaways for the mandarin-vite-react-ts app:

|  #  | Feature                            | Rationale                                                                                                       |
| :-: | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
|  1  | **Radical Explorer**               | ~80% of characters are phono-semantic compounds — a radical browser helps learners decode unfamiliar characters |
|  2  | **Character Decomposition Viewer** | Show stroke order, radical, and phonetic components for each character                                          |
|  3  | **HSK-aligned curriculum**         | Structure content around HSK 2.0 or 3.0 levels                                                                  |
|  4  | **Tone Practice**                  | Dedicated tone recognition and production exercises                                                             |
|  5  | **Chengyu Narrative Reader**       | Story-based chengyu learning with etymology context                                                             |
|  6  | **Stroke Order Animations**        | Visual guides for proper writing                                                                                |
|  7  | **SRS-based Review**               | Spaced repetition for character/word retention                                                                  |
|  8  | **Character-to-Word bridging**     | Show words that use each learned character                                                                      |
|  9  | **Progressive disclosure**         | Start with tones/pinyin, then basic characters, build up to compound words and sentences                        |

---

## 10. References

- Wikipedia: Chinese characters, Pinyin, Standard Chinese phonology, Chengyu, Hanyu Shuiping Kaoshi (HSK), Chinese grammar, Chinese character strokes, Kangxi radicals
- Unicode Standard, Version 17.0
- Kangxi Dictionary radical system (1716)
- Shuowen Jiezi (c. 100 CE)
- PRC national standard for stroke categories
