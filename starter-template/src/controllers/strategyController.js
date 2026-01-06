import Strategy from "../models/Strategy.js"
import { interpretStrategyWithLLM } from "../services/llmClient.js"
import { validateStrategy } from "../utils/strategyValidator.js"
import { getValidActionNames, getDSLSpec } from "../utils/llmPrompt.js"

export const interpretStrategy = async (req, res) => {
  try {
    const { userQuery, symbol, timeframe } = req.body

    // Validate input
    if (!userQuery || !symbol || !timeframe) {
      return res.status(400).json({
        success: false,
        message: "userQuery, symbol, and timeframe are required"
      })
    }

    if (!["1M", "5M", "15M", "1H", "4H", "1D", "1W"].includes(timeframe)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timeframe. Supported: 1M, 5M, 15M, 1H, 4H, 1D, 1W"
      })
    }

    // Call LLM to interpret strategy
    const llmResult = await interpretStrategyWithLLM(userQuery, symbol, timeframe)

    if (!llmResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to interpret strategy with LLM",
        error: llmResult.error
      })
    }

    const { graph, model } = llmResult

    // Ensure symbol is set at top level
    if (!graph.symbol) {
      graph.symbol = symbol.toUpperCase()
    }

    // Get valid actions from spec
    const validActions = getValidActionNames()

    // Auto-fix condition nodes: handle incomplete funcCall expressions
    graph.nodes = graph.nodes.map(node => {
      if (node.type === "condition" && node.expr) {
        // Detect incomplete funcCall - has kind:funcCall but missing name or args
        if (node.expr.kind === "funcCall" && (!node.expr.name || !Array.isArray(node.expr.args))) {
          // Convert to a simple always-true condition (pass-through)
          node.expr = {
            kind: "binary",
            op: "==",
            left: { kind: "numberLiteral", value: 1 },
            right: { kind: "numberLiteral", value: 1 }
          }
          if (!graph.warnings) graph.warnings = []
          graph.warnings.push(`Auto-fixed: Converted incomplete position condition to pass-through (always true). Consider manually specifying position checking logic.`)
        }
        // Handle ! (NOT) operator - convert to == false comparison
        else if (node.expr.op === "!" || node.expr.op === "NOT" || node.expr.op === "not") {
          // NOT only has a right operand, convert to: right == false
          const operand = node.expr.right || node.expr.left
          node.expr = {
            kind: "binary",
            op: "==",
            left: operand,
            right: { kind: "numberLiteral", value: 0 } // false/0 for bool functions
          }
          if (!graph.warnings) graph.warnings = []
          graph.warnings.push(`Auto-fixed: Converted NOT operator to == 0 comparison`)
        }
      }
      return node
    })

    // Auto-fix action nodes: add default symbol and qty
    graph.nodes = graph.nodes.map(node => {
      if (node.type === "action") {
        const actionType = node.actionType
        
        // Add default symbol if missing (except for NO_ACTION and EXIT_ALL)
        if (!node.symbol && !["NO_ACTION", "EXIT_ALL", "CANCEL_ORDERS"].includes(actionType)) {
          node.symbol = symbol.toUpperCase()
          if (!graph.warnings) graph.warnings = []
          graph.warnings.push(`Auto-fixed: Added symbol "${symbol.toUpperCase()}" to ${actionType} action`)
        }
        
        // Add default qty for ENTER actions
        if (node.qty === undefined && ["ENTER_LONG", "ENTER_SHORT"].includes(actionType)) {
          node.qty = 10
          node.qty_type = "PERCENT_EQUITY"
          if (!graph.warnings) graph.warnings = []
          graph.warnings.push(`Auto-fixed: Added default qty 10% equity to ${actionType} action`)
        }
        
        // Fix EXIT actions: convert string qty to numeric percentage
        if (["EXIT_LONG", "EXIT_SHORT"].includes(actionType)) {
          // Convert string qty to numeric
          if (typeof node.qty === "string") {
            const qtyStr = node.qty.toUpperCase()
            if (qtyStr === "ALL" || qtyStr === "100%") {
              node.qty = 100
            } else if (qtyStr === "HALF" || qtyStr === "50%") {
              node.qty = 50
            } else if (qtyStr.endsWith("%")) {
              node.qty = parseFloat(qtyStr) || 100
            } else {
              node.qty = 100 // Default to full exit
            }
            if (!graph.warnings) graph.warnings = []
            graph.warnings.push(`Auto-fixed: Converted string qty "${qtyStr}" to numeric ${node.qty}%`)
          }
          
          // Default to 100% if qty is missing
          if (node.qty === undefined || node.qty === null) {
            node.qty = 100
          }
          
          // Always set qty_type to PERCENT_POSITION for exits
          node.qty_type = "PERCENT_POSITION"
        }
      }
      return node
    })

    // Validate the graph returned by LLM
    const validation = validateStrategy(graph, timeframe)

    // Create strategy document using new format
    const strategy = new Strategy({
      symbol: graph.symbol.toUpperCase(),
      description: `Interpreted from: "${userQuery}"`,
      userQuery,
      timeframe,
      entryNode: graph.entryNode,
      nodes: graph.nodes,
      warnings: [...(graph.warnings || []), ...validation.warnings],
      suggestedEdits: graph.suggestedEdits || [],
      isValid: validation.isValid,
      validationErrors: validation.isValid ? [] : validation.errors,
      llmModel: model,
      llmPromptVersion: "v2",
      owner: req.user?._id
    })

    // Log strategy JSON before saving
    console.log("=== STRATEGY BEING SAVED TO MONGODB ===")
    console.log(JSON.stringify(strategy.toObject(), null, 2))
    console.log("========================================")

    // Save to database
    const savedStrategy = await strategy.save()

    // Return response in new format
    return res.status(201).json({
      success: true,
      strategy: {
        id: savedStrategy._id,
        symbol: savedStrategy.symbol,
        timeframe: savedStrategy.timeframe,
        isValid: savedStrategy.isValid,
        validationErrors: savedStrategy.validationErrors,
        warnings: savedStrategy.warnings,
        suggestedEdits: savedStrategy.suggestedEdits,
        graph: {
          symbol: savedStrategy.symbol,
          entryNode: savedStrategy.entryNode,
          nodes: savedStrategy.nodes
        }
      }
    })
  } catch (error) {
    console.error("Strategy interpretation error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error during strategy interpretation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    })
  }
}

export const getStrategy = async (req, res) => {
  try {
    const { id } = req.params

    const strategy = await Strategy.findById(id)

    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: "Strategy not found"
      })
    }

    return res.status(200).json({
      success: true,
      strategy
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching strategy",
      error: error.message
    })
  }
}

export const updateStrategy = async (req, res) => {
  try {
    const { id } = req.params
    const { nodes, entryNode } = req.body

    if (!nodes || !entryNode) {
      return res.status(400).json({
        success: false,
        message: "nodes and entryNode are required"
      })
    }

    const strategy = await Strategy.findById(id)

    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: "Strategy not found"
      })
    }

    // Prepare updated graph
    const updatedGraph = {
      strategyName: strategy.name,
      entryNode,
      nodes
    }

    // Re-validate the modified graph
    const validation = validateStrategy(updatedGraph, strategy.timeframe)

    // Update strategy
    strategy.nodes = nodes
    strategy.entryNode = entryNode
    strategy.isValid = validation.isValid
    strategy.validationErrors = validation.isValid ? [] : validation.errors
    strategy.warnings = validation.warnings
    strategy.updatedAt = new Date()

    const updatedStrategy = await strategy.save()

    return res.status(200).json({
      success: true,
      strategy: {
        id: updatedStrategy._id,
        isValid: updatedStrategy.isValid,
        validationErrors: updatedStrategy.validationErrors,
        warnings: updatedStrategy.warnings,
        graph: {
          entryNode: updatedStrategy.entryNode,
          nodes: updatedStrategy.nodes
        }
      }
    })
  } catch (error) {
    console.error("Strategy update error:", error)
    return res.status(500).json({
      success: false,
      message: "Error updating strategy",
      error: error.message
    })
  }
}

export const getUserStrategies = async (req, res) => {
  try {
    const strategies = await Strategy.find({
      owner: req.user?._id
    }).select("name symbol timeframe isValid createdAt updatedAt")

    return res.status(200).json({
      success: true,
      count: strategies.length,
      strategies
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching strategies",
      error: error.message
    })
  }
}

export const deleteStrategy = async (req, res) => {
  try {
    const { id } = req.params

    const strategy = await Strategy.findByIdAndDelete(id)

    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: "Strategy not found"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Strategy deleted successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting strategy",
      error: error.message
    })
  }
}

export default {
  interpretStrategy,
  getStrategy,
  updateStrategy,
  getUserStrategies,
  deleteStrategy
}
