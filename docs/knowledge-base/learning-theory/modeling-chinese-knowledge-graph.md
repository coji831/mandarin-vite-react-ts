# Modeling Chinese as a Knowledge Graph

**Category:** Learning Theory  
**Last Updated:** June 26, 2026  
**Status:** Visionary — not yet implemented. Provides architectural rationale for future decisions.

---

## Why

Chinese characters do not exist in isolation — they form a dense web of structural, phonetic, and semantic relationships. A single character can be a component of another character (马 in 妈), a root word, an antonym to a third word, or a semantic echo of a fourth. Traditional relational databases struggle to express and query these relationships efficiently — recursive JOINs for "all characters containing this radical" become expensive at scale.

A graph database models Chinese as it actually exists: a network of nodes connected by typed edges. This unlocks features that standard dictionary platforms cannot match.

---

## Use Case

- **Radical exploration**: "Show me all characters containing the radical 氵, grouped by stroke count, with word examples for each."
- **Dynamic context generation**: "The user struggled with 好 — find other words they already know that share the same radical as 好."
- **Semantic search**: "Find chengyu idioms related to 'perseverance' without an exact keyword match."
- **Personalized content**: "This article matches the user's known vocabulary at 92% and introduces only 4 new characters."

---

## Key Concepts

### Graph Model Overview

```mermaid
graph TD
    R1[(:Radical {glyph: '氵'})] -->|CONTAINS_RADICAL| C1[(:Character {glyph: '没'})]
    R1 -->|CONTAINS_RADICAL| C2[(:Character {glyph: '洗'})]
    C1 -->|COMPOSED_OF {sequence: 1}| W1[(:Word {text: '没有'})]
    C2 -->|COMPOSED_OF {sequence: 1}| W2[(:Word {text: '洗手'})]
    W1 -.->|SYNONYM_OF| W2
    W1 -.->|USED_IN_PATTERN| G1[(:GrammarPattern {name: '没...'})]
```

### Node Types

| Node Type           | Example             | Description                                                                               |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `(:Radical)`        | 氵, 忄, 辶          | Kangxi radical (214 total). Some are also characters (水), some are pure components (辶). |
| `(:Character)`      | 没, 好, 了          | Single hanzi glyph. The decomposition layer.                                              |
| `(:Word)`           | 没有, 爱好, 图书馆  | Vocabulary entry of any length (1-6+ characters).                                         |
| `(:GrammarPattern)` | 把, 被, 了 (aspect) | Syntactic rule or pattern.                                                                |
| `(:Chengyu)`        | 掩耳盗铃            | 4-character idiom with origin story and theme.                                            |

### Edge Types

| Edge Type          | Source → Target             | Cardinality         | Purpose                                                  |
| ------------------ | --------------------------- | ------------------- | -------------------------------------------------------- |
| `CONTAINS_RADICAL` | Character → Radical         | M:N                 | Which radicals decompose a character (怕 → 忄 + 白)      |
| `COMPOSED_OF`      | Word → Character            | M:N (with sequence) | Which characters compose a word, in order                |
| `SYNONYM_OF`       | Word ↔ Word                 | M:N                 | Synonyms for vocabulary network                          |
| `ANTONYM_OF`       | Word ↔ Word                 | M:N                 | Antonyms for vocabulary network                          |
| `MEASURE_WORD_FOR` | Word ↔ Word                 | M:N                 | Chinese counters (张 for 纸, 把 for 椅子)                |
| `USED_IN_PATTERN`  | Word → GrammarPattern       | M:N                 | Which words are keywords for a grammar pattern           |
| `HOMONYM_OF`       | Character ↔ Character       | M:N                 | Same pronunciation, different glyph (是↔事↔市)           |
| `PHONETIC_SHARE`   | Character → PhoneticCluster | M:N                 | Characters sharing a sound component (青 family: 请情清) |

### How Graph Queries Enable New Features

**Infinite Radical Trees (Phase 3):**

Instead of recursive SQL JOINs to find all words related to a radical, a graph query traverses outward in milliseconds:

```cypher
MATCH (r:Radical {glyph: "氵"})<-[:CONTAINS_RADICAL]-(c:Character)<-[:COMPOSED_OF]-(w:Word)
RETURN c.glyph, w.text
```

**Dynamic Context Generation:**

When a user struggles with a character, the system finds other characters the user already knows that share the same radical:

```cypher
MATCH (c:Character {glyph: "好"})-[:CONTAINS_RADICAL]->(r:Radical)<-[:CONTAINS_RADICAL]-(known:Character)
WHERE known IN user.knownCharacters
RETURN known.glyph, r.glyph
```

**AI-Powered Semantic Search (Vector Layer - Future):**

With vector embeddings stored on nodes, a user query like "How do I say 'raining cats and dogs' in Chinese?" matches 倾盆大雨 by semantic proximity, not keyword overlap.

### Why Relational Databases Fall Short

| Query                                          | Relational Approach                      | Graph Approach                                                                                  |
| ---------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| "All characters containing 氵"                 | Recursive JOIN on CharacterRadical table | Direct traversal: `(:Radical)<-[:CONTAINS_RADICAL]-(:Character)`                                |
| "Words similar to 好 the user already knows"   | Multiple JOINs + aggregations            | Pattern match: `(:Character)-[:CONTAINS_RADICAL]->(:Radical)<-[:CONTAINS_RADICAL]-(:Character)` |
| "Grammar patterns using 把 with example words" | 3+ table JOIN                            | Single edge hop: `(:Word)-[:USED_IN_PATTERN]->(:GrammarPattern)`                                |

---

## DO/DON'T Examples

### DO: Model relationships as edges, not foreign keys in content JSON

```json
// GOOD — relationships are in the graph/DB, not in content files
// content/characters/ch_0342.json only has attributes:
{
  "id": "ch_0342",
  "glyph": "没",
  "stroke_count": 7,
  "readings": [
    { "pinyin": "méi", "tone": 2 },
    { "pinyin": "mò", "tone": 4 }
  ]
}
// Which words contain 没 → stored as edges in the graph
```

### DON'T: Store relationships inside content JSON files

```json
// BAD — blurs the line between attributes and relationships
{
  "id": "ch_0342",
  "glyph": "没",
  "words": ["没有", "没错", "没关系"] // WRONG: this is a relationship, not an attribute
}
```

### DO: Start with relational junction tables, plan graph migration

```prisma
// GOOD — junction tables express the same relationships as graph edges
model CharacterRadical {
  characterId String
  radicalId   String
  // This maps naturally to: (:Character)-[:CONTAINS_RADICAL]->(:Radical)
}
```

### DON'T: Over-engineer for graph before the use case is proven

```
// BAD — don't spin up Neo4j until you have a concrete query that
// relational JOINs cannot handle at scale
```

---

## Integration with Local-First Architecture

The heavy graph/vector work stays on the server. The client receives flat, indexed data:

1. **Server** runs graph traversals and vector similarity searches
2. **Server** flattens results into simple indexed tables
3. **Client** receives pre-computed content packs via the Content Registry
4. **Client** event logs remain lightweight — events reference content IDs only

This means graph and vector features do not break offline support or increase client complexity.

---

## Cross-References

- [Character Structure](../learning-theory/chinese-character-structure.md) — Linguistic background on radical decomposition
- [Local-First CQRS for Language Learning](../infrastructure/local-first-cqrs-language-learning.md) — How graph results are flattened for the client cache
- [Character-Level SRS with Reading Context](../backend/character-level-srs-reading-context.md) — How the graph informs SRS review context
- [Pre-Adaptation Static/Dynamic Separation](../backend/pre-adaptation-static-dynamic-separation.md) — Content ID conventions that graph nodes would adopt
