---
purpose: Prompt templates for HSK-graded reading passage generation via Gemini (Graded Readers passage-generation feature)
status: active
last-verified: 2026-09-03
type: guide
---

# Prompt Templates for AI Passage Generation

> **Graded Readers — passage generation feature.** The templates below are the
> live prompt set used by the HSK-graded passage-generation backend via Gemini.

This document defines the prompt templates used for generating HSK-graded reading passages via Gemini. Each template instructs Gemini to return a structured JSON response with a sentences array.

> **Note:** Placeholders like `{WORD_COUNT}` and `{LEVEL+1}` in the templates below are **reference specifications** — they describe what the code substitutes at runtime via string interpolation (e.g., `getWordCountForLevel(hskLevel)` computes the word count, and `Math.min(hskLevel + 1, 6)` computes the i+1 level). They are not literal template variables used by a templating engine.

## Template Structure

All prompts follow this structure:

1. **System role** — "You are a Chinese language teacher creating a graded reading passage."
2. **Topic + HSK level** — Parameterized topic and target HSK level.
3. **Guidelines** — Vocabulary range, sentence count, grammar complexity.
4. **Output format** — JSON with `{ "sentences": [{ "index": N, "text": "..." }] }`.

## Topic Prompts

### 1. School Life (学校生活)

**HSK 1–2:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: School Life (学校生活)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 5-8 sentences in simplified Chinese characters
- Keep sentences short and grammatically simple
- Include classroom-related vocabulary such as 老师, 学生, 书, 学习, 朋友
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

**HSK 3–4:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: School Life (学校生活)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 6-10 sentences in simplified Chinese characters
- Include academic vocabulary such as 考试, 作业, 教室, 图书馆, 考试
- Use simple compound sentences with 因为…所以…, 虽然…但是…
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

### 2. Daily Routine (日常生活)

**HSK 1–2:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Daily Routine (日常生活)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 5-8 sentences in simplified Chinese characters
- Focus on daily activities: 起床, 吃饭, 上班, 回家, 睡觉
- Use time expressions like 早上, 中午, 晚上
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

**HSK 3–4:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Daily Routine (日常生活)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 6-10 sentences in simplified Chinese characters
- Include work/life balance vocabulary: 加班, 锻炼, 放松, 习惯
- Use time sequencing: 先…然后…, …的时候, 以后
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

### 3. Family (家庭)

**HSK 1–2:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Family (家庭)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 5-8 sentences in simplified Chinese characters
- Focus on family members: 爸爸, 妈妈, 哥哥, 姐姐, 妹妹
- Describe simple family relationships and ages
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

**HSK 3–4:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Family (家庭)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 6-10 sentences in simplified Chinese characters
- Include family dynamics vocabulary: 照顾, 帮助, 一起, 节日
- Describe family traditions or weekend activities together
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

### 4. Weather & Seasons (天气与季节)

**HSK 1–2:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Weather & Seasons (天气与季节)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 5-8 sentences in simplified Chinese characters
- Focus on weather vocabulary: 天气, 晴天, 下雨, 冷, 热
- Describe four seasons: 春天, 夏天, 秋天, 冬天
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

**HSK 3–4:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Weather & Seasons (天气与季节)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 6-10 sentences in simplified Chinese characters
- Include weather effects: 温度, 湿度, 台风, 季节变化
- Describe how weather affects daily life and activities
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

### 5. Shopping & Food (购物与食物)

**HSK 1–2:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Shopping & Food (购物与食物)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 5-8 sentences in simplified Chinese characters
- Focus on food/shopping vocabulary: 买, 吃, 水果, 菜, 商店
- Describe a simple shopping trip or meal
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

**HSK 3–4:**

```
You are a Chinese language teacher creating a graded reading passage.

Topic: Shopping & Food (购物与食物)
Target HSK Level: {LEVEL}

Guidelines:
- Use vocabulary appropriate for HSK {LEVEL} level (approximately {WORD_COUNT} words)
- Write 6-10 sentences in simplified Chinese characters
- Include market vocabulary: 便宜, 贵, 打折, 新鲜, 味道
- Describe comparing prices, ordering food, or cooking
- Include some higher-level vocabulary (HSK {LEVEL+1}) for challenge

Respond ONLY with a valid JSON object in this exact format:
{
  "sentences": [
    { "index": 0, "text": "First sentence。" },
    { "index": 1, "text": "Second sentence。" }
  ]
}

Do not include any text before or after the JSON object.
```

## Parameter Reference

| Parameter     | HSK 1 | HSK 2 | HSK 3 | HSK 4 | HSK 5 | HSK 6 |
| ------------- | ----- | ----- | ----- | ----- | ----- | ----- |
| WORD_COUNT    | 30    | 50    | 80    | 120   | 150   | 200   |
| Sentences     | 5-8   | 5-8   | 6-10  | 6-10  | 8-12  | 8-12  |
| Level+1 vocab | HSK 2 | HSK 3 | HSK 4 | HSK 5 | HSK 6 | HSK 6 |

## Error Recovery

If Gemini returns invalid JSON or an empty response:

1. Re-prompt up to 2 times with the same parameters
2. If still failing, fall back to a predefined simple passage at the target HSK level
3. Log all failures for monitoring

## Backend Integration

The prompt is built dynamically by `ReadersService.buildPrompt(topic, hskLevel)` which:

1. Selects the topic template
2. Injects `{LEVEL}` and `{WORD_COUNT}` parameters
3. Sends the complete prompt to `GeminiService.generateRaw()`
4. Parses the JSON response and validates the structure
