# Conversation Scaffolder Endpoint

## Endpoint

`GET /conversation?wordId=<wordId>`

## Description

Returns a deterministic `Conversation` object for the given `wordId` using local fixture data. Used for UI development, testing, and CI validation.

## Environment Toggle

Set `USE_CONVERSATION=true` in your environment to enable the endpoint.

## Implementation Example (Express)

```js
// local-backend/server.js
if (process.env.USE_CONVERSATION === "true") {
  app.get("/conversation", (req, res) => {
    const { wordId } = req.query;
    // Load fixture from public/data/examples/conversations/fixtures
    // Example: hello-basic.json
    // Return matching Conversation object
  });
}
```

## Usage

- Enable with `USE_CONVERSATION=true`
- Call endpoint with desired `wordId`
- Returns deterministic fixture for development/testing
