# 🏆 Challengr - Community Challenge Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

> **Join exciting challenges, track your progress, and connect with a community of achievers. From sports to arts, level up your skills with Challengr!**

## 🚀 Features

### 🎯 Challenge System
- **Multiple Categories**: Sports, Drawing, Music, Cooking, Writing, Coding, Gardening
- **Difficulty Levels**: From Beginner to Expert (5 levels)
- **Custom Challenges**: Create your own challenges with media support
- **Progress Tracking**: Real-time progress monitoring and statistics
- **Points & Rewards**: Earn points for completing challenges
- **User Levels**: Level up based on your achievements

### 👥 Community Features
- **Activity Feed**: See real-time community interactions and achievements
- **Challenge Discussions**: Comment and interact with other participants
- **Validation System**: Community-driven validation of challenge submissions
- **User Profiles**: Track your progress and showcase achievements
- **Social Interactions**: Like, comment, and share challenge posts

### 🎓 Coaching & Premium Content
- **Expert Coaching**: Access premium coaching content and tutorials
- **Video & Image Tutorials**: Rich media content for skill development
- **Category-Specific Guidance**: Tailored coaching for each challenge category
- **Premium Features**: Advanced content for serious learners

### 🛡️ Admin & Moderation
- **Content Management**: Admin dashboard for managing challenges and coaching content
- **Validation Queue**: Moderation system for user submissions
- **User Management**: Comprehensive user and profile management
- **Analytics**: Track community engagement and challenge completion rates

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management with validation

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Database-level security
- **Real-time subscriptions** - Live updates and notifications
- **Authentication** - Secure user management
- **File Storage** - Media upload and management

### Development Tools
- **ESLint** - Code linting and quality
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Lovable Integration** - AI-assisted development

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase account** (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd challengr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials in `.env.local`

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

### Database Setup

1. **Import the database schema**
   - Navigate to your Supabase project dashboard
   - Go to SQL Editor
   - Run the SQL files in `database-export/` in order:
     - `00_full_export.sql` (schema and static data)
     - `01_transaction_data.sql` (transactional data)

2. **Set up authentication trigger**
   ```sql
   -- Create trigger for new user profiles
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
   ```

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🏗️ Project Structure

```
challengr/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── challenges/     # Challenge-related components
│   │   ├── coaching/       # Coaching system components
│   │   ├── layout/         # Layout and navigation
│   │   ├── messages/       # Messaging system
│   │   ├── premium/        # Premium features
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── integrations/       # External service integrations
│   └── assets/             # Static assets
├── supabase/               # Database migrations and functions
├── public/                 # Public assets
└── database-export/        # Database schema and data
```

## 🎨 Key Components

### Challenge System
- **ChallengeDetailDialog** - Detailed view of challenges
- **CreateChallengeDialog** - Create custom challenges
- **ChallengeFeed** - Community activity feed
- **ValidationQueue** - Submission validation system

### User Experience
- **AuthProvider** - Authentication context and management
- **Layout** - Main application layout with navigation
- **Home** - Dashboard with user stats and active challenges
- **Profile** - User profile management

### Admin Features
- **AdminDashboard** - Administrative controls
- **AdminCoachingManager** - Manage coaching content
- **ValidationQueue** - Moderate user submissions

## 🔧 Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration
- **Authentication**: Email/password, social logins
- **Database**: PostgreSQL with RLS policies
- **Storage**: File uploads for challenge media
- **Real-time**: Live updates for community features

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

### Supabase Production
1. Create production Supabase project
2. Import database schema
3. Update environment variables
4. Configure authentication providers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Supabase** for the excellent backend platform
- **Lovable** for AI-assisted development tools
- **React community** for the amazing ecosystem

## 📞 Support

For support, email support@challengr.app or join our community Discord.

---

<div align="center">
  <strong>Built with ❤️ by the Challengr team</strong>
</div>