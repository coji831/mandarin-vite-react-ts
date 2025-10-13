# Conversation Scaffolder Endpoint

## Endpoint

`GET /conversation?wordId=<wordId>`

## Description

Returns a deterministic `Conversation` object for the given `wordId` using local fixture data. Used for UI development, testing, and CI validation.

## Environment Toggle

Set `CONVERSATION_MODE="scaffold"` in your environment to enable scaffold mode and serve deterministic fixtures.

## Implementation Example (Express)

```js
// local-backend/server.js
// The local-backend mounts the conversation router under /api.
// In scaffold mode the primary endpoint used by the frontend is:
// POST /api/conversation/text/generate
if (process.env.CONVERSATION_MODE === "scaffold") {
  app.use("/api", conversationRouter);
}
```

## Usage

- Enable by setting `CONVERSATION_MODE="scaffold"`
- Call endpoint with desired `wordId`
- Returns deterministic fixture for development/testing
