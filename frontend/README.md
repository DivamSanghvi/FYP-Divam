# Chai Aur Code - Frontend

Next.js frontend for Chai Aur Code project.

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Next.js pages
│   ├── services/        # API service calls
│   ├── utils/           # Utility functions
│   ├── constants/       # App constants
│   ├── hooks/           # Custom React hooks
│   └── styles/          # Global styles
├── package.json
├── next.config.js
├── tailwind.config.js
└── jsconfig.json
```

## Environment Variables

Create a `.env.local` file:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Technologies

- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Zustand** - State management
