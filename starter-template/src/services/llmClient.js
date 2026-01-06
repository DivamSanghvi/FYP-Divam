// LLM client wrapper - using OpenAI API with retry logic
import axios from "axios"
import { getLLMSystemPrompt } from "../utils/llmPrompt.js"

const LLM_API_KEY = process.env.LLM_API_KEY
const LLM_MODEL = process.env.LLM_MODEL || "gpt-3.5-turbo"

if (!LLM_API_KEY) {
  console.warn("Warning: LLM_API_KEY environment variable is not set")
}

// Determine API base URL based on provider
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai"
const API_BASE_URL = LLM_PROVIDER === "perplexity" 
  ? "https://api.perplexity.ai" 
  : "https://api.openai.com/v1"

const llmClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${LLM_API_KEY}`,
    "Content-Type": "application/json"
  }
})

// Utility: delay function for retry backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Utility: repair common JSON issues from LLM output
const repairJSON = (jsonStr) => {
  let repaired = jsonStr
  
  // Remove trailing commas before ] or }
  repaired = repaired.replace(/,\s*]/g, "]")
  repaired = repaired.replace(/,\s*}/g, "}")
  
  // Fix single quotes to double quotes (but not inside strings)
  // This is a simple fix - may not work for all edge cases
  repaired = repaired.replace(/'/g, '"')
  
  // Remove comments (// style)
  repaired = repaired.replace(/\/\/[^\n]*/g, "")
  
  // Remove newlines in string values that might break JSON
  repaired = repaired.replace(/\n/g, " ")
  
  // Try to fix unquoted keys (simple cases)
  repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
  
  return repaired
}

// Utility: try parsing JSON with multiple repair attempts
const parseJSONSafe = (jsonStr) => {
  // First try direct parse
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    // Try with repairs
    try {
      const repaired = repairJSON(jsonStr)
      return JSON.parse(repaired)
    } catch (e2) {
      // Try extracting just the object part more aggressively
      const match = jsonStr.match(/\{[\s\S]*\}/s)
      if (match) {
        try {
          return JSON.parse(repairJSON(match[0]))
        } catch (e3) {
          throw new Error(`Failed to parse JSON after repairs: ${e.message}`)
        }
      }
      throw e2
    }
  }
}

// Retry wrapper with exponential backoff for rate limits
const retryWithBackoff = async (fn, maxRetries = 3, baseDelayMs = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const status = error.response?.status
      
      // Only retry on rate limit (429) or server errors (5xx)
      if ((status === 429 || status >= 500) && attempt < maxRetries) {
        const waitTime = baseDelayMs * Math.pow(2, attempt - 1) // Exponential: 2s, 4s, 8s
        console.log(`Rate limited (${status}). Retrying in ${waitTime / 1000}s... (attempt ${attempt}/${maxRetries})`)
        await delay(waitTime)
      } else {
        throw error
      }
    }
  }
}

export const interpretStrategyWithLLM = async (userQuery, symbol, timeframe) => {
  try {
    const userPrompt = `
User Strategy Query: "${userQuery}"

Context:
- Symbol: ${symbol}
- Timeframe: ${timeframe}
- Goal: Convert this natural language strategy into a structured graph of condition and action nodes

Please analyze the user's strategy and return a valid JSON graph structure following the format specified in the system prompt.
If the strategy is ambiguous, make reasonable assumptions for a retail trader and note them in warnings.
`

    const response = await retryWithBackoff(async () => {
      return await llmClient.post("/chat/completions", {
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content: getLLMSystemPrompt()
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    }, 3, 3000) // 3 retries, starting at 3 second delay

    const rawContent = response.data.choices[0].message.content

    // Extract JSON from response (sometimes LLM wraps it in markdown)
    let jsonStr = rawContent
    
    // Remove markdown code fences if present
    jsonStr = jsonStr.replace(/```json\s*/gi, "").replace(/```\s*/g, "")
    
    // Try to extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/s)
    if (!jsonMatch) {
      console.error("Raw LLM response:", rawContent)
      throw new Error("LLM response did not contain valid JSON object")
    }

    // Parse with repair attempts
    const strategyGraph = parseJSONSafe(jsonMatch[0])

    return {
      success: true,
      graph: strategyGraph,
      rawLLMResponse: rawContent,
      model: LLM_MODEL
    }
  } catch (error) {
    console.error("LLM interpretation error:", error.message)
    
    // Log detailed rate limit info if available
    if (error.response?.status === 429) {
      console.error("Rate limit details:", JSON.stringify(error.response?.data, null, 2))
      console.error("Rate limit headers:", {
        "x-ratelimit-limit-requests": error.response?.headers?.["x-ratelimit-limit-requests"],
        "x-ratelimit-limit-tokens": error.response?.headers?.["x-ratelimit-limit-tokens"],
        "x-ratelimit-remaining-requests": error.response?.headers?.["x-ratelimit-remaining-requests"],
        "x-ratelimit-remaining-tokens": error.response?.headers?.["x-ratelimit-remaining-tokens"],
        "x-ratelimit-reset-requests": error.response?.headers?.["x-ratelimit-reset-requests"],
        "x-ratelimit-reset-tokens": error.response?.headers?.["x-ratelimit-reset-tokens"],
      })
    }
    
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      rawError: error
    }
  }
}

export default {
  interpretStrategyWithLLM
}
