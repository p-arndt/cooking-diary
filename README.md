# Cooking Diary

<p align="center">
  <img src="src/lib/assets/logo.png" alt="Cooking Diary Logo" width="200" />
</p>

A personal cooking diary to track your meals, discover patterns, and get meal suggestions based on your cooking history.

## Table of Contents

- [🌟 Features](#-features)
- [🚀 Quickstart](#-quickstart)
- [⚙️ Environment Variables](#-environment-variables)
- [🤝 Contributing](#-contributing)

## 🌟 Features

### Meal Management

- Create and organize your meal library
- Add photos, prep time, cook time, and difficulty levels
- Categorize meals (e.g., Pasta, Vegan, Dessert)
- Search and filter your meals

### Cooking Diary

- Log when you cooked each meal
- Add notes and photos to each cooking session
- View your cooking history in timeline or calendar view
- Track how many times you've cooked each meal

### Smart Meal Suggestions

- Get personalized meal suggestions based on your cooking patterns
- Exclude recently cooked meals
- Use day-of-week patterns to suggest meals you typically cook on specific days
- Exclude categories you don't want to see

### Cooking Patterns & Analytics

- View your cooking patterns by day of week
- See which categories you cook most frequently
- Track your cooking trends over time

### User Features

- Email/password authentication with Better Auth
- Password reset via email
- Change password functionality
- Personal settings and preferences
- Multi-language support (English, German)

## 🚀 Quickstart

### Option 1: Docker Compose (recommended)

Steps:

1. Copy environment variables from `.env.example` to `.env` (if available)
2. Adjust your environment variables (see [Environment Variables](#-environment-variables))
3. Start the application:

   ```bash
   docker compose up -d
   ```

4. Open **[http://localhost:3000](http://localhost:3000)**

### Option 2: Local Development

```bash
git clone <repo-url>
cd cooking-diary
pnpm install
pnpm run dev
```

Then open the dev server (usually **[http://localhost:5173](http://localhost:5173)**).

### Database Setup

Make sure you have PostgreSQL running, then:

```bash
# Push database schema
pnpm run db:push

# Or generate and run migrations
pnpm run db:generate
pnpm run db:migrate
```

## ⚙️ Environment Variables

Use `.env` or set them directly in your environment.
Keep secrets private and secure.

### Core Settings

| Variable            | What it controls               | Example                 |
| ------------------- | ------------------------------ | ----------------------- |
| BETTER_AUTH_SECRET  | Secret for signing auth tokens | random hex              |
| BETTER_AUTH_URL     | URL of your app instance       | `http://localhost:3000` |
| POSTGRES_HOST       | Database host                  | `localhost`             |
| POSTGRES_PORT       | Database port                  | `5432`                  |
| POSTGRES_USER       | Database user                  | `cooking`               |
| POSTGRES_PASSWORD   | Database password              | `your-password`         |
| POSTGRES_DB         | Database name                  | `cooking_diary`         |

### SMTP / Email

Configure SMTP settings for password reset emails:

| Variable                  | Purpose                      | Example                    |
| ------------------------- | ---------------------------- | -------------------------- |
| SMTP_HOST                 | SMTP server                  | `smtp.gmail.com`           |
| SMTP_PORT                 | SMTP port (default: 587)     | `587`                      |
| SMTP_USER / SMTP_USERNAME | Login name                   | `your-email@example.com`   |
| SMTP_PASSWORD             | Password                     | `your-smtp-password`      |
| SMTP_FROM                 | Sender address               | `noreply@example.com`      |

**Password Reset Emails**: When users request a password reset, the system will send an email using the configured SMTP settings. If SMTP is not configured, the reset link will be logged to the console as a fallback.

### Example `.env` file

```env
# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=cooking
POSTGRES_PASSWORD=your-password
POSTGRES_DB=cooking_diary

# SMTP (Optional - for password reset emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com
```

## 🛠️ Development

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run check` - Type check with Svelte
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Lint code
- `pnpm run test` - Run tests
- `pnpm run db:push` - Push database schema changes
- `pnpm run db:generate` - Generate database migrations
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:studio` - Open Drizzle Studio

### Tech Stack

- **Framework**: SvelteKit 2.x with Svelte 5
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-svelte
- **Email**: Nodemailer
- **Internationalization**: Paraglide (inlang)

## 🤝 Contributing

- Open an issue for bigger changes
- Keep PRs focused
- Include tests when adding new behavior
- Follow formatting (`pnpm run format`)

---

Cooking Diary helps you track your meals, discover patterns, and get inspired for your next cooking adventure.
