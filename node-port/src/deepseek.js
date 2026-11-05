'use strict';

const ENDPOINT = process.env.DEEPSEEK_URL || 'https://api.deepseek.com/v1/chat/completions';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Validates the key without spending tokens: an empty `messages` array gives 400 for valid keys, 401 otherwise. */
async function verifyApiKey(apiKey) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages: [] }),
  });
  if (res.status === 400) return true;
  if (res.status === 401) throw new ApiError('Invalid DeepSeek API key', 401);
  throw new ApiError(`DeepSeek returned HTTP ${res.status}`, res.status);
}

/** Sends a prompt and returns the model's message content (a JSON string). */
async function chat({ apiKey, prompt, temperature, maxTokens }) {
  if (!apiKey) throw new ApiError('DeepSeek API key is not set (Settings tab)', 400);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful and high experience system engineer' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (res.status === 401) throw new ApiError('Invalid DeepSeek API key', 401);
  if (!res.ok) throw new ApiError(`DeepSeek returned HTTP ${res.status}`, res.status);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ApiError('Unexpected DeepSeek response', 502);
  return content;
}

/** Parses model output, tolerating ```json fences. */
function parseJsonContent(content) {
  const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function fillTemplate(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), template);
}

const toNode = (n) => ({
  name: String(n.name),
  desc: String(n.desc ?? ''),
  type: 'Item',
  enabled: true,
  items: Array.isArray(n.items) ? n.items.map(toNode) : [],
});

function parseItems(content) {
  const json = parseJsonContent(content);
  if (!Array.isArray(json.items)) throw new Error('Response has no "items" array');
  return json.items.map((i) => ({ name: String(i.name), desc: String(i.desc ?? ''), type: 'Item', enabled: true }));
}

function parseTree(content) {
  const json = parseJsonContent(content);
  const root = json.product || json.reqSpec || json.bom;
  if (!root) throw new Error('Response has no "product"/"reqSpec" root object');
  return [toNode(root)];
}

module.exports = { ApiError, verifyApiKey, chat, fillTemplate, parseItems, parseTree, parseJsonContent };
