import os
import requests
import json

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "openai/gpt-oss-120b:free"

def call_openrouter_structured(system_prompt: str, messages: list, schema: dict) -> dict:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable is not set")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            *messages
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "kanban_reply",
                "schema": schema,
                "strict": True
            }
        }
    }

    response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)

