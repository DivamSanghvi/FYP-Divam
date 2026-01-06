import mongoose from "mongoose"

// Expression operand schema (for left/right in binary expression)
const operandSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ["numberLiteral", "stringLiteral", "identifier", "funcCall"],
    required: true
  },
  value: mongoose.Schema.Types.Mixed, // for numberLiteral or stringLiteral
  name: String, // for identifier or funcCall
  args: [mongoose.Schema.Types.Mixed], // for funcCall - array of operand objects
  offset: { // optional time offset
    unit: String, // "bars", "minutes", "hours", "days", "weeks", "months", "years"
    value: Number
  }
}, { _id: false })

// Binary expression schema for condition nodes
const binaryExprSchema = new mongoose.Schema({
  kind: {
    type: String,
    required: true
  },
  op: {
    type: String,
    required: true
  },
  left: mongoose.Schema.Types.Mixed, // operand object
  right: mongoose.Schema.Types.Mixed // operand object
}, { _id: false })

// Node schema supporting both condition and action nodes
const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["condition", "action"],
    required: true
  },
  
  // For condition nodes
  expr: binaryExprSchema,
  nextIfTrue: String, // node ID or null
  nextIfFalse: String, // node ID or null
  
  // For action nodes
  actionType: {
    type: String,
    enum: [
      "ENTER_LONG", "ENTER_SHORT", "EXIT_LONG", "EXIT_SHORT", "EXIT_ALL",
      "SET_STOP", "SET_TRAILING_STOP", "SET_TAKE_PROFIT",
      "CANCEL_ORDERS", "NO_ACTION"
    ]
  },
  symbol: String, // symbol for this action (uses top-level if null)
  qty: mongoose.Schema.Types.Mixed, // quantity (number or null)
  qty_type: {
    type: String,
    enum: ["ABSOLUTE", "PERCENT_EQUITY", "PERCENT_POSITION", null]
  },
  params: mongoose.Schema.Types.Mixed, // extra params like stop_price, trail_percent
  next: String // next node ID or null for terminal
}, { _id: false })

const strategySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  description: String,
  userQuery: {
    type: String,
    required: true
  },
  timeframe: {
    type: String,
    enum: ["1M", "5M", "15M", "1H", "4H", "1D", "1W"],
    required: true
  },
  entryNode: {
    type: String,
    required: true
  },
  nodes: [nodeSchema],
  
  // Metadata
  warnings: [String],
  suggestedEdits: [String],
  isValid: {
    type: Boolean,
    default: true
  },
  validationErrors: [String],
  
  // LLM source
  llmModel: String,
  llmPromptVersion: String,
  
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model("Strategy", strategySchema)
