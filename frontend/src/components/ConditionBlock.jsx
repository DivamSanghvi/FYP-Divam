import React from 'react'

// Condition Block Component (Blue Diamond shape)
export const ConditionBlock = ({ 
  node, 
  onEdit, 
  onDelete,
  isSelected = false 
}) => {
  // Parse expression to human-readable text
  const getExpressionText = (expr) => {
    if (!expr) return "Empty condition"
    
    if (expr.func) {
      // Function call like RSI(14)
      if (expr.func === "rsi") {
        const period = expr.args?.[1] || "14"
        const offset = expr.offset ? ` ${expr.offset.value} ${expr.offset.unit} ago` : ""
        return `RSI(${period})${offset}`
      }
      if (expr.func === "ema") {
        const period = expr.args?.[1] || "20"
        return `EMA(${period})`
      }
      if (expr.func === "time_before") {
        const hour = expr.args?.[0] || "00"
        const minute = expr.args?.[1] || "00"
        return `Before ${hour}:${minute}`
      }
      if (expr.func === "has_long") {
        return "Has long position"
      }
      return expr.func
    }
    
    // Comparison expression (>, <, ==, etc)
    if (expr.op === ">" || expr.op === "<" || expr.op === ">=" || expr.op === "<=" || expr.op === "==" || expr.op === "!=") {
      const leftText = typeof expr.left === 'object' ? getExpressionText(expr.left) : expr.left
      const rightText = typeof expr.right === 'object' ? getExpressionText(expr.right) : expr.right
      return `${leftText} ${expr.op} ${rightText}`
    }
    
    // Logical operators (AND, OR, NOT)
    if (expr.op === "AND" || expr.op === "OR") {
      const leftText = getExpressionText(expr.left)
      const rightText = getExpressionText(expr.right)
      return `${leftText} ${expr.op} ${rightText}`
    }
    
    return "Complex condition"
  }

  return (
    <div
      className={`
        relative w-48 h-32 
        flex items-center justify-center
        bg-blue-100 border-2 border-blue-400 rounded-full
        cursor-pointer hover:shadow-lg transition-all
        ${isSelected ? 'ring-2 ring-blue-600 shadow-lg' : ''}
        text-center p-4
      `}
      onClick={() => onEdit?.(node)}
    >
      <div className="text-sm font-semibold text-blue-900">
        {getExpressionText(node.expr)}
      </div>
      
      {/* Edit and Delete buttons */}
      <div className="absolute -top-8 right-0 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(node)
          }}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(node.id)
          }}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Del
        </button>
      </div>
    </div>
  )
}

export default ConditionBlock
