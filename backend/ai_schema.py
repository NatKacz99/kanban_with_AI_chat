AI_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "reply": {"type": "string"},
        "board": {
            "type": ["object", "null"],
            "additionalProperties": False,
            "properties": {
                "columns": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "id": {"type": "string"},
                            "title": {"type": "string"},
                            "cardIds": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        },
                        "required": ["id", "title", "cardIds"]
                    }
                },
                "cards": {
                    "type": "object",
                    "additionalProperties": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "id": {"type": "string"},
                            "title": {"type": "string"},
                            "details": {"type": "string"}
                        },
                        "required": ["id", "title", "details"]
                    }
                }
            },
            "required": ["columns", "cards"]
        }
    },
    "required": ["reply", "board"]
}
