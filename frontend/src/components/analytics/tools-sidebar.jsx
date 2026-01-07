"use client"

import { Pen, Minus, Square, RotateCcw, Type, TrendingUp, Move } from "lucide-react"

export default function ToolsSidebar({ drawingMode, setDrawingMode }) {
  return (
    <div className="w-16 bg-[#0d1117] border-r border-[#1f1f1f] flex flex-col items-center py-4 gap-3 shadow-sm">
      <div
        className={`p-3 rounded cursor-pointer transition-all group relative ${
          drawingMode === "line"
            ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm"
            : "bg-[#161b22] text-[#9ca3af] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:text-[#d1d5db] hover:border-[#374151]"
        }`}
        onClick={() => setDrawingMode(drawingMode === "line" ? null : "line")}
        title="Trend Line (L)"
      >
        <Pen size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#0a0a0a] text-[#d1d5db] text-xs rounded border border-[#1f1f1f] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          Trend Line
        </span>
      </div>

      <div
        className={`p-3 rounded cursor-pointer transition-all group relative ${
          drawingMode === "horizontal"
            ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm"
            : "bg-[#161b22] text-[#9ca3af] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:text-[#d1d5db] hover:border-[#374151]"
        }`}
        onClick={() => setDrawingMode(drawingMode === "horizontal" ? null : "horizontal")}
        title="Support/Resistance (H)"
      >
        <Minus size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#0a0a0a] text-[#d1d5db] text-xs rounded border border-[#1f1f1f] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          Support/Resistance
        </span>
      </div>

      <div
        className={`p-3 rounded cursor-pointer transition-all group relative ${
          drawingMode === "rectangle"
            ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm"
            : "bg-[#161b22] text-[#9ca3af] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:text-[#d1d5db] hover:border-[#374151]"
        }`}
        onClick={() => setDrawingMode(drawingMode === "rectangle" ? null : "rectangle")}
        title="Rectangle (R)"
      >
        <Square size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#0a0a0a] text-[#d1d5db] text-xs rounded border border-[#1f1f1f] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          Rectangle
        </span>
      </div>

      <div
        className={`p-3 rounded cursor-pointer transition-all group relative ${
          drawingMode === "fibonacci"
            ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm"
            : "bg-[#161b22] text-[#9ca3af] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:text-[#d1d5db] hover:border-[#374151]"
        }`}
        onClick={() => setDrawingMode(drawingMode === "fibonacci" ? null : "fibonacci")}
        title="Fibonacci Retracement (F)"
      >
        <TrendingUp size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#0a0a0a] text-[#d1d5db] text-xs rounded border border-[#1f1f1f] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          Fibonacci Retracement
        </span>
      </div>

      <div
        className={`p-3 rounded cursor-pointer transition-all group relative ${
          drawingMode === "text"
            ? "bg-[#1f1f1f] text-white border border-[#374151] shadow-sm"
            : "bg-[#161b22] text-[#9ca3af] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:text-[#d1d5db] hover:border-[#374151]"
        }`}
        onClick={() => setDrawingMode(drawingMode === "text" ? null : "text")}
        title="Text Annotation (T)"
      >
        <Type size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#0a0a0a] text-[#d1d5db] text-xs rounded border border-[#1f1f1f] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          Text Annotation
        </span>
      </div>

      <div className="w-10 h-px bg-[#1f1f1f] my-2" />

      <button
        onClick={() => setDrawingMode(null)}
        className="p-3 rounded bg-[#161b22] text-[#9ca3af] border border-[#1f1f1f] hover:bg-[#1a1f26] hover:text-[#d1d5db] hover:border-[#374151] transition-all group relative"
        title="Clear All Drawings (Esc)"
      >
        <RotateCcw size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-[#0a0a0a] text-[#d1d5db] text-xs rounded border border-[#1f1f1f] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
          Clear All
        </span>
      </button>
    </div>
  )
}
