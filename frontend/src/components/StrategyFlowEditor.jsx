import { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom Condition Node
const ConditionNode = ({ data, selected }) => {
  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[200px] cursor-pointer
        ${selected 
          ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50' 
          : 'bg-blue-900 border-blue-500'
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400" />
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-300 text-lg">◇</span>
        <span className="text-white font-bold text-sm">{data.label}</span>
      </div>
      
      <div className="text-blue-200 text-xs bg-blue-950/50 rounded px-2 py-1">
        {data.expression || 'Condition'}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        className="w-3 h-3 bg-green-400"
        style={{ left: '30%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        className="w-3 h-3 bg-red-400"
        style={{ left: '70%' }}
      />
      
      <div className="flex justify-between text-[10px] mt-2 px-1">
        <span className="text-green-400">TRUE</span>
        <span className="text-red-400">FALSE</span>
      </div>
    </div>
  )
}

// Custom Action Node
const ActionNode = ({ data, selected }) => {
  const getActionColor = (type) => {
    switch (type) {
      case 'ENTER_LONG': return 'bg-green-900 border-green-500'
      case 'ENTER_SHORT': return 'bg-red-900 border-red-500'
      case 'EXIT_LONG': 
      case 'EXIT_SHORT':
      case 'EXIT_POSITION': return 'bg-orange-900 border-orange-500'
      case 'NO_TRADE': return 'bg-slate-700 border-slate-500'
      default: return 'bg-green-900 border-green-500'
    }
  }

  return (
    <div 
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[180px] cursor-pointer
        ${selected 
          ? 'shadow-lg shadow-green-500/50 ring-2 ring-white' 
          : ''
        }
        ${getActionColor(data.actionType)}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400" />
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-300 text-lg">■</span>
        <span className="text-white font-bold text-sm">{data.label}</span>
      </div>
      
      <div className="space-y-1">
        <div className="text-green-200 text-xs font-semibold">
          {data.actionType || 'ACTION'}
        </div>
        {data.symbol && (
          <div className="text-green-300/70 text-xs">
            Symbol: {data.symbol}
          </div>
        )}
        {data.qty && (
          <div className="text-green-300/70 text-xs">
            Qty: {data.qty}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400" />
    </div>
  )
}

const nodeTypes = {
  condition: ConditionNode,
  action: ActionNode
}

// Helper to format an operand (new format with kind)
const formatOperand = (operand) => {
  if (!operand) return "?"
  
  switch (operand.kind) {
    case "numberLiteral":
      return String(operand.value)
    case "stringLiteral":
      return `"${operand.value}"`
    case "boolLiteral":
      return operand.value ? "true" : "false"
    case "identifier":
      return operand.name
    case "funcCall": {
      const args = operand.args?.map(formatOperand).join(", ") || ""
      const offset = operand.offset ? `[${operand.offset.value} ${operand.offset.unit}]` : ""
      return `${operand.name}(${args})${offset}`
    }
    default:
      // Fallback for old format or unknown
      if (typeof operand === "number") return String(operand)
      if (typeof operand === "string") return operand
      if (operand.func) {
        // Old format fallback
        const args = operand.args?.join(", ") || ""
        return `${operand.func}(${args})`
      }
      return "?"
  }
}

// Helper to get expression description (supports new binary format)
const getExprDesc = (expr) => {
  if (!expr) return "?"
  
  // New format: kind === "binary"
  if (expr.kind === "binary" && expr.op) {
    const left = formatOperand(expr.left)
    const right = formatOperand(expr.right)
    return `${left} ${expr.op} ${right}`
  }
  
  // Old format fallback
  if (expr.func) {
    const args = expr.args?.join(", ") || ""
    return `${expr.func}(${args})`
  }
  if (expr.op) {
    const left = getExprDesc(expr.left)
    const right = getExprDesc(expr.right)
    return `${left} ${expr.op} ${right}`
  }
  if (typeof expr === 'number') return String(expr)
  return String(expr)
}

export default function StrategyFlowEditor({ 
  nodes: strategyNodes, 
  entryNode, 
  onNodeClick, 
  selectedNode,
  onNodesChange: externalOnNodesChange 
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Convert strategy nodes to React Flow format
  useEffect(() => {
    if (!strategyNodes || strategyNodes.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    // Build node map
    const nodeMap = {}
    strategyNodes.forEach(n => { nodeMap[n.id] = n })

    // Calculate tree layout using BFS with proper spacing
    const nodePositions = {}
    const visited = new Set()
    const levelNodes = {} // Track nodes at each level for horizontal spacing
    
    // BFS to assign levels first
    const startNode = entryNode || strategyNodes[0]?.id
    if (!startNode) return

    const queue = [{ nodeId: startNode, level: 0 }]
    
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()
      if (visited.has(nodeId) || !nodeMap[nodeId]) continue
      visited.add(nodeId)
      
      // Track this node at its level
      if (!levelNodes[level]) levelNodes[level] = []
      levelNodes[level].push(nodeId)
      
      const node = nodeMap[nodeId]
      
      // Queue children
      if (node.type === 'condition') {
        if (node.nextIfTrue && !visited.has(node.nextIfTrue)) {
          queue.push({ nodeId: node.nextIfTrue, level: level + 1 })
        }
        if (node.nextIfFalse && !visited.has(node.nextIfFalse)) {
          queue.push({ nodeId: node.nextIfFalse, level: level + 1 })
        }
      } else {
        // Action node - check both 'next' (new format) and 'nextNode' (old format)
        const nextNode = node.next || node.nextNode
        if (nextNode && !visited.has(nextNode)) {
          queue.push({ nodeId: nextNode, level: level + 1 })
        }
      }
    }

    // Handle any unvisited nodes (disconnected from graph)
    strategyNodes.forEach(node => {
      if (!visited.has(node.id)) {
        const maxLevel = Math.max(...Object.keys(levelNodes).map(Number), 0) + 1
        if (!levelNodes[maxLevel]) levelNodes[maxLevel] = []
        levelNodes[maxLevel].push(node.id)
      }
    })

    // Calculate positions - center nodes at each level
    const NODE_WIDTH = 250
    const NODE_HEIGHT = 150
    const HORIZONTAL_SPACING = 50
    const VERTICAL_SPACING = 180

    Object.entries(levelNodes).forEach(([level, nodeIds]) => {
      const levelNum = parseInt(level)
      const totalWidth = nodeIds.length * NODE_WIDTH + (nodeIds.length - 1) * HORIZONTAL_SPACING
      const startX = -totalWidth / 2

      nodeIds.forEach((nodeId, index) => {
        nodePositions[nodeId] = {
          x: startX + index * (NODE_WIDTH + HORIZONTAL_SPACING) + 400, // Center offset
          y: levelNum * VERTICAL_SPACING + 50
        }
      })
    })

    // Create React Flow nodes
    const flowNodes = strategyNodes.map(node => {
      const pos = nodePositions[node.id] || { x: 400, y: 50 }
      
      return {
        id: node.id,
        type: node.type === 'condition' ? 'condition' : 'action',
        position: { x: pos.x, y: pos.y },
        data: {
          label: node.id,
          expression: node.type === 'condition' ? getExprDesc(node.expr) : null,
          // New format uses actionType directly, old format uses action.type
          actionType: node.actionType || node.action?.type || node.action?.name,
          symbol: node.symbol || node.action?.symbol || node.action?.args?.symbol,
          qty: node.qty || node.action?.qty || node.action?.args?.qty,
          qty_type: node.qty_type || node.action?.qty_type || node.action?.args?.qty_type,
          originalNode: node
        },
        draggable: true
      }
    })

    // Create edges
    const flowEdges = []
    strategyNodes.forEach(node => {
      if (node.type === 'condition') {
        if (node.nextIfTrue) {
          flowEdges.push({
            id: `${node.id}-true-${node.nextIfTrue}`,
            source: node.id,
            target: node.nextIfTrue,
            sourceHandle: 'true',
            animated: true,
            style: { stroke: '#22c55e', strokeWidth: 2 },
            label: 'TRUE',
            labelStyle: { fill: '#22c55e', fontSize: 10 },
            labelBgStyle: { fill: '#1e293b' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }
          })
        }
        if (node.nextIfFalse) {
          flowEdges.push({
            id: `${node.id}-false-${node.nextIfFalse}`,
            source: node.id,
            target: node.nextIfFalse,
            sourceHandle: 'false',
            animated: true,
            style: { stroke: '#ef4444', strokeWidth: 2 },
            label: 'FALSE',
            labelStyle: { fill: '#ef4444', fontSize: 10 },
            labelBgStyle: { fill: '#1e293b' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
          })
        }
      } else {
        // New format uses 'next', old format uses 'nextNode'
        const nextNode = node.next || node.nextNode
        if (nextNode) {
          flowEdges.push({
            id: `${node.id}-next-${nextNode}`,
            source: node.id,
            target: nextNode,
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
          })
        }
      }
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [strategyNodes, entryNode])

  const onNodeClickHandler = useCallback((event, node) => {
    if (onNodeClick && node.data.originalNode) {
      onNodeClick(node.data.originalNode)
    }
  }, [onNodeClick])

  if (!strategyNodes || strategyNodes.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700">
        <div className="text-slate-400 text-center">
          <div className="text-4xl mb-2">🔗</div>
          <p>Generate a strategy to see the flow diagram</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[500px] bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 }
        }}
      >
        <Background color="#334155" gap={20} />
        <Controls className="bg-slate-800 border-slate-600 text-white" />
        <MiniMap 
          nodeColor={(node) => node.type === 'condition' ? '#3b82f6' : '#22c55e'}
          maskColor="rgba(0,0,0,0.8)"
          className="bg-slate-800 border-slate-600"
        />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg px-4 py-2 flex gap-4 text-xs border border-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">◇</span>
          <span className="text-slate-300">Condition</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">■</span>
          <span className="text-slate-300">Action</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-slate-300">True</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span className="text-slate-300">False</span>
        </div>
      </div>
    </div>
  )
}
