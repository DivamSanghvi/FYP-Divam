// LLM Prompt Generator - Dynamically uses prompt.json DSL specification
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load DSL specification from prompt.json
let DSL_SPEC = null

export const loadDSLSpec = () => {
  if (!DSL_SPEC) {
    const specPath = join(__dirname, "prompt.json")
    const rawSpec = readFileSync(specPath, "utf-8")
    DSL_SPEC = JSON.parse(rawSpec).dsl_spec
  }
  return DSL_SPEC
}

// Get the DSL spec (lazy loaded)
export const getDSLSpec = () => {
  return loadDSLSpec()
}

// Generate function documentation from spec
const generateFunctionDocs = (spec) => {
  const categories = {}
  
  spec.functions.forEach(fn => {
    if (!categories[fn.category]) {
      categories[fn.category] = []
    }
    
    const argsList = fn.args.map(arg => {
      let argStr = `${arg.name}: ${arg.type}`
      if (arg.allowed_values) {
        argStr += ` [${arg.allowed_values.join("|")}]`
      }
      if (arg.min !== undefined || arg.max !== undefined) {
        argStr += ` (${arg.min || 0}-${arg.max || "∞"})`
      }
      if (arg.default !== undefined) {
        argStr += ` default=${arg.default}`
      }
      return argStr
    }).join(", ")
    
    categories[fn.category].push({
      name: fn.name,
      args: argsList,
      returns: fn.return_type,
      description: fn.description
    })
  })
  
  let docs = ""
  for (const [category, funcs] of Object.entries(categories)) {
    docs += `\n### ${category.toUpperCase()} FUNCTIONS:\n`
    funcs.forEach(fn => {
      docs += `- ${fn.name}(${fn.args}) → ${fn.returns}\n  ${fn.description}\n`
    })
  }
  return docs
}

// Generate action documentation from spec
const generateActionDocs = (spec) => {
  let docs = "\n### SUPPORTED ACTIONS:\n"
  
  spec.actions.forEach(action => {
    const argsList = action.args.map(arg => {
      let argStr = `${arg.name}: ${arg.type}`
      if (arg.allowed_values) {
        argStr += ` [${arg.allowed_values.join("|")}]`
      }
      if (arg.default !== undefined) {
        argStr += ` default=${arg.default}`
      }
      return argStr
    }).join(", ")
    
    docs += `- ${action.name}(${argsList})\n  ${action.description}\n`
  })
  
  return docs
}

// Generate operators documentation
const generateOperatorDocs = (spec) => {
  return `
### OPERATORS:
- Arithmetic: ${spec.operators.arithmetic.join(", ")}
- Comparison: ${spec.operators.comparison.join(", ")}

### OFFSETS (for time-series lookback):
- Units: ${spec.offsets.units.join(", ")}
- Syntax: Use "offset" field with {unit: "bars|days|...", value: N}
- Example: {"func": "rsi", "args": ["close", 14], "offset": {"unit": "bars", "value": 1}}
`
}

// Main system prompt generator
export const getLLMSystemPrompt = () => {
  const spec = loadDSLSpec()
  
  return `You are an expert algorithmic trading strategy interpreter. Your job is to convert natural language trading strategies into a structured graph representation.

## CRITICAL CONSTRAINTS - READ CAREFULLY:
1. You MUST ONLY use functions and actions from the DSL SPECIFICATION below
2. Do NOT invent or use any function/action not listed in the spec
3. Each condition node must contain EXACTLY ONE comparison (left op right)
4. Do NOT use AND/OR inside expr. To express "A AND B", create two condition nodes and connect with nextIfTrue
5. Every path in the graph MUST terminate in an action node
6. Return ONLY valid JSON, no markdown code fences, no explanation text
7. Financial accuracy is critical - these strategies will be used by real traders

## DSL SPECIFICATION v${spec.version}:
${spec.description}

### DATA TYPES:
${spec.types.join(", ")}

${generateOperatorDocs(spec)}

${generateFunctionDocs(spec)}

${generateActionDocs(spec)}

## OUTPUT FORMAT - STRICTLY FOLLOW THIS STRUCTURE:

### Top-level Response:
{
  "symbol": "AAPL",              // Primary trading symbol
  "entryNode": "cond1",          // ID of first node to evaluate
  "nodes": [ ... ],              // Array of condition and action nodes
  "warnings": [ ... ],           // Optional warnings about strategy
  "suggestedEdits": [ ... ]      // Optional improvement suggestions
}

### Condition Node Format:
{
  "id": "cond1",
  "type": "condition",
  "expr": {
    "kind": "binary",
    "op": "<",
    "left": {
      "kind": "funcCall",
      "name": "rsi",
      "args": [
        { "kind": "identifier", "name": "close" },
        { "kind": "numberLiteral", "value": 14 }
      ]
    },
    "right": { "kind": "numberLiteral", "value": 30 }
  },
  "nextIfTrue": "cond2",
  "nextIfFalse": "actNoTrade"
}

### Action Node Format:
{
  "id": "actBuy1",
  "type": "action",
  "actionType": "ENTER_LONG",
  "symbol": "AAPL",
  "qty": 10,
  "qty_type": "PERCENT_EQUITY",
  "params": {},
  "next": null
}

### Expression Object Kinds:
- numberLiteral: { "kind": "numberLiteral", "value": 30 }
- stringLiteral: { "kind": "stringLiteral", "value": "09:30" }
- identifier:    { "kind": "identifier", "name": "close" }
- funcCall:      { "kind": "funcCall", "name": "rsi", "args": [...] }

### With Offset (for lookback):
{
  "kind": "funcCall",
  "name": "rsi",
  "args": [
    { "kind": "identifier", "name": "close" },
    { "kind": "numberLiteral", "value": 14 }
  ],
  "offset": { "unit": "bars", "value": 1 }
}

## CRITICAL: EXPRESSING AND/OR LOGIC

DO NOT use "AND" or "OR" operators inside expr. Instead, chain condition nodes:

### For "RSI < 30 AND price > EMA(20)":
1. cond1: RSI < 30 → nextIfTrue: "cond2", nextIfFalse: "actNoTrade"
2. cond2: price > EMA(20) → nextIfTrue: "actBuy", nextIfFalse: "actNoTrade"

### For "RSI > 70 OR price < EMA(20)":
1. cond1: RSI > 70 → nextIfTrue: "actSell", nextIfFalse: "cond2"
2. cond2: price < EMA(20) → nextIfTrue: "actSell", nextIfFalse: "actNoTrade"

## VALIDATION RULES:
1. All node IDs must be unique
2. All nextIfTrue, nextIfFalse, next must reference existing node IDs or be null
3. Entry node must exist in nodes array
4. All branches must terminate in an action node
5. expr.kind must be "binary" for condition nodes
6. Function names in funcCall must be from the function catalog
7. actionType must be from the action list

## WARNINGS TO INCLUDE:
- Missing stop-loss protection
- No exit conditions defined  
- Unusual indicator parameters
- Position sizing concerns
- Time-based conditions on daily timeframe may not work as expected

Remember: You are building a trading system for real retail traders. Financial accuracy and safety are paramount.`
}

// Export helpers for validator
export const getValidFunctionNames = () => {
  const spec = loadDSLSpec()
  return spec.functions.map(f => f.name)
}

export const getValidActionNames = () => {
  const spec = loadDSLSpec()
  return spec.actions.map(a => a.name)
}

export const getFunctionSpec = (funcName) => {
  const spec = loadDSLSpec()
  return spec.functions.find(f => f.name === funcName)
}

export const getActionSpec = (actionName) => {
  const spec = loadDSLSpec()
  return spec.actions.find(a => a.name === actionName)
}

export const getValidOperators = () => {
  const spec = loadDSLSpec()
  return {
    arithmetic: spec.operators.arithmetic,
    comparison: spec.operators.comparison,
    all: [...spec.operators.arithmetic, ...spec.operators.comparison]
  }
}

export const getValidOffsetUnits = () => {
  const spec = loadDSLSpec()
  return spec.offsets.units
}
