import React from 'react'

// Arrow/Connector Component for graph edges
export const Arrow = ({ 
  fromPos, 
  toPos, 
  label = "", 
  isHighlighted = false 
}) => {
  if (!fromPos || !toPos) return null

  const x1 = fromPos.x
  const y1 = fromPos.y
  const x2 = toPos.x
  const y2 = toPos.y

  // Calculate arrow direction
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Midpoint for label
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  return (
    <g>
      {/* Line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isHighlighted ? "#ef4444" : "#999"}
        strokeWidth={isHighlighted ? 3 : 2}
        markerEnd={isHighlighted ? "url(#arrowRed)" : "url(#arrow)"}
      />
      
      {/* Label (TRUE/FALSE) */}
      {label && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill={isHighlighted ? "#ef4444" : "#666"}
          className="pointer-events-none"
        >
          {label}
        </text>
      )}
    </g>
  )
}

// SVG wrapper for arrow markers
export const ArrowMarkers = () => {
  return (
    <defs>
      <marker
        id="arrow"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="#999" />
      </marker>
      <marker
        id="arrowRed"
        markerWidth="10"
        markerHeight="10"
        refX="9"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
      </marker>
    </defs>
  )
}

export default Arrow
