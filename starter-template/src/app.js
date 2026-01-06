import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

// Import routes
import strategyRoutes from "./routes/strategyRoutes.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Routes declaration
app.use("/api/v1/strategies", strategyRoutes)

// http://localhost:8000/api/v1/strategies/interpret
// http://localhost:8000/api/v1/strategies/my-strategies
// http://localhost:8000/api/v1/strategies/:id

export { app }