import React, { useMemo, useState } from 'react'
import ConditionBlock from './ConditionBlock'
import ActionBlock from './ActionBlock'
import Arrow, { ArrowMarkers } from './Arrow'

// Graph Renderer - visualizes the strategy as connected blocks
export const GraphRenderer = ({ 
  graph, 
  onEditNode, 
  onDeleteNode,
  selectedNodeId = null 
}) => {
  const [nodePositions, setNodePositions] = useState({})

  // Calculate positions for nodes (simple top-to-bottom layout)
  const calculateLayout = () => {
    if (!graph?.nodes || graph.nodes.length === 0) return {}

    const positions = {}
    const visited = new Set()
    const ySpacing = 150
    const xSpacing = 250
    
    const layoutNode = (nodeId, x = 200, y = 50, depth = 0) => {
      if (visited.has(nodeId) || depth > 20) return

      visited.add(nodeId)
      positions[nodeId] = { x, y }

      const node = graph.nodes.find(n => n.id === nodeId)
      if (!node) return

      if (node.type === "condition") {
        const newY = y + ySpacing

        // Left branch (nextIfTrue)
        if (node.nextIfTrue) {
          layoutNode(node.nextIfTrue, x - xSpacing / 2, newY, depth + 1)
        }

        // Right branch (nextIfFalse)
        if (node.nextIfFalse) {
          layoutNode(node.nextIfFalse, x + xSpacing / 2, newY, depth + 1)
        }
      } else if (node.type === "action" && node.nextNode) {
        layoutNode(node.nextNode, x, y + ySpacing, depth + 1)
      }
    }

    layoutNode(graph.entryNode)
    return positions
  }

  const positions = useMemo(() => calculateLayout(), [graph])

  if (!graph?.nodes || graph.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No strategy graph to display</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-white border border-gray-300 rounded overflow-auto">
      <svg width="100%" height="100%" className="min-h-full" style={{ minWidth: '100%' }}>
        <ArrowMarkers />

        {/* Draw connections first (behind nodes) */}
        {graph.nodes.map(node => {
          const nodePos = positions[node.id]
          if (!nodePos) return null

          const connections = []

          if (node.type === "condition") {
            if (node.nextIfTrue) {
              const truePos = positions[node.nextIfTrue]
              if (truePos) {
                connections.push(
                  <Arrow
                    key={`${node.id}-true`}
                    fromPos={nodePos}
                    toPos={truePos}
                    label="TRUE"
                    isHighlighted={false}
                  />
                )
              }
            }
            if (node.nextIfFalse) {
              const falsePos = positions[node.nextIfFalse]
              if (falsePos) {
                connections.push(
                  <Arrow
                    key={`${node.id}-false`}
                    fromPos={nodePos}
                    toPos={falsePos}
                    label="FALSE"
                    isHighlighted={false}
                  />
                )
              }
            }
          } else if (node.type === "action" && node.nextNode) {
            const nextPos = positions[node.nextNode]
            if (nextPos) {
              connections.push(
                <Arrow
                  key={`${node.id}-next`}
                  fromPos={nodePos}
                  toPos={nextPos}
                  label="Next"
                  isHighlighted={false}
                />
              )
            }
          }

          return connections
        })}

        {/* Draw nodes */}
        <g>
          {graph.nodes.map(node => {
            const pos = positions[node.id]
            if (!pos) return null

            const isSelected = node.id === selectedNodeId

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - 96}, ${pos.y - 64})`}
              >
                {node.type === "condition" ? (
                  <foreignObject width="192" height="128" x="0" y="0">
                    <ConditionBlock
                      node={node}
                      onEdit={onEditNode}
                      onDelete={onDeleteNode}
                      isSelected={isSelected}
                    />
                  </foreignObject>
                ) : (
                  <foreignObject width="224" height="96" x="0" y="0">
                    <ActionBlock
                      node={node}
                      onEdit={onEditNode}
                      onDelete={onDeleteNode}
                      isSelected={isSelected}
                    />
                  </foreignObject>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Validation messages */}
      {graph.warnings && graph.warnings.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-yellow-50 border border-yellow-300 rounded p-3 max-w-xs">
          <p className="font-semibold text-yellow-900 text-sm mb-2">Warnings:</p>
          <ul className="text-xs text-yellow-800 space-y-1">
            {graph.warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default GraphRenderer
