"use client"

import { useEffect, useRef } from "react"

export default function DrawingCanvas({ containerRef, drawingMode }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const lines = useRef([])
  const textInputRef = useRef(null)
  const textPosition = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight - 96 // Subtract volume chart height

    const redraw = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      lines.current.forEach((shape) => {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.lineWidth = 1.5
        ctx.setLineDash([])
        ctx.font = "12px monospace"
        
        if (shape.type === "rectangle") {
          const width = shape.endX - shape.startX
          const height = shape.endY - shape.startY
          ctx.strokeRect(shape.startX, shape.startY, width, height)
        } else if (shape.type === "horizontal") {
          // Draw horizontal line across full width
          ctx.beginPath()
          ctx.moveTo(0, shape.startY)
          ctx.lineTo(canvas.width, shape.startY)
          ctx.stroke()
        } else if (shape.type === "fibonacci") {
          // Draw fibonacci retracement levels
          const fibStartY = Math.min(shape.startY, shape.endY)
          const fibEndY = Math.max(shape.startY, shape.endY)
          const range = fibEndY - fibStartY
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
          
          levels.forEach((level) => {
            const y = fibStartY + range * level
            ctx.strokeStyle = level === 0.5 ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)"
            ctx.lineWidth = level === 0.5 ? 2 : 1
            ctx.setLineDash(level === 0.5 ? [] : [5, 5])
            ctx.beginPath()
            ctx.moveTo(shape.startX, y)
            ctx.lineTo(shape.endX, y)
            ctx.stroke()
            
            // Draw level labels
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
            ctx.fillText(`${(level * 100).toFixed(1)}%`, shape.endX + 5, y + 4)
          })
        } else if (shape.type === "text") {
          // Draw text annotation with background
          const text = shape.text || ""
          ctx.font = "12px system-ui, -apple-system, sans-serif"
          ctx.textBaseline = "top"
          
          // Measure text
          const metrics = ctx.measureText(text)
          const textWidth = metrics.width
          const textHeight = 16
          const padding = 4
          
          // Draw background
          ctx.fillStyle = "rgba(10, 10, 10, 0.85)"
          ctx.fillRect(
            shape.x - padding,
            shape.y - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          )
          
          // Draw border
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
          ctx.lineWidth = 1
          ctx.strokeRect(
            shape.x - padding,
            shape.y - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          )
          
          // Draw text
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
          ctx.fillText(text, shape.x, shape.y)
        } else {
          // Draw regular line
          ctx.beginPath()
          ctx.moveTo(shape.startX, shape.startY)
          ctx.lineTo(shape.endX, shape.endY)
          ctx.stroke()
        }
      })
    }

    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect()
      startX.current = e.clientX - rect.left
      startY.current = e.clientY - rect.top
      
      if (drawingMode === "text") {
        // For text, create input immediately on click
        isDrawing.current = false // Don't track as drawing
        createTextInput(startX.current, startY.current, e)
        return
      }
      
      isDrawing.current = true
    }
    
    const createTextInput = (x, y, e) => {
      // Remove any existing text input safely
      const existingInput = document.querySelector('.chart-text-input')
      if (existingInput) {
        try {
          // Check if element is still in the DOM
          if (document.body.contains(existingInput)) {
            existingInput.remove()
          }
        } catch (error) {
          // Element was already removed, ignore
          console.debug("Input element already removed")
        }
      }
      
      const containerRect = container.getBoundingClientRect()
      const input = document.createElement("input")
      input.className = "chart-text-input"
      input.type = "text"
      input.style.position = "fixed"
      input.style.left = `${x + containerRect.left}px`
      input.style.top = `${y + containerRect.top}px`
      input.style.background = "rgba(10, 10, 10, 0.95)"
      input.style.color = "#ffffff"
      input.style.border = "1px solid #374151"
      input.style.borderRadius = "4px"
      input.style.padding = "6px 10px"
      input.style.fontSize = "12px"
      input.style.fontFamily = "system-ui, -apple-system, sans-serif"
      input.style.zIndex = "10000"
      input.style.minWidth = "120px"
      input.style.outline = "none"
      input.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)"
      input.placeholder = "Enter text..."
      
      let isProcessed = false
      
      const removeInput = () => {
        if (isProcessed) return
        isProcessed = true
        
        // Remove event listeners
        input.removeEventListener("keydown", handleTextSubmit)
        input.removeEventListener("blur", handleBlur)
        
        // Remove from DOM if it still exists
        if (input.parentNode) {
          input.parentNode.removeChild(input)
        }
      }
      
      const handleTextSubmit = (keyEvent) => {
        if (isProcessed) return
        
        if (keyEvent.key === "Enter" && input.value.trim()) {
          lines.current.push({
            type: "text",
            x: x,
            y: y,
            text: input.value.trim(),
          })
          removeInput()
          redraw()
          textPosition.current = null
        } else if (keyEvent.key === "Escape") {
          removeInput()
          textPosition.current = null
        }
      }
      
      const handleBlur = () => {
        if (isProcessed) return
        
        if (input.value.trim()) {
          lines.current.push({
            type: "text",
            x: x,
            y: y,
            text: input.value.trim(),
          })
          redraw()
        }
        removeInput()
        textPosition.current = null
      }
      
      input.addEventListener("keydown", handleTextSubmit)
      input.addEventListener("blur", handleBlur)
      
      document.body.appendChild(input)
      input.focus()
      
      // Prevent default to avoid issues
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleMouseMove = (e) => {
      if (!isDrawing.current || !drawingMode) return

      const rect = canvas.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top

      redraw()

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 1.5
      ctx.setLineDash([])

      if (drawingMode === "line") {
        ctx.beginPath()
        ctx.moveTo(startX.current, startY.current)
        ctx.lineTo(currentX, currentY)
        ctx.stroke()
      } else if (drawingMode === "horizontal") {
        ctx.beginPath()
        ctx.moveTo(0, startY.current)
        ctx.lineTo(canvas.width, startY.current)
        ctx.stroke()
      } else if (drawingMode === "rectangle") {
        const width = currentX - startX.current
        const height = currentY - startY.current
        ctx.strokeRect(startX.current, startY.current, width, height)
      } else if (drawingMode === "fibonacci") {
        // Preview fibonacci during drawing
        const fibStartY = Math.min(startY.current, currentY)
        const fibEndY = Math.max(startY.current, currentY)
        const range = fibEndY - fibStartY
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
        
        levels.forEach((level) => {
          const y = fibStartY + range * level
          ctx.strokeStyle = level === 0.5 ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)"
          ctx.lineWidth = level === 0.5 ? 2 : 1
          ctx.setLineDash(level === 0.5 ? [] : [5, 5])
          ctx.beginPath()
          ctx.moveTo(startX.current, y)
          ctx.lineTo(currentX, y)
          ctx.stroke()
        })
      }
    }

    const handleMouseUp = (e) => {
      if (!isDrawing.current) return

      const rect = canvas.getBoundingClientRect()
      const endX = e.clientX - rect.left
      const endY = e.clientY - rect.top

      if (drawingMode === "line") {
        lines.current.push({
          type: drawingMode,
          startX: startX.current,
          startY: startY.current,
          endX,
          endY,
        })
      } else if (drawingMode === "horizontal") {
        lines.current.push({
          type: "horizontal",
          startX: 0,
          startY: startY.current,
          endX: canvas.width,
          endY: startY.current,
        })
      } else if (drawingMode === "rectangle") {
        lines.current.push({
          type: "rectangle",
          startX: startX.current,
          startY: startY.current,
          endX,
          endY,
        })
      } else if (drawingMode === "fibonacci") {
        lines.current.push({
          type: "fibonacci",
          startX: startX.current,
          startY: startY.current,
          endX,
          endY,
        })
      }

      isDrawing.current = false
      if (drawingMode !== "text") {
        redraw()
      }
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("mouseleave", handleMouseUp)

    // Redraw all existing shapes when canvas is set up or drawing mode changes
    redraw()

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("mouseleave", handleMouseUp)
    }
  }, [drawingMode, containerRef])

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className={`absolute top-0 left-0 ${
          drawingMode === "text" ? "cursor-text" : "cursor-crosshair"
        }`}
      />
    </>
  )
}
