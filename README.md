# 🏆 Challengr

A modern, gamified challenge platform that motivates users to push their limits, track progress, and achieve their goals through community-driven challenges.

![Challengr Preview](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-18+-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e)

## ✨ Features

- **🎯 Challenge System**: Create and participate in various types of challenges
- **🏅 Gamification**: Points, badges, and leaderboards to keep users engaged
- **👥 Community**: Social features with discussions and peer validation
- **📊 Progress Tracking**: Visual progress indicators and achievement tracking
- **🎨 Multiple Categories**: Sports, Art, Music, Coding, Writing, Cooking, Gardening
- **💎 Premium Features**: Advanced coaching content and exclusive challenges
- **🔐 User Authentication**: Secure login with profile management
- **📱 Responsive Design**: Optimized for desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone https://github.com/lucasjolym6/challengr.git
cd challengr

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible components
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data security
- **Supabase Auth** - Authentication system
- **Supabase Storage** - File storage

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── challenges/     # Challenge-related components
│   ├── coaching/       # Coaching content components
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
├── pages/              # Page components
└── assets/             # Static assets
```

## 🗄️ Database Schema

### Key Tables
- `challenges` - Challenge definitions
- `challenge_categories` - Challenge categories
- `user_challenges` - User progress tracking
- `profiles` - User profiles
- `posts` - Community posts and submissions
- `coaching_content` - Premium coaching materials

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Database
npm run db:generate  # Generate TypeScript types from Supabase
npm run db:push      # Push migrations to Supabase
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Other Platforms
The application can be deployed to any platform that supports static sites:
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

Built with ❤️ by the Challengr team
