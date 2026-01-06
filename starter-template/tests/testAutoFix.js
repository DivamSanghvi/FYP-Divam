// Test script to verify auto-fix for incomplete funcCall expressions
import { validateStrategy } from "../src/utils/strategyValidator.js"

// Test case 1: Incomplete funcCall (like the error case)
const graphWithIncompleteFunc = {
  symbol: "AAPL",
  entryNode: "cond1",
  nodes: [
    {
      id: "cond1",
      type: "condition",
      expr: {
        kind: "binary",
        op: "<",
        left: {
          kind: "funcCall",
          name: "rsi",
          args: [
            { kind: "identifier", name: "close" },
            { kind: "numberLiteral", value: 14 }
          ]
        },
        right: { kind: "numberLiteral", value: 30 }
      },
      nextIfTrue: "actEnter",
      nextIfFalse: "actNoTrade"
    },
    {
      id: "cond2",
      type: "condition",
      expr: {
        kind: "binary",
        op: ">",
        left: {
          kind: "funcCall",
          name: "rsi",
          args: [
            { kind: "identifier", name: "close" },
            { kind: "numberLiteral", value: 14 }
          ]
        },
        right: { kind: "numberLiteral", value: 70 }
      },
      nextIfTrue: "actExit",
      nextIfFalse: "actNoTrade"
    },
    {
      id: "cond3",
      type: "condition",
      expr: {
        kind: "funcCall"  // INCOMPLETE - missing name and args
      },
      nextIfTrue: "actNoTrade",
      nextIfFalse: "actNoTrade"
    },
    {
      id: "actEnter",
      type: "action",
      actionType: "ENTER_LONG",
      symbol: "AAPL",
      qty: 10,
      qty_type: "PERCENT_EQUITY",
      params: {},
      next: null
    },
    {
      id: "actExit",
      type: "action",
      actionType: "EXIT_LONG",
      symbol: "AAPL",
      qty: 100,
      qty_type: "PERCENT_POSITION",
      params: {},
      next: null
    },
    {
      id: "actNoTrade",
      type: "action",
      actionType: "NO_ACTION",
      params: {},
      next: null
    }
  ]
}

// Test validation
const validation = validateStrategy(graphWithIncompleteFunc, "1H")

console.log("=== VALIDATION RESULT ===")
console.log("Is Valid:", validation.isValid)
console.log("Errors:", validation.errors)
console.log("Warnings:", validation.warnings)
console.log("")

if (validation.isValid) {
  console.log("✓ Validation PASSED - Graph is valid")
} else {
  console.log("✗ Validation FAILED - Graph has errors")
  console.log("\nError Details:")
  validation.errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. ${err}`)
  })
}

// Test case 2: Correct position_size condition
const graphWithPositionCondition = {
  symbol: "AAPL",
  entryNode: "cond1",
  nodes: [
    {
      id: "cond1",
      type: "condition",
      expr: {
        kind: "binary",
        op: "<",
        left: {
          kind: "funcCall",
          name: "rsi",
          args: [
            { kind: "identifier", name: "close" },
            { kind: "numberLiteral", value: 14 }
          ]
        },
        right: { kind: "numberLiteral", value: 30 }
      },
      nextIfTrue: "cond2",
      nextIfFalse: "actNoTrade"
    },
    {
      id: "cond2",
      type: "condition",
      expr: {
        kind: "binary",
        op: "==",
        left: {
          kind: "funcCall",
          name: "position_size",
          args: [
            { kind: "stringLiteral", value: "AAPL" }
          ]
        },
        right: { kind: "numberLiteral", value: 0 }
      },
      nextIfTrue: "actEnter",
      nextIfFalse: "actNoTrade"
    },
    {
      id: "actEnter",
      type: "action",
      actionType: "ENTER_LONG",
      symbol: "AAPL",
      qty: 10,
      qty_type: "PERCENT_EQUITY",
      params: {},
      next: null
    },
    {
      id: "actNoTrade",
      type: "action",
      actionType: "NO_ACTION",
      params: {},
      next: null
    }
  ]
}

const validation2 = validateStrategy(graphWithPositionCondition, "1H")

console.log("\n=== POSITION_SIZE CONDITION TEST ===")
console.log("Is Valid:", validation2.isValid)
console.log("Errors:", validation2.errors)
console.log("")

if (validation2.isValid) {
  console.log("✓ Position condition validation PASSED")
} else {
  console.log("✗ Position condition validation FAILED")
  console.log("\nError Details:")
  validation2.errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. ${err}`)
  })
}
