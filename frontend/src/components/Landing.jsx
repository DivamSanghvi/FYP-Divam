import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

// Animated counter component
const AnimatedCounter = ({ end, duration = 2, suffix = "" }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  
  useEffect(() => {
    if (!isInView) return
    let start = 0
    const increment = end / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [end, duration, isInView])
  
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// Interactive DSL Preview Component
const InteractiveDSLPreview = () => {
  const [activeNode, setActiveNode] = useState(null)
  
  const nodes = [
    { id: 'cond1', type: 'condition', label: 'RSI(14) < 30', x: 200, y: 30, color: 'primary' },
    { id: 'cond2', type: 'condition', label: 'Time < 14:00', x: 200, y: 130, color: 'primary' },
    { id: 'buy', type: 'action', label: 'ENTER LONG', x: 100, y: 230, color: 'success' },
    { id: 'cond3', type: 'condition', label: 'RSI(14) > 70', x: 300, y: 230, color: 'primary' },
    { id: 'sell', type: 'action', label: 'EXIT LONG', x: 200, y: 330, color: 'warning' },
    { id: 'wait', type: 'action', label: 'NO ACTION', x: 400, y: 330, color: 'dark' },
  ]
  
  const edges = [
    { from: 'cond1', to: 'cond2', label: 'TRUE', color: '#10b981' },
    { from: 'cond2', to: 'buy', label: 'TRUE', color: '#10b981' },
    { from: 'cond2', to: 'cond3', label: 'FALSE', color: '#ef4444' },
    { from: 'cond3', to: 'sell', label: 'TRUE', color: '#10b981' },
    { from: 'cond3', to: 'wait', label: 'FALSE', color: '#ef4444' },
  ]

  return (
    <div className="relative w-full h-[400px] glass-card rounded-2xl p-4 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {edges.map((edge, i) => {
          const fromNode = nodes.find(n => n.id === edge.from)
          const toNode = nodes.find(n => n.id === edge.to)
          if (!fromNode || !toNode) return null
          
          const fromX = fromNode.x + 75
          const fromY = fromNode.y + 40
          const toX = toNode.x + 75
          const toY = toNode.y
          
          return (
            <g key={i}>
              <motion.path
                d={`M ${fromX} ${fromY} C ${fromX} ${fromY + 30}, ${toX} ${toY - 30}, ${toX} ${toY}`}
                stroke={edge.color}
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
              />
              <motion.circle
                r="4"
                fill={edge.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + i * 0.2 }}
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M ${fromX} ${fromY} C ${fromX} ${fromY + 30}, ${toX} ${toY - 30}, ${toX} ${toY}`}
                />
              </motion.circle>
            </g>
          )
        })}
      </svg>
      
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, type: 'spring' }}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
          className={`
            absolute cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold
            transition-all duration-300 border-2
            ${node.type === 'condition' 
              ? 'bg-gradient-to-br from-primary-900/90 to-primary-950/90 border-primary-500/50 text-primary-200' 
              : node.color === 'success'
                ? 'bg-gradient-to-br from-emerald-900/90 to-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : node.color === 'warning'
                  ? 'bg-gradient-to-br from-amber-900/90 to-amber-950/90 border-amber-500/50 text-amber-200'
                  : 'bg-gradient-to-br from-dark-700/90 to-dark-800/90 border-dark-500/50 text-dark-300'
            }
            ${activeNode === node.id ? 'ring-2 ring-white shadow-xl' : ''}
          `}
          style={{ left: node.x, top: node.y, width: 150, textAlign: 'center' }}
        >
          <div className="flex items-center justify-center gap-2">
            <span>{node.type === 'condition' ? '◇' : '■'}</span>
            <span>{node.label}</span>
          </div>
        </motion.div>
      ))}
      
      {/* Mini equity curve */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 right-4 w-48 h-24 glass rounded-xl p-3"
      >
        <div className="text-[10px] text-dark-400 mb-1">Backtest Equity Curve</div>
        <svg viewBox="0 0 100 40" className="w-full h-16">
          <motion.path
            d="M 0 35 L 10 30 L 20 32 L 30 25 L 40 20 L 50 22 L 60 15 L 70 10 L 80 12 L 90 5 L 100 8"
            stroke="url(#equityGradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1.5 }}
          />
          <defs>
            <linearGradient id="equityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  )
}

// Feature card with transition effects
const FeatureCard = ({ icon, title, description, delay, index }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.6, delay: delay, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="glass-card rounded-2xl p-8 group cursor-pointer relative overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      
      <motion.div 
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl mb-6 relative z-10"
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      
      <h3 className="text-xl font-bold text-white mb-3 group-hover:gradient-text transition-all duration-300 relative z-10">
        {title}
      </h3>
      
      <p className="text-dark-400 leading-relaxed relative z-10">
        {description}
      </p>
    </motion.div>
  )
}


// Interactive Strategy Editor Component
const InteractiveStrategyEditor = () => {
  const [nodes, setNodes] = useState([
    { id: 'cond1', label: 'RSI(14) < 30', type: 'condition', x: 0, y: 0 },
    { id: 'cond2', label: 'Before 14:00 UTC', type: 'condition', x: 0, y: 100 },
    { id: 'action1', label: 'ENTER LONG', type: 'action', x: -120, y: 200, color: 'emerald' },
    { id: 'action2', label: 'WAIT', type: 'action', x: 120, y: 200, color: 'amber' },
  ])
  
  const [dragging, setDragging] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e, nodeId) => {
    e.preventDefault()
    setDragging(nodeId)
    const node = nodes.find(n => n.id === nodeId)
    setOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    
    setNodes(nodes.map(node => 
      node.id === dragging 
        ? { ...node, x: e.clientX - offset.x, y: e.clientY - offset.y }
        : node
    ))
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  return (
    <div 
      className="glass-card rounded-2xl p-6 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-700">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs font-semibold text-dark-300">Strategy Editor (Drag nodes)</span>
      </div>

      {/* Canvas */}
      <div className="relative bg-dark-950 rounded-xl p-8 min-h-[380px] border border-dark-600 overflow-hidden select-none">
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Connection from cond1 to cond2 */}
          <motion.line
            x1={nodes[0].x + 96}
            y1={nodes[0].y + 56 + 32}
            x2={nodes[1].x + 96}
            y2={nodes[1].y + 32}
            stroke="url(#flowGrad1)"
            strokeWidth="2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          />

          {/* Connection to TRUE action */}
          <motion.path
            d={`M ${nodes[1].x + 96} ${nodes[1].y + 56 + 32} Q ${nodes[1].x + 96} ${nodes[1].y + 100}, ${nodes[2].x + 96} ${nodes[2].y + 32}`}
            stroke="url(#flowGrad1)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />

          {/* Connection to FALSE action */}
          <motion.path
            d={`M ${nodes[1].x + 96} ${nodes[1].y + 56 + 32} Q ${nodes[1].x + 96} ${nodes[1].y + 100}, ${nodes[3].x + 96} ${nodes[3].y + 32}`}
            stroke="url(#flowGrad2)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
          />

          {/* TRUE label */}
          <motion.text
            x={nodes[2].x + 50}
            y={nodes[1].y + 100}
            fontSize="12"
            fill="#10b981"
            fontWeight="bold"
            textAnchor="middle"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            TRUE
          </motion.text>

          {/* FALSE label */}
          <motion.text
            x={nodes[3].x + 96}
            y={nodes[1].y + 100}
            fontSize="12"
            fill="#ef4444"
            fontWeight="bold"
            textAnchor="middle"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            FALSE
          </motion.text>
        </svg>

        {/* Nodes */}
        <div className="relative" style={{ zIndex: 2 }}>
          {nodes.map((node, idx) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + idx * 0.1, type: 'spring' }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${node.x}px)`,
                top: `${node.y}px`,
                transform: 'translateX(-50%)',
                cursor: dragging === node.id ? 'grabbing' : 'grab',
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              whileHover={{ scale: 1.05 }}
              whileDrag={{ scale: 1.08, boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)' }}
              className={`
                w-48 px-4 py-3 rounded-lg transition-all duration-200
                ${node.type === 'condition' 
                  ? 'bg-gradient-to-r from-blue-600/50 to-blue-700/50 border border-blue-500/70 hover:border-blue-400'
                  : node.color === 'emerald'
                    ? 'bg-gradient-to-r from-emerald-600/50 to-emerald-700/50 border border-emerald-500/70 hover:border-emerald-400'
                    : 'bg-gradient-to-r from-amber-600/50 to-amber-700/50 border border-amber-500/70 hover:border-amber-400'
                }
                shadow-lg hover:shadow-2xl
                ${dragging === node.id ? 'ring-2 ring-primary-400' : ''}
              `}
            >
              <div className={`text-xs font-semibold mb-1 ${
                node.type === 'condition' 
                  ? 'text-blue-300' 
                  : node.color === 'emerald' 
                    ? 'text-emerald-300' 
                    : 'text-amber-300'
              }`}>
                {node.type === 'condition' ? 'Condition' : 'Action'}
              </div>
              <div className={`text-sm font-bold ${
                node.type === 'condition' 
                  ? 'text-blue-100' 
                  : node.color === 'emerald' 
                    ? 'text-emerald-100' 
                    : 'text-amber-100'
              }`}>
                {node.label}
              </div>
              {node.type === 'action' && (
                <div className={`text-xs mt-2 ${
                  node.color === 'emerald' 
                    ? 'text-emerald-400' 
                    : 'text-amber-400'
                }`}>
                  {node.color === 'emerald' ? 'qty: 100%' : 'Hold'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="mt-4 flex items-center justify-between text-xs text-dark-400"
      >
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-blue-500" />
            <span>Conditions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-emerald-500" />
            <span>Actions</span>
          </div>
        </div>
        <span className="text-dark-500">Click and drag nodes to rearrange</span>
      </motion.div>
    </div>
  )
}

// Step card for How it Works
const StepCard = ({ number, title, description, visual, delay }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: number % 2 === 0 ? 50 : -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
    >
      <div className={`${number % 2 === 0 ? 'lg:order-2' : ''}`}>
        <motion.div 
          className="flex items-center gap-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: delay + 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl font-bold text-white">
            {number}
          </div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </motion.div>
        
        <motion.p 
          className="text-dark-300 text-lg leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: delay + 0.3 }}
        >
          {description}
        </motion.p>
      </div>
      
      <motion.div 
        className={`${number % 2 === 0 ? 'lg:order-1' : ''}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.4, type: 'spring' }}
      >
        {visual}
      </motion.div>
    </motion.div>
  )
}

// Persona card
const PersonaCard = ({ icon, title, description, features, delay }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl p-8 h-full"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-dark-400 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <motion.li 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: delay + 0.1 * i }}
            className="flex items-center gap-2 text-sm text-dark-300"
          >
            <span className="text-success">✓</span>
            {feature}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

// Trust item
const TrustItem = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="flex gap-4 items-start p-4 glass rounded-xl"
  >
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-xl flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-dark-400 text-sm">{description}</p>
    </div>
  </motion.div>
)

// Step component for how it works
const StepCardOld = ({ number, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex gap-6 items-start group"
    >
      <motion.div 
        className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-2xl font-bold text-white relative"
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        <div className="absolute inset-0 rounded-2xl bg-primary-500/50 blur-xl group-hover:blur-2xl transition-all duration-300" />
        <span className="relative z-10">{number}</span>
      </motion.div>
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-dark-400">{description}</p>
      </div>
    </motion.div>
  )
}

export default function Landing({ onGetStarted }) {
  const [isVisible, setIsVisible] = useState(false)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: "🎯",
      title: "Natural Language to Algo",
      description: "Turn plain-English strategies into structured trading rules with an AI assistant, then keep full control through a human-in-the-loop editor."
    },
    {
      icon: "🎨",
      title: "Visual DSL for Trading Logic",
      description: "Design entries, exits, time filters, and risk rules as a visual decision tree of conditions and actions that compiles to C++ for high-performance execution."
    },
    {
      icon: "⚙️",
      title: "Backtesting Engine",
      description: "High-speed C++ backtester running on historical OHLCV data, supporting indicators like RSI, EMA, MACD, Supertrend, and more."
    },
    {
      icon: "🔮",
      title: "Future: Live Trading & Marketplace",
      description: "The same strategy definition can power live trading via broker APIs and a marketplace where creators share or monetize their algos."
    }
  ]

  const personas = [
    {
      icon: "📊",
      title: "Retail Traders",
      description: "Want to systematize their ideas and stop manually clicking charts.",
      features: [
        "No coding required",
        "Visual strategy builder", 
        "Backtest before risking capital",
        "Transparent logic, no black-box"
      ]
    },
    {
      icon: "👥",
      title: "Creators & Influencers",
      description: "Want to publish strategies followers can allocate to, with transparent performance.",
      features: [
        "Share strategies publicly",
        "Track record verification",
        "Monetize your alpha",
        "Build trust with transparency"
      ]
    },
    {
      icon: "🔬",
      title: "Students & Builders",
      description: "Want a real, production-style algo stack to experiment with.",
      features: [
        "NLP → DSL → C++ pipeline",
        "Learn by building",
        "Modern tech stack",
        "Open experimentation"
      ]
    }
  ]

  return (
    <div className="min-h-screen mesh-bg relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="orb orb-purple w-96 h-96 -top-48 -left-48 animate-float-slow fixed" />
      <div className="orb orb-cyan w-80 h-80 top-1/4 -right-40 animate-float fixed" />
      <div className="orb orb-pink w-72 h-72 bottom-1/4 -left-36 animate-float-slower fixed" />
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-primary-500/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl">
              📈
            </div>
            <span className="text-xl font-bold gradient-text">AlgoTrade</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-dark-300 hover:text-white transition-colors">How it Works</a>
            <a href="#features" className="text-dark-300 hover:text-white transition-colors">Features</a>
            <a href="#who-its-for" className="text-dark-300 hover:text-white transition-colors">Who it's For</a>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="btn-primary"
          >
            <span>Get Started</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="min-h-screen flex items-center pt-20 px-6 relative"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-dark-300">AI-Powered • No Coding Required</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            >
              <span className="text-white">Build and backtest trading algos </span>
              <span className="gradient-text">without writing code.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-lg md:text-xl text-dark-400 mb-8 leading-relaxed"
            >
              Describe your strategy in plain English, refine it in a visual editor, 
              and backtest it on real market data before deploying it to live trading.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="btn-primary text-lg px-8 py-4 glow-purple"
              >
                <span className="flex items-center gap-2">
                  🚀 Start designing a strategy
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-lg px-8 py-4 flex items-center gap-2"
              >
                <span>▶️</span>
                <span>Watch 2-minute demo</span>
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: 50, label: "Indicators", suffix: "+" },
                { value: 10, label: "Actions", suffix: "+" },
                { value: 100, label: "Free to Start", suffix: "%" }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold gradient-text">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-dark-400 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual DSL Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl blur-3xl" />
            <div className="relative">
              <InteractiveDSLPreview />
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-dark-500 flex justify-center pt-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-xl text-dark-400 max-w-2xl mx-auto">
              From idea to backtest in three simple steps
            </p>
          </motion.div>

          <div className="space-y-24">
            {/* Step 1 */}
            <StepCard
              number={1}
              title="Describe your idea in natural language"
              description={`Just tell us what you want: "Enter long when RSI oversold before 2 PM; exit when RSI overbought or near close." Our AI assistant converts this into a draft strategy graph automatically.`}
              delay={0}
              visual={
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center text-sm">🤖</div>
                    <div className="glass rounded-xl p-4 flex-1">
                      <p className="text-dark-300 text-sm italic">
                        "Enter long when RSI(14) drops below 30 before 2 PM. Exit when RSI rises above 70 or it's after 3:30 PM."
                      </p>
                    </div>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-success text-sm"
                  >
                    <span>✓</span>
                    <span>AI generates strategy graph from your description</span>
                  </motion.div>
                </div>
              }
            />

            {/* Step 2 */}
            <StepCard
              number={2}
              title="Refine it in a visual rule editor"
              description="Edit conditions, thresholds, and branches visually. No code, just clear IF/THEN logic. Blue condition blocks evaluate market data, green action blocks execute trades."
              delay={0.2}
              visual={<InteractiveStrategyEditor />}
            />

            {/* Step 3 */}
            <StepCard
              number={3}
              title="Backtest on historical data"
              description="Run your strategy on years of OHLCV data and see performance, drawdowns, and trade-by-trade logs. Our high-speed C++ engine processes millions of bars in seconds."
              delay={0.4}
              visual={
                <div className="glass-card rounded-2xl p-6">
                  {/* Equity curve */}
                  <div className="mb-4">
                    <div className="text-sm text-dark-400 mb-2">Equity Curve (2 Years)</div>
                    <div className="h-32 bg-dark-900/50 rounded-xl p-3">
                      <svg viewBox="0 0 200 60" className="w-full h-full">
                        <motion.path
                          d="M 0 50 L 20 45 L 40 48 L 60 35 L 80 30 L 100 32 L 120 20 L 140 15 L 160 18 L 180 10 L 200 8"
                          stroke="url(#grad1)"
                          strokeWidth="2"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5 }}
                        />
                        <defs>
                          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Return", value: "+127%", color: "text-success" },
                      { label: "Max Drawdown", value: "-12%", color: "text-warning" },
                      { label: "Win Rate", value: "64%", color: "text-primary-400" }
                    ].map((stat, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="glass rounded-lg p-3 text-center"
                      >
                        <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-dark-400">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 }}
                    className="mt-4 text-xs text-dark-500 text-center"
                  >
                    🔜 Coming soon: One engine for both backtesting and live execution via broker APIs
                  </motion.div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-32 px-6 relative bg-dark-950/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Key <span className="gradient-text">Features</span>
            </h2>
            <p className="text-xl text-dark-400 max-w-2xl mx-auto">
              Everything you need to build, test, and deploy trading strategies
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} delay={i * 0.15} index={i} />
            ))}
          </div>

          {/* Feature bullets */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: "⚡", text: "C++ Performance" },
              { icon: "🎨", text: "Visual Editor" },
              { icon: "🔒", text: "Risk Management" },
              { icon: "📈", text: "50+ Indicators" }
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-dark-300 font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="who-its-for" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Who It's <span className="gradient-text">For</span>
            </h2>
            <p className="text-xl text-dark-400 max-w-2xl mx-auto">
              Built for traders who want transparency and control
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {personas.map((persona, i) => (
              <PersonaCard key={i} {...persona} delay={i * 0.15} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust, Safety & Control Section */}
      <section className="py-32 px-6 relative bg-dark-950/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trust, Safety & <span className="gradient-text">Control</span>
            </h2>
            <p className="text-xl text-dark-400 max-w-2xl mx-auto">
              You see every rule. AI never runs hidden code.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrustItem
              icon="👁️"
              title="Full Transparency"
              description="Every IF/ELSE rule is visible in the strategy graph. No black-box algorithms or hidden logic."
            />
            <TrustItem
              icon="🛡️"
              title="Risk Controls by Design"
              description="Position sizing, time windows, and exits are explicit in the strategy graph. Nothing hidden."
            />
            <TrustItem
              icon="🎓"
              title="Education First"
              description="Focus on learning and backtesting before risking real capital. Understand your strategy thoroughly."
            />
            <TrustItem
              icon="✅"
              title="Human-in-the-Loop"
              description="AI assists with strategy generation, but you review and approve every rule before it runs."
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 glass-card rounded-2xl p-8 text-center"
          >
            <p className="text-dark-300 text-lg">
              <span className="text-warning">⚠️</span> Live trading and marketplace features come with additional safeguards, 
              compliance checks, and risk acknowledgments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20" />
            
            <div className="relative z-10">
              <motion.h2 
                className="text-4xl md:text-5xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Ready to Build Your
                <br />
                <span className="gradient-text">First Algorithm?</span>
              </motion.h2>
              
              <motion.p 
                className="text-xl text-dark-300 mb-8 max-w-xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Join traders building transparent, backtested strategies without writing a single line of code.
              </motion.p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="btn-primary text-lg px-10 py-4 glow-purple"
              >
                <span className="flex items-center gap-2">
                  🚀 Start Designing — It's Free
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-dark-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm">
                📈
              </div>
              <span className="font-semibold text-white">AlgoTrade Democratizer</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-dark-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            
            <div className="text-sm text-dark-500">
              © 2026 AlgoTrade. Built with ❤️
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
