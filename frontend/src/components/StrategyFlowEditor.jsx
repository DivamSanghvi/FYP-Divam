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

// Custom Condition Node with new aesthetic design
const ConditionNode = ({ data, selected }) => {
  return (
    <div 
      className={`
        px-5 py-4 rounded-2xl min-w-[220px] cursor-pointer transition-all duration-300
        ${selected 
          ? 'bg-gradient-to-br from-primary-600 to-primary-800 border-2 border-primary-400 shadow-xl shadow-primary-500/40 scale-105' 
          : 'bg-gradient-to-br from-primary-900/90 to-primary-950/90 border border-primary-500/50 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/20'
        }
        backdrop-blur-sm
      `}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-gradient-to-r from-primary-400 to-accent-400 !border-2 !border-dark-900"
      />
      
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary-500/30 flex items-center justify-center">
          <span className="text-primary-300 text-lg">◊</span>
        </div>
        <span className="text-white font-bold text-sm tracking-wide">{data.label}</span>
      </div>
      
      <div className="text-primary-200 text-xs bg-dark-900/60 rounded-xl px-3 py-2 font-mono border border-primary-500/20">
        {data.expression || 'Condition'}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        className="!w-3 !h-3 !bg-success !border-2 !border-dark-900"
        style={{ left: '30%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        className="!w-3 !h-3 !bg-danger !border-2 !border-dark-900"
        style={{ left: '70%' }}
      />
      
      <div className="flex justify-between text-[10px] mt-3 px-2 font-semibold tracking-wider">
        <span className="text-success flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
          TRUE
        </span>
        <span className="text-danger flex items-center gap-1">
          FALSE
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
        </span>
      </div>
    </div>
  )
}

// Custom Action Node with new aesthetic design
const ActionNode = ({ data, selected }) => {
  const getActionStyle = (type) => {
    switch (type) {
      case 'ENTER_LONG': 
        return {
          bg: 'from-emerald-900/90 to-emerald-950/90',
          border: selected ? 'border-emerald-400' : 'border-emerald-500/50',
          shadow: 'shadow-emerald-500/40',
          icon: '',
          iconBg: 'bg-emerald-500/30',
          textColor: 'text-emerald-200'
        }
      case 'ENTER_SHORT': 
        return {
          bg: 'from-rose-900/90 to-rose-950/90',
          border: selected ? 'border-rose-400' : 'border-rose-500/50',
          shadow: 'shadow-rose-500/40',
          icon: '',
          iconBg: 'bg-rose-500/30',
          textColor: 'text-rose-200'
        }
      case 'EXIT_LONG': 
      case 'EXIT_SHORT':
      case 'EXIT_POSITION': 
        return {
          bg: 'from-amber-900/90 to-amber-950/90',
          border: selected ? 'border-amber-400' : 'border-amber-500/50',
          shadow: 'shadow-amber-500/40',
          icon: '',
          iconBg: 'bg-amber-500/30',
          textColor: 'text-amber-200'
        }
      case 'NO_TRADE': 
        return {
          bg: 'from-dark-700/90 to-dark-800/90',
          border: selected ? 'border-dark-400' : 'border-dark-500/50',
          shadow: 'shadow-dark-500/40',
          icon: '',
          iconBg: 'bg-dark-500/30',
          textColor: 'text-dark-300'
        }
      default: 
        return {
          bg: 'from-accent-900/90 to-accent-950/90',
          border: selected ? 'border-accent-400' : 'border-accent-500/50',
          shadow: 'shadow-accent-500/40',
          icon: '',
          iconBg: 'bg-accent-500/30',
          textColor: 'text-accent-200'
        }
    }
  }

  const style = getActionStyle(data.actionType)

  return (
    <div 
      className={`
        px-5 py-4 rounded-2xl min-w-[200px] cursor-pointer transition-all duration-300 backdrop-blur-sm
        bg-gradient-to-br ${style.bg} border-2 ${style.border}
        ${selected 
          ? `shadow-xl ${style.shadow} scale-105` 
          : 'hover:shadow-lg hover:scale-102'
        }
      `}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-gradient-to-r from-dark-400 to-dark-300 !border-2 !border-dark-900"
      />
      
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center`}>
          <span className="text-lg">{style.icon}</span>
        </div>
        <span className="text-white font-bold text-sm tracking-wide">{data.label}</span>
      </div>
      
      <div className="space-y-2 bg-dark-900/40 rounded-xl p-3 border border-white/5">
        <div className={`text-xs font-bold tracking-wider ${style.textColor}`}>
          {data.actionType || 'ACTION'}
        </div>
        {data.symbol && (
          <div className="text-white/60 text-xs flex items-center gap-2">
            <span className="text-[10px]"></span>
            <span>{data.symbol}</span>
          </div>
        )}
        {data.qty && (
          <div className="text-white/60 text-xs flex items-center gap-2">
            <span className="text-[10px]"></span>
            <span>{data.qty} {data.qty_type || ''}</span>
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-gradient-to-r from-dark-400 to-dark-300 !border-2 !border-dark-900"
      />
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
      <div className="h-[500px] flex items-center justify-center bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl border border-primary-500/20">
        <div className="text-center">
          <p className="text-dark-400">Generate a strategy to see the flow diagram</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[500px] bg-gradient-to-br from-dark-900 to-dark-950 rounded-2xl border border-primary-500/20 overflow-hidden relative">
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
        <Background 
          color="rgba(139, 92, 246, 0.1)" 
          gap={30} 
          size={1}
        />
        <Controls />
        <MiniMap 
          nodeColor={(node) => node.type === 'condition' ? '#8b5cf6' : '#10b981'}
          maskColor="rgba(2, 6, 23, 0.85)"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px'
          }}
        />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass rounded-xl px-5 py-3 flex gap-6 text-xs border border-primary-500/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-primary-500/30 flex items-center justify-center">
            <span className="text-primary-400 text-[10px]">◊</span>
          </div>
          <span className="text-dark-300">Condition</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-400 text-[10px]">■</span>
          </div>
          <span className="text-dark-300">Action</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gradient-to-r from-success to-success/50 rounded-full"></div>
          <span className="text-dark-300">True</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gradient-to-r from-danger to-danger/50 rounded-full"></div>
          <span className="text-dark-300">False</span>
        </div>
      </div>
    </div>
  )
}
