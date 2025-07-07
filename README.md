# NBC 2020 Structural Loads App

A comprehensive web application for structural engineers to calculate and understand design loads according to NBC 2020 Part 4, with educational components and monetized advanced content.

## Features

### 🔢 Load Calculators

- **Dead Load Calculator** - Calculate dead loads with comprehensive material database
- **Live Load Calculator** - Live loads with occupancy-based reductions (NBC 4.1.5)
- **Snow Load Calculator** - Snow loads with exposure and slope factors
- **Wind Load Calculator** - Wind pressures and dynamic effects
- **Seismic Load Calculator** - Seismic forces and response spectrum analysis

### 📚 Educational Content

- **Fundamental Concepts** - Introduction to structural loads and limit states design
- **Dead Loads** - Understanding permanent loads and material weights
- **Live Loads** - Variable loads and reduction calculations
- **Snow Loads** - Snow load fundamentals and shape coefficients
- **Wind Loads** - Wind climate and pressure coefficients
- **Seismic Loads** - Seismic hazard mapping and response spectrum

### 🎥 Video Learning

- **Free Preview Content** - Introduction videos and basic examples
- **Premium Courses** - Advanced video series with detailed explanations
- **Subscription Options** - Monthly and annual access to all content

### 📁 Project Management

- Create and manage multiple structural projects
- Save calculations and export to PDF/Excel
- Track project history and collaboration

### 📋 Code Reference

- Quick access to NBC 2020 Part 4 clauses
- Material property databases
- Load combination examples

## Technology Stack

- **Frontend**: Remix (React framework)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd nbc-loads-app
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## Project Structure

```
app/
├── components/          # Reusable React components
│   └── Navigation.tsx   # Main navigation component
├── routes/              # Remix routes (pages)
│   ├── _index.tsx       # Dashboard/homepage
│   ├── calculators.tsx  # Calculator overview
│   ├── calculators.dead-load.tsx  # Dead load calculator
│   ├── education.tsx    # Educational content overview
│   ├── projects.tsx     # Project management
│   └── videos.tsx       # Video learning platform
├── root.tsx             # Root layout component
└── tailwind.css         # Global styles
```

## Key Features

### Load Calculators

Each calculator provides:

- Step-by-step input guidance
- Real-time calculations
- Code references (NBC 2020)
- Professional reporting
- Material databases

### Educational System

- Progressive learning path
- Interactive content
- Quizzes and assessments
- Progress tracking
- Certificates upon completion

### Monetization

- Freemium model with basic calculators free
- Premium video courses ($29-79)
- Monthly subscription ($19/month)
- Annual subscription ($199/year, save 12%)

## NBC 2020 Compliance

All calculations and educational content are based on:

- NBC 2020 Part 4 (Structural Design)
- Current material property tables
- Latest load combination requirements
- Canadian structural design practices

## Development Phases

### ✅ Phase 1 (Current)

- Core app structure and navigation
- Dashboard and main pages
- Dead load calculator with material database
- Educational content framework
- Video learning platform structure
- Project management interface

### 🔄 Phase 2 (Next)

- Complete all load calculators (Live, Snow, Wind, Seismic)
- Interactive educational content with quizzes
- User authentication and progress tracking
- PDF/Excel export functionality

### 📋 Phase 3 (Future)

- Payment integration for premium content
- Advanced collaboration tools
- Mobile app development
- API integrations with CAD/BIM software

## Deployment

### Netlify Deployment

This application is configured for easy deployment to Netlify:

#### Manual Deployment

1. Build the application:

```bash
npm run build
```

2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `public`
5. Deploy

#### Automatic Deployment

1. Connect your Git repository to Netlify
2. Netlify will automatically detect the `netlify.toml` configuration
3. Every push to your main branch will trigger a new deployment

#### Environment Variables

If you need environment variables, add them in your Netlify dashboard under:
Site settings → Environment variables

#### Build Settings

The project includes:

- `netlify.toml` - Netlify configuration
- `public/_redirects` - Routing configuration
- Netlify Remix adapter for serverless functions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions about structural engineering content or NBC 2020 compliance, please consult with a licensed professional engineer.

---

**Disclaimer**: This application is for educational and professional use. All calculations should be verified by a licensed structural engineer before use in actual design projects.
