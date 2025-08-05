# Reconaut - AI-Powered Building Assessment Platform

![Reconaut Logo](public/logo.png) <!-- Add your logo path -->

A drone-based AI solution for automated building damage evaluation and repair estimation. Built with cutting-edge technology to revolutionize property inspections.

## Technologies Used

- ⚡ **Vite** - Next-gen frontend tooling
- 🎨 **ShadCN/ui** - Beautifully designed components
- ✨ **Framer Motion** - Smooth animations
- 📱 **React** - Modern frontend framework
- 🚀 **TypeScript** - Type-safe JavaScript
- 🛠️ **TanStack Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js v18+ (recommended v20)
- npm v9+ or pnpm v8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/reconaut/web-app.git
   cd web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your API keys and configuration.

### Running the Development Server

```bash
npm run dev
```
or
```bash
pnpm dev
```

The application will be available at:
[http://localhost:5173](http://localhost:5173)

## Project Structure

```
reconaut-web/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   ├── lib/           # Utilities and helpers
│   ├── routes/        # Application routes
│   ├── styles/        # Global styles
│   └── assets/        # Images, icons, etc.
├── .env.example       # Environment variables template
├── vite.config.ts     # Vite configuration
└── tsconfig.json      # TypeScript configuration
```

## Available Scripts

- `dev` - Start development server
- `build` - Create production build
- `preview` - Preview production build locally
- `lint` - Run ESLint
- `type-check` - Verify TypeScript types

## Deployment

For production deployment:

```bash
npm run build
```

The build artifacts will be in the `dist/` directory, ready to be deployed to your hosting service of choice.

## Contributing

We welcome contributions! Please fork the repository and create a pull request with your changes.

## License

[MIT](LICENSE) © 2024 Reconaut
```
- API integration details
- Drone image processing workflow
- Special configuration for your AI services?
