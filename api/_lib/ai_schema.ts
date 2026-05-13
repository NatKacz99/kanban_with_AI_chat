const AI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reply: { type: "string" },
    board: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        columns: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              cardIds: { type: "array", items: { type: "string" } },
            },
            required: ["id", "title", "cardIds"],
          },
        },
        cards: {
          type: "object",
          additionalProperties: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              details: { type: "string" },
            },
            required: ["id", "title", "details"],
          },
        },
      },
      required: ["columns", "cards"],
    },
  },
  required: ["reply", "board"],
};

export default AI_RESPONSE_SCHEMA;