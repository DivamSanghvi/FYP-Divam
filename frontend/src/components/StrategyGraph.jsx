import React, { useMemo, useCallback, useState } from 'react'

// Modern Strategy Graph Visualizer
const StrategyGraph = ({ graph, onNodeClick, selectedNodeId }) => {
  const [hoveredNode, setHoveredNode] = useState(null)

  // Calculate node layout with proper spacing
  const layout = useMemo(() => {
    if (!graph?.nodes?.length) return { nodes: {}, connections: [] }

    const nodeMap = {}
    graph.nodes.forEach(n => { nodeMap[n.id] = n })

    const positions = {}
    const connections = []
    const visited = new Set()
    const levels = {}

    // BFS to assign levels
    const assignLevel = (nodeId, level = 0, xOffset = 0) => {
      if (!nodeId || visited.has(nodeId)) return
      visited.add(nodeId)

      if (!levels[level]) levels[level] = []
      levels[level].push({ id: nodeId, xOffset })

      const node = nodeMap[nodeId]
      if (!node) return

      if (node.type === 'condition') {
        assignLevel(node.nextIfTrue, level + 1, xOffset - 1)
        assignLevel(node.nextIfFalse, level + 1, xOffset + 1)
      } else if (node.nextNode) {
        assignLevel(node.nextNode, level + 1, xOffset)
      }
    }

    assignLevel(graph.entryNode)

    // Calculate positions
    const nodeWidth = 220
    const nodeHeight = 100
    const levelSpacing = 140
    const containerWidth = 800

    Object.entries(levels).forEach(([level, nodesAtLevel]) => {
      const y = parseInt(level) * levelSpacing + 40
      const totalWidth = nodesAtLevel.length * nodeWidth
      const startX = (containerWidth - totalWidth) / 2

      nodesAtLevel.forEach((item, idx) => {
        positions[item.id] = {
          x: startX + idx * nodeWidth + nodeWidth / 2,
          y: y + nodeHeight / 2
        }
      })
    })

    // Build connections
    graph.nodes.forEach(node => {
      const fromPos = positions[node.id]
      if (!fromPos) return

      if (node.type === 'condition') {
        if (node.nextIfTrue && positions[node.nextIfTrue]) {
          connections.push({
            from: node.id,
            to: node.nextIfTrue,
            label: 'YES',
            color: '#22c55e'
          })
        }
        if (node.nextIfFalse && positions[node.nextIfFalse]) {
          connections.push({
            from: node.id,
            to: node.nextIfFalse,
            label: 'NO',
            color: '#ef4444'
          })
        }
      } else if (node.nextNode && positions[node.nextNode]) {
        connections.push({
          from: node.id,
          to: node.nextNode,
          label: '',
          color: '#6b7280'
        })
      }
    })

    return { positions, connections }
  }, [graph])

  // Format expression to readable text
  const formatExpr = (expr) => {
    if (!expr) return 'Empty'

    if (expr.func) {
      const args = expr.args?.slice(1).join(', ') || ''
      const offset = expr.offset ? ` (${expr.offset.value} ${expr.offset.unit} ago)` : ''
      return `${expr.func.toUpperCase()}(${args})${offset}`
    }

    if (expr.op === 'AND' || expr.op === 'OR') {
      return `${formatExpr(expr.left)} ${expr.op} ${formatExpr(expr.right)}`
    }

    if (['>', '<', '>=', '<=', '==', '!='].includes(expr.op)) {
      const left = typeof expr.left === 'object' ? formatExpr(expr.left) : expr.left
      const right = typeof expr.right === 'object' ? formatExpr(expr.right) : expr.right
      return `${left} ${expr.op} ${right}`
    }

    return JSON.stringify(expr).slice(0, 30)
  }

  // Format action to readable text
  const formatAction = (action) => {
    if (!action) return 'No Action'
    const { type, symbol, qty } = action
    const qtyStr = qty ? ` (${qty})` : ''
    
    switch (type) {
      case 'ENTER_LONG': return `📈 BUY ${symbol}${qtyStr}`
      case 'ENTER_SHORT': return `📉 SELL ${symbol}${qtyStr}`
      case 'EXIT_POSITION': return `🚪 EXIT ${symbol}`
      case 'EXIT_LONG': return `🚪 EXIT LONG ${symbol}`
      case 'EXIT_SHORT': return `🚪 EXIT SHORT ${symbol}`
      case 'NO_TRADE': return `⏸️ NO TRADE`
      default: return type
    }
  }

  if (!graph?.nodes?.length) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-slate-400 text-lg">No strategy graph to display</p>
          <p className="text-slate-500 text-sm mt-2">Enter a strategy description above</p>
        </div>
      </div>
    )
  }

  const svgHeight = Math.max(500, Object.keys(layout.positions).length * 120 + 100)

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <svg 
        width="100%" 
        height={svgHeight}
        viewBox={`0 0 800 ${svgHeight}`}
        className="block"
      >
        {/* Grid pattern background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
          </pattern>
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="5" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e"/>
          </marker>
          <marker id="arrowRed" viewBox="0 0 10 10" refX="5" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444"/>
          </marker>
          <marker id="arrowGray" viewBox="0 0 10 10" refX="5" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280"/>
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>

        {/* Connections */}
        {layout.connections.map((conn, idx) => {
          const fromPos = layout.positions[conn.from]
          const toPos = layout.positions[conn.to]
          if (!fromPos || !toPos) return null

          const midX = (fromPos.x + toPos.x) / 2
          const midY = (fromPos.y + toPos.y) / 2

          return (
            <g key={idx}>
              <path
                d={`M ${fromPos.x} ${fromPos.y + 40} Q ${fromPos.x} ${midY} ${toPos.x} ${toPos.y - 40}`}
                fill="none"
                stroke={conn.color}
                strokeWidth="2"
                markerEnd={`url(#arrow${conn.color === '#22c55e' ? 'Green' : conn.color === '#ef4444' ? 'Red' : 'Gray'})`}
              />
              {conn.label && (
                <text
                  x={midX}
                  y={midY - 5}
                  textAnchor="middle"
                  fill={conn.color}
                  fontSize="12"
                  fontWeight="bold"
                  className="select-none"
                >
                  {conn.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {graph.nodes.map(node => {
          const pos = layout.positions[node.id]
          if (!pos) return null

          const isCondition = node.type === 'condition'
          const isSelected = node.id === selectedNodeId
          const isHovered = node.id === hoveredNode
          const width = 200
          const height = 70

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x - width/2}, ${pos.y - height/2})`}
              onClick={() => onNodeClick?.(node)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              {/* Node shape */}
              {isCondition ? (
                // Diamond shape for conditions
                <g transform={`translate(${width/2}, ${height/2})`}>
                  <polygon
                    points={`0,-${height/2} ${width/2},0 0,${height/2} -${width/2},0`}
                    fill={isSelected ? '#1e40af' : isHovered ? '#1e3a5f' : '#0f172a'}
                    stroke={isSelected ? '#3b82f6' : '#3b82f6'}
                    strokeWidth={isSelected ? 3 : 2}
                    rx="8"
                  />
                  <text
                    textAnchor="middle"
                    y="5"
                    fill="#93c5fd"
                    fontSize="11"
                    fontWeight="600"
                    className="select-none"
                  >
                    {formatExpr(node.expr).length > 25 
                      ? formatExpr(node.expr).slice(0, 25) + '...'
                      : formatExpr(node.expr)
                    }
                  </text>
                </g>
              ) : (
                // Rounded rectangle for actions
                <g>
                  <rect
                    width={width}
                    height={height}
                    rx="12"
                    fill={isSelected ? '#166534' : isHovered ? '#14532d' : '#0f172a'}
                    stroke="#22c55e"
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    x={width/2}
                    y={height/2 + 5}
                    textAnchor="middle"
                    fill="#86efac"
                    fontSize="13"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {formatAction(node.action)}
                  </text>
                </g>
              )}

              {/* Node ID badge */}
              <circle
                cx={isCondition ? width/2 : width - 15}
                cy={isCondition ? -5 : 15}
                r="12"
                fill="#475569"
              />
              <text
                x={isCondition ? width/2 : width - 15}
                y={isCondition ? 0 : 20}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="9"
                fontWeight="bold"
              >
                {node.id.replace('node', '')}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default StrategyGraph
