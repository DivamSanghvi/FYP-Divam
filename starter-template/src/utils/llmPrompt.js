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
8. POSITION CONDITIONS: If user mentions "don't already have a position" or similar, ALWAYS use binary expression with position_size() function - NEVER generate incomplete funcCall

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
5. expr.kind must be "binary" for condition nodes (ALWAYS need "kind", "op", "left", "right")
6. Function names in funcCall must be from the function catalog
7. actionType must be from the action list

## HANDLING POSITION CONDITIONS:
Position conditions check whether we already have an open position. These are ALWAYS expressed as binary comparisons using position_size().

RULE: When user says "only if..." "but don't already have..." "if we don't have..." → They mean position condition.

Examples of position condition phrases:
- "but don't already have a long position" → position_size("SYMBOL") == 0
- "only if we don't have an open position" → position_size("SYMBOL") == 0
- "if we have a long position" → position_size("SYMBOL") > 0
- "close any open position" → Check: position_size("SYMBOL") != 0

CORRECT format for position conditions (ALWAYS binary, ALWAYS with position_size function):
- Check no position: 
  { "kind": "binary", "op": "==", "left": { "kind": "funcCall", "name": "position_size", "args": [{ "kind": "stringLiteral", "value": "AAPL" }] }, "right": { "kind": "numberLiteral", "value": 0 } }
- Check has position: 
  { "kind": "binary", "op": ">", "left": { "kind": "funcCall", "name": "position_size", "args": [{ "kind": "stringLiteral", "value": "AAPL" }] }, "right": { "kind": "numberLiteral", "value": 0 } }

CRITICAL: For position conditions, the expr MUST ALWAYS have:
- "kind": "binary"
- "op": one of "==", ">", "<", "!=", ">=", "<="
- "left": a funcCall to position_size()
- "right": a numberLiteral

NEVER generate incomplete funcCall like { "kind": "funcCall" } with no name.
ALWAYS use full binary expression: { "kind": "binary", "op": "==", "left": {...}, "right": {...} }

## CRITICAL: qty MUST ALWAYS BE A NUMBER
- For ENTER_LONG/ENTER_SHORT: qty is the quantity or percentage of equity (use qty_type: "PERCENT_EQUITY")
- For EXIT_LONG/EXIT_SHORT: qty is ALWAYS a percentage (1-100) of position_size(symbol)
  - Use qty: 100 for "exit all" or "close position" (DEFAULT if not specified)
  - Use qty: 50 for "exit half"
  - Use qty: 25 for "exit quarter"
- NEVER use strings like "ALL" or "HALF" for qty - ALWAYS use numbers
- If user says "exit position" or "close position", use qty: 100, qty_type: "PERCENT_POSITION"

### EXIT ACTION EXAMPLES:
// Exit entire position (default)
{ "actionType": "EXIT_LONG", "symbol": "AAPL", "qty": 100, "qty_type": "PERCENT_POSITION", "next": null }

// Exit half position
{ "actionType": "EXIT_LONG", "symbol": "AAPL", "qty": 50, "qty_type": "PERCENT_POSITION", "next": null }

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
