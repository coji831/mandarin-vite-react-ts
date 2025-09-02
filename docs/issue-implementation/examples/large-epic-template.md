# Epic <number>: <Epic Name>

## [Required] Technical Overview 🔵

**Implementation Goal:** <Describe the technical objectives and scope of the implementation>

**Status:** <e.g., In Progress, Completed>

**Last Updated:** <Date>

## [Required] Architecture Decisions 🔵

1. <Decision 1 - be specific about technical choices and reasoning>
2. <Decision 2 - include rationale and alternatives considered>

## [Required] Technical Implementation 🔵

### Architecture

<Describe the technical architecture in detail with component relationships, data flows, and implementation patterns>

// Optional: Include simplified architecture diagram in ASCII or code example
Client -> [Component A] -> [Component B] -> Database

### API Endpoints (if applicable)

GET /api/<endpoint>

**Parameters:**

- <param1>: <description>
- <param2>: <description, including data types and validation rules>

**Response:**

- <detailed response structure with example>

### Component Relationships

```
[Auth Flow] → [UserContext] → [Protected Components]
[Data Layer] → [State Management] → [UI Components]
```

## [Required] Implementation Stories Index 🔵

Each story implements a specific aspect of this epic:

1. [Component Name](./story-<epic-num>-1-component-name.md) - Brief description
2. [Service Implementation](./story-<epic-num>-2-service-impl.md) - Brief description
3. [Integration Feature](./story-<epic-num>-3-integration.md) - Brief description

## [Required] Design Decisions & Tradeoffs 🔵

<List important design choices with technical reasoning and alternatives considered>

## [Required] Known Issues & Limitations 🔵

<List specific technical issues, limitations, code smells, or areas for improvement>

## [Optional] Configuration 🟡

### Environment Variables (if applicable)

```
EXAMPLE_API_KEY=your-api-key-here
DATABASE_URL=mongodb://localhost:27017/app
```

### Configuration Files

- config.json: Contains feature toggles and default settings
- vite.config.ts: Updated for proxy settings or build options

## [Optional] Testing Information 🟡

<Overview of testing approach for the entire epic>

## [Optional] References 🟡

- <Link to related technical docs, API references, libraries used>

## [Optional] Lessons Learned & Future Considerations 🟡

- <Technical debt to address>
- <Potential refactoring opportunities>
- <Scalability improvements>
