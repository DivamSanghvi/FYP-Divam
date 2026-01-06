export default function StrategyFlowChart({ nodes, entryNode, onNodeClick, selectedNode }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No nodes to display
      </div>
    )
  }

  // Build node map for easy lookup
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  // Get expression description
  const getExprDesc = (expr) => {
    if (!expr) return "?"
    if (expr.func) {
      const args = expr.args?.join(", ") || ""
      return `${expr.func}(${args})`
    }
    if (expr.op) {
      const left = getExprDesc(expr.left)
      const right = getExprDesc(expr.right)
      return `${left} ${expr.op} ${right}`
    }
    return String(expr)
  }

  // Render a single node
  const renderNode = (node, level = 0) => {
    if (!node) return null

    const isCondition = node.type === "condition"
    const isSelected = selectedNode?.id === node.id

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Box */}
        <div
          onClick={() => onNodeClick(node)}
          className={`
            min-w-[180px] px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
            ${isCondition 
              ? isSelected 
                ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30" 
                : "bg-blue-900/50 border-blue-500/50 text-blue-100 hover:bg-blue-800/50"
              : isSelected
                ? "bg-green-600 border-green-400 text-white shadow-lg shadow-green-500/30"
                : "bg-green-900/50 border-green-500/50 text-green-100 hover:bg-green-800/50"
            }
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{isCondition ? "◇" : "■"}</span>
            <span className="font-bold text-sm">{node.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${isCondition ? "bg-blue-500/30" : "bg-green-500/30"}`}>
              {isCondition ? "CONDITION" : "ACTION"}
            </span>
          </div>
          <div className="text-xs opacity-90 mt-1">
            {isCondition 
              ? getExprDesc(node.expr)
              : `${node.action?.type || "?"} ${node.action?.symbol ? `(${node.action.symbol})` : ""}`
            }
          </div>
          {!isCondition && node.action?.qty && (
            <div className="text-xs opacity-70 mt-1">Qty: {node.action.qty}</div>
          )}
        </div>

        {/* Arrows for condition nodes */}
        {isCondition && (
          <div className="flex gap-8 mt-2">
            {/* True branch */}
            <div className="flex flex-col items-center">
              <div className="text-green-400 text-xs font-bold mb-1">TRUE ↓</div>
              <div className="w-0.5 h-6 bg-green-500"></div>
              {node.nextIfTrue && nodeMap[node.nextIfTrue] && (
                <div className="mt-2">
                  {renderNode(nodeMap[node.nextIfTrue], level + 1)}
                </div>
              )}
            </div>

            {/* False branch */}
            <div className="flex flex-col items-center">
              <div className="text-red-400 text-xs font-bold mb-1">FALSE ↓</div>
              <div className="w-0.5 h-6 bg-red-500"></div>
              {node.nextIfFalse && nodeMap[node.nextIfFalse] && (
                <div className="mt-2">
                  {renderNode(nodeMap[node.nextIfFalse], level + 1)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Arrow for action nodes with next */}
        {!isCondition && node.nextNode && nodeMap[node.nextNode] && (
          <div className="flex flex-col items-center mt-2">
            <div className="w-0.5 h-6 bg-slate-500"></div>
            <div className="text-slate-400 text-xs">↓</div>
            <div className="mt-2">
              {renderNode(nodeMap[node.nextNode], level + 1)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Find the entry node
  const startNode = nodeMap[entryNode] || nodes[0]

  return (
    <div className="overflow-x-auto pb-4">
      {/* Legend */}
      <div className="flex gap-6 mb-6 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-blue-400 text-lg">◇</span>
          <span className="text-slate-300">Condition</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-400 text-lg">■</span>
          <span className="text-slate-300">Action</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-400">→</span>
          <span className="text-slate-300">True Path</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-red-400">→</span>
          <span className="text-slate-300">False Path</span>
        </div>
      </div>

      {/* Flow Chart */}
      <div className="flex justify-center min-h-[300px]">
        {renderNode(startNode)}
      </div>

      {/* Node List (fallback for complex graphs) */}
      <div className="mt-8 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 mb-3">All Nodes ({nodes.length})</div>
        <div className="flex flex-wrap gap-2">
          {nodes.map(node => (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={`
                px-3 py-1.5 rounded text-xs font-medium transition
                ${node.type === "condition" 
                  ? "bg-blue-900/50 text-blue-300 hover:bg-blue-800/50"
                  : "bg-green-900/50 text-green-300 hover:bg-green-800/50"
                }
                ${selectedNode?.id === node.id ? "ring-2 ring-white" : ""}
              `}
            >
              {node.id}: {node.type === "condition" ? "◇" : "■"} {node.type === "action" ? node.action?.type : "IF"}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
