import React from 'react'

// Action Block Component (Green Rectangle)
export const ActionBlock = ({ 
  node, 
  onEdit, 
  onDelete,
  isSelected = false 
}) => {
  const getActionText = (action) => {
    if (!action) return "Empty action"
    
    const { type, symbol, qty } = action
    
    switch (type) {
      case "ENTER_LONG":
        return `BUY ${symbol} ${qty || "1"}`
      case "ENTER_SHORT":
        return `SELL ${symbol} ${qty || "1"}`
      case "EXIT_POSITION":
        return `CLOSE ${symbol}`
      case "EXIT_LONG":
        return `CLOSE LONG ${symbol}`
      case "EXIT_SHORT":
        return `CLOSE SHORT ${symbol}`
      case "SET_STOP_LOSS":
        return `STOP ${symbol} @ ${action.stopDistance}%`
      case "SET_TAKE_PROFIT":
        return `TARGET ${symbol} @ ${action.targetDistance}%`
      case "NO_TRADE":
        return "NO ACTION"
      default:
        return type
    }
  }

  return (
    <div
      className={`
        relative w-56 h-24
        flex items-center justify-center
        bg-green-100 border-2 border-green-400 rounded
        cursor-pointer hover:shadow-lg transition-all
        ${isSelected ? 'ring-2 ring-green-600 shadow-lg' : ''}
        text-center p-4
      `}
      onClick={() => onEdit?.(node)}
    >
      <div className="text-sm font-bold text-green-900">
        {getActionText(node.action)}
      </div>
      
      {/* Edit and Delete buttons */}
      <div className="absolute -top-8 right-0 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(node)
          }}
          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
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

export default ActionBlock
