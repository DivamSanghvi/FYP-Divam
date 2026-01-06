export default function ValidationPanel({ strategy }) {
  if (!strategy) return null

  return (
    <div className="space-y-4">
      {/* Errors */}
      {strategy.validationErrors && strategy.validationErrors.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-red-500/30 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-3">❌ Errors</h3>
          <ul className="space-y-2">
            {strategy.validationErrors.map((err, i) => (
              <li key={i} className="text-sm text-red-300 flex gap-2">
                <span>•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {strategy.warnings && strategy.warnings.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-yellow-500/30 p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">⚠️ Warnings</h3>
          <ul className="space-y-2">
            {strategy.warnings.map((warn, i) => (
              <li key={i} className="text-sm text-yellow-300 flex gap-2">
                <span>•</span>
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {strategy.suggestedEdits && strategy.suggestedEdits.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-blue-500/30 p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 Suggestions</h3>
          <ul className="space-y-2">
            {strategy.suggestedEdits.map((suggestion, i) => (
              <li key={i} className="text-sm text-blue-300 flex gap-2">
                <span>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {strategy.isValid && (
        <div className="bg-slate-800 rounded-lg border border-green-500/30 p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-2">✓ Strategy Valid</h3>
          <p className="text-sm text-green-300">
            Your strategy has been successfully interpreted and validated.
          </p>
        </div>
      )}
    </div>
  )
}
