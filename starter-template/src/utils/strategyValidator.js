// Validation engine for trading strategy graphs
// Ensures type safety, financial sanity, and graph connectivity
// Dynamically uses prompt.json DSL specification

import {
  getDSLSpec,
  getValidFunctionNames,
  getValidActionNames,
  getFunctionSpec,
  getActionSpec,
  getValidOperators,
  getValidOffsetUnits
} from "../utils/llmPrompt.js"

class StrategyValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.spec = getDSLSpec()
    this.validFunctions = getValidFunctionNames()
    this.validActions = getValidActionNames()
    this.operators = getValidOperators()
    this.validOffsetUnits = getValidOffsetUnits()
  }

  validate(strategyGraph, timeframe) {
    this.errors = []
    this.warnings = []

    // Check basic structure
    this.validateBasicStructure(strategyGraph)
    if (this.errors.length > 0) return this.getResult()

    // Check node validity
    this.validateNodes(strategyGraph.nodes, timeframe)
    if (this.errors.length > 0) return this.getResult()

    // Check graph connectivity
    this.validateGraphConnectivity(strategyGraph)

    // Check financial constraints
    this.validateFinancialConstraints(strategyGraph, timeframe)

    return this.getResult()
  }

  validateBasicStructure(graph) {
    // New format uses symbol instead of strategyName
    if (!graph.symbol || typeof graph.symbol !== "string") {
      this.errors.push("Missing or invalid symbol")
    }
    if (!graph.entryNode || typeof graph.entryNode !== "string") {
      this.errors.push("Missing or invalid entryNode")
    }
    if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
      this.errors.push("nodes must be a non-empty array")
    }
  }

  validateNodes(nodes, timeframe) {
    const nodeIds = new Set(nodes.map(n => n.id))

    nodes.forEach((node, index) => {
      // Check node ID uniqueness
      const idCount = nodes.filter(n => n.id === node.id).length
      if (idCount > 1) {
        this.errors.push(`Duplicate node ID: ${node.id}`)
      }

      // Check node type
      if (!["condition", "action"].includes(node.type)) {
        this.errors.push(`Node ${node.id}: invalid type '${node.type}', must be 'condition' or 'action'`)
      }

      if (node.type === "condition") {
        this.validateConditionNode(node, nodeIds)
      } else if (node.type === "action") {
        this.validateActionNode(node, nodeIds)
      }
    })
  }

  validateConditionNode(node, nodeIds) {
    const { id, expr, nextIfTrue, nextIfFalse } = node

    // Check expression exists
    if (!expr) {
      this.errors.push(`Condition node ${id}: missing expression`)
      return
    }

    // New format requires kind: "binary"
    if (expr.kind !== "binary") {
      this.errors.push(`Condition node ${id}: expr.kind must be 'binary', got '${expr.kind}'`)
    }

    // Validate expression
    const exprValidation = this.validateBinaryExpression(expr, id)
    this.errors.push(...exprValidation.errors)
    this.warnings.push(...exprValidation.warnings)

    // Check nextIfTrue and nextIfFalse point to valid nodes or are null
    if (nextIfTrue !== null && nextIfTrue !== undefined && !nodeIds.has(nextIfTrue)) {
      this.errors.push(`Condition node ${id}: nextIfTrue points to non-existent node '${nextIfTrue}'`)
    }
    if (nextIfFalse !== null && nextIfFalse !== undefined && !nodeIds.has(nextIfFalse)) {
      this.errors.push(`Condition node ${id}: nextIfFalse points to non-existent node '${nextIfFalse}'`)
    }
  }

  validateBinaryExpression(expr, nodeId) {
    const errors = []
    const warnings = []

    // Check operator
    if (!expr.op) {
      errors.push(`Expression in node ${nodeId}: missing operator`)
      return { errors, warnings }
    }

    const isComparison = this.operators.comparison.includes(expr.op)
    if (!isComparison) {
      errors.push(`Expression in node ${nodeId}: invalid comparison operator '${expr.op}'. Valid: ${this.operators.comparison.join(", ")}`)
      return { errors, warnings }
    }

    // Validate left and right operands
    if (!expr.left) {
      errors.push(`Expression in node ${nodeId}: missing left operand`)
    } else {
      const leftValidation = this.validateExpressionOperand(expr.left, nodeId, "left")
      errors.push(...leftValidation.errors)
      warnings.push(...leftValidation.warnings)
    }

    if (!expr.right) {
      errors.push(`Expression in node ${nodeId}: missing right operand`)
    } else {
      const rightValidation = this.validateExpressionOperand(expr.right, nodeId, "right")
      errors.push(...rightValidation.errors)
      warnings.push(...rightValidation.warnings)
    }

    return { errors, warnings }
  }

  validateExpressionOperand(operand, nodeId, side) {
    const errors = []
    const warnings = []

    if (!operand.kind) {
      errors.push(`Expression ${side} in node ${nodeId}: missing 'kind' field`)
      return { errors, warnings }
    }

    const validKinds = ["numberLiteral", "stringLiteral", "identifier", "funcCall", "boolLiteral"]
    if (!validKinds.includes(operand.kind)) {
      errors.push(`Expression ${side} in node ${nodeId}: invalid kind '${operand.kind}'. Valid: ${validKinds.join(", ")}`)
      return { errors, warnings }
    }

    switch (operand.kind) {
      case "numberLiteral":
        if (typeof operand.value !== "number") {
          errors.push(`Expression ${side} in node ${nodeId}: numberLiteral must have numeric value`)
        }
        break

      case "stringLiteral":
        if (typeof operand.value !== "string") {
          errors.push(`Expression ${side} in node ${nodeId}: stringLiteral must have string value`)
        }
        break

      case "boolLiteral":
        if (typeof operand.value !== "boolean") {
          errors.push(`Expression ${side} in node ${nodeId}: boolLiteral must have boolean value`)
        }
        break

      case "identifier":
        if (!operand.name || typeof operand.name !== "string") {
          errors.push(`Expression ${side} in node ${nodeId}: identifier must have name`)
        }
        // Check if it's a valid price identifier
        const validIdentifiers = ["close", "open", "high", "low", "volume"]
        if (operand.name && !validIdentifiers.includes(operand.name)) {
          warnings.push(`Expression ${side} in node ${nodeId}: identifier '${operand.name}' may not be recognized`)
        }
        break

      case "funcCall":
        if (!operand.name || typeof operand.name !== "string") {
          errors.push(`Expression ${side} in node ${nodeId}: funcCall must have name`)
        } else if (!this.validFunctions.includes(operand.name)) {
          errors.push(`Expression ${side} in node ${nodeId}: unknown function '${operand.name}'. Valid: ${this.validFunctions.join(", ")}`)
        } else {
          // Validate function arguments
          const funcSpec = getFunctionSpec(operand.name)
          const requiredArgs = funcSpec.args.filter(a => a.default === undefined)
          const providedArgs = Array.isArray(operand.args) ? operand.args.length : 0

          if (providedArgs < requiredArgs.length) {
            errors.push(`Function ${operand.name} in node ${nodeId}: requires ${requiredArgs.length} args, got ${providedArgs}`)
          }

          // Recursively validate function arguments
          if (Array.isArray(operand.args)) {
            operand.args.forEach((arg, i) => {
              const argValidation = this.validateExpressionOperand(arg, nodeId, `${side}.args[${i}]`)
              errors.push(...argValidation.errors)
              warnings.push(...argValidation.warnings)
            })
          }
        }
        break
    }

    // Validate offset if present
    if (operand.offset) {
      if (!this.validOffsetUnits.includes(operand.offset.unit)) {
        errors.push(`Offset in node ${nodeId}: invalid unit '${operand.offset.unit}'. Valid: ${this.validOffsetUnits.join(", ")}`)
      }
      if (typeof operand.offset.value !== "number" || operand.offset.value < 0) {
        errors.push(`Offset in node ${nodeId}: value must be non-negative integer`)
      }
    }

    return { errors, warnings }
  }

  validateActionNode(node, nodeIds) {
    const { id, actionType, symbol, qty, qty_type, params, next } = node

    // New format uses actionType directly on node
    if (!actionType) {
      this.errors.push(`Action node ${id}: missing actionType`)
      return
    }

    // Check action type is valid
    if (!this.validActions.includes(actionType)) {
      this.errors.push(`Action node ${id}: unsupported actionType '${actionType}'. Valid: ${this.validActions.join(", ")}`)
      return
    }

    // Validate based on action type
    const actionsRequiringSymbol = ["ENTER_LONG", "ENTER_SHORT", "EXIT_LONG", "EXIT_SHORT", "SET_STOP", "SET_TRAILING_STOP", "SET_TAKE_PROFIT", "CANCEL_ORDERS"]
    const actionsRequiringQty = ["ENTER_LONG", "ENTER_SHORT"]

    if (actionsRequiringSymbol.includes(actionType) && !symbol) {
      this.warnings.push(`Action node ${id}: ${actionType} should have a symbol (will use top-level symbol)`)
    }

    if (actionsRequiringQty.includes(actionType) && qty === undefined) {
      this.errors.push(`Action node ${id}: ${actionType} requires qty`)
    }

    // Validate qty_type if qty is provided
    if (qty !== undefined && qty_type) {
      const validQtyTypes = ["ABSOLUTE", "PERCENT_EQUITY"]
      if (!validQtyTypes.includes(qty_type)) {
        this.errors.push(`Action node ${id}: qty_type must be one of [${validQtyTypes.join(", ")}], got '${qty_type}'`)
      }
    }

    // Validate params for specific action types
    if (actionType === "SET_STOP" && (!params || params.stop_price === undefined)) {
      this.warnings.push(`Action node ${id}: SET_STOP should have params.stop_price`)
    }
    if (actionType === "SET_TRAILING_STOP" && (!params || params.trail_percent === undefined)) {
      this.warnings.push(`Action node ${id}: SET_TRAILING_STOP should have params.trail_percent`)
    }
    if (actionType === "SET_TAKE_PROFIT" && (!params || params.take_profit_price === undefined)) {
      this.warnings.push(`Action node ${id}: SET_TAKE_PROFIT should have params.take_profit_price`)
    }

    // next can be null (terminal) or point to valid node
    if (next !== null && next !== undefined && !nodeIds.has(next)) {
      this.errors.push(`Action node ${id}: next points to non-existent node '${next}'`)
    }
  }

  validateGraphConnectivity(graph) {
    // Check entry node exists
    const entryExists = graph.nodes.some(n => n.id === graph.entryNode)
    if (!entryExists) {
      this.errors.push(`Entry node '${graph.entryNode}' does not exist`)
      return
    }

    // Check all nodes are reachable and all paths terminate
    const visited = new Set()
    const pathStack = []

    const traverse = (nodeId) => {
      if (visited.has(nodeId)) return true // Already validated

      const node = graph.nodes.find(n => n.id === nodeId)
      if (!node) return false

      pathStack.push(nodeId)

      if (node.type === "action") {
        visited.add(nodeId)
        pathStack.pop()
        return true // Terminal node
      }

      if (node.type === "condition") {
        let truePathOk = true
        let falsePathOk = true

        if (node.nextIfTrue) {
          truePathOk = traverse(node.nextIfTrue)
        } else {
          this.warnings.push(`Condition node ${nodeId}: no explicit nextIfTrue (implying NO_TRADE)`)
        }

        if (node.nextIfFalse) {
          falsePathOk = traverse(node.nextIfFalse)
        } else {
          this.warnings.push(`Condition node ${nodeId}: no explicit nextIfFalse (implying NO_TRADE)`)
        }

        visited.add(nodeId)
        pathStack.pop()
        return truePathOk && falsePathOk
      }

      visited.add(nodeId)
      pathStack.pop()
      return true
    }

    traverse(graph.entryNode)
  }

  validateFinancialConstraints(graph, timeframe) {
    // Check for exit conditions if there are entry conditions (new format uses actionType)
    const hasEntry = graph.nodes.some(n => {
      if (n.type !== "action") return false
      return n.actionType?.includes("ENTER")
    })
    
    const hasExit = graph.nodes.some(n => {
      if (n.type !== "action") return false
      return n.actionType?.includes("EXIT") || n.actionType === "SET_STOP" || n.actionType === "SET_TRAILING_STOP"
    })

    if (hasEntry && !hasExit) {
      this.warnings.push("Strategy enters positions but has no explicit exit or stop-loss condition - highly risky")
    }

    // Check for aggressive indicator settings in expressions
    this.checkIndicatorSettings(graph.nodes)

    // Check for high-frequency trading on daily/weekly
    if (["1D", "1W"].includes(timeframe)) {
      const hasIntraday = graph.nodes.some(n => {
        if (!n.expr) return false
        return this.expressionContainsFuncCall(n.expr, ["timeBetween", "timeOfDay", "sessionOpen"])
      })
      if (hasIntraday) {
        this.warnings.push(`Intraday time filters on ${timeframe} timeframe may not work as intended`)
      }
    }
  }

  // Helper to check if expression contains specific function calls (new format)
  expressionContainsFuncCall(expr, funcNames) {
    if (!expr) return false
    // Check in left operand
    if (expr.left?.kind === "funcCall" && funcNames.includes(expr.left.name)) return true
    // Check in right operand
    if (expr.right?.kind === "funcCall" && funcNames.includes(expr.right.name)) return true
    // Recursively check in funcCall args
    if (expr.left?.args) {
      for (const arg of expr.left.args) {
        if (arg.kind === "funcCall" && funcNames.includes(arg.name)) return true
      }
    }
    if (expr.right?.args) {
      for (const arg of expr.right.args) {
        if (arg.kind === "funcCall" && funcNames.includes(arg.name)) return true
      }
    }
    return false
  }

  // Check indicator parameter settings (new format)
  checkIndicatorSettings(nodes) {
    nodes.forEach(node => {
      if (node.expr) {
        this.checkExpressionIndicatorsNew(node.expr, node.id)
      }
    })
  }

  checkExpressionIndicatorsNew(expr, nodeId) {
    if (!expr) return

    const checkFuncCall = (funcCall, side) => {
      if (!funcCall || funcCall.kind !== "funcCall") return
      
      const funcName = funcCall.name
      const args = funcCall.args || []
      
      // Check RSI period
      if (funcName === "rsi" && args.length >= 2 && args[1]?.kind === "numberLiteral") {
        const period = args[1].value
        if (period < 5) this.warnings.push(`RSI period ${period} in node ${nodeId} is unusually short`)
        if (period > 50) this.warnings.push(`RSI period ${period} in node ${nodeId} is unusually long`)
      }
      
      // Check EMA/SMA period
      if (["ema", "sma", "wma"].includes(funcName) && args.length >= 2 && args[1]?.kind === "numberLiteral") {
        const period = args[1].value
        if (period < 2) this.warnings.push(`Moving average period ${period} in node ${nodeId} is too short`)
        if (period > 500) this.warnings.push(`Moving average period ${period} in node ${nodeId} is unusually long`)
      }
    }

    checkFuncCall(expr.left, "left")
    checkFuncCall(expr.right, "right")
  }

  getResult() {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }
}

export const validateStrategy = (strategyGraph, timeframe) => {
  const validator = new StrategyValidator()
  return validator.validate(strategyGraph, timeframe)
}

export default StrategyValidator
