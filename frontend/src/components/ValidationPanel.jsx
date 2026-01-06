import { motion, AnimatePresence } from "framer-motion"

const ValidationSection = ({ type, items, icon, title, colorClass, borderClass, bgClass }) => {
  if (!items || items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-6 border ${borderClass} ${bgClass}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.span 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl"
        >
          {icon}
        </motion.span>
        <h3 className={`text-lg font-semibold ${colorClass}`}>{title}</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass} border ${borderClass}`}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <motion.li 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`text-sm ${colorClass.replace('text-', 'text-').replace('-400', '-300')} flex gap-3 items-start p-3 rounded-xl glass`}
          >
            <span className="mt-0.5">•</span>
            <span className="leading-relaxed">{item}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function ValidationPanel({ strategy }) {
  if (!strategy) return null

  const hasErrors = strategy.validationErrors?.length > 0
  const hasWarnings = strategy.warnings?.length > 0
  const hasSuggestions = strategy.suggestedEdits?.length > 0
  const isValid = strategy.isValid && !hasErrors

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {/* Errors */}
        <ValidationSection
          type="error"
          items={strategy.validationErrors}
          icon="❌"
          title="Errors"
          colorClass="text-danger"
          borderClass="border-danger/30"
          bgClass="bg-danger/5"
        />

        {/* Warnings */}
        <ValidationSection
          type="warning"
          items={strategy.warnings}
          icon="⚠️"
          title="Warnings"
          colorClass="text-warning"
          borderClass="border-warning/30"
          bgClass="bg-warning/5"
        />

        {/* Suggestions */}
        <ValidationSection
          type="suggestion"
          items={strategy.suggestedEdits}
          icon="💡"
          title="Suggestions"
          colorClass="text-accent-400"
          borderClass="border-accent-500/30"
          bgClass="bg-accent-500/5"
        />

        {/* Success Message */}
        {isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-6 border border-success/30 bg-success/5"
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-2xl"
              >
                ✓
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold text-success">Strategy Valid</h3>
                <p className="text-sm text-success/80">
                  Your strategy has been successfully interpreted and validated.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
