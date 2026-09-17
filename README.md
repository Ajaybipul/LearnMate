# Learnmade AI

An AI-first learning platform built on the MERN stack (MongoDB, Express, React, Node.js). Nearly everything beyond raw CRUD is generated dynamically by Google's Gemini API — including, now, the courses themselves.

## Features

- **AI Tutor** — lesson-scoped chat that streams responses, grounded in the exact lesson the student is on
- **AI Course Generation** — an instructor types only a course name; Gemini generates the description, category, and every lesson's full content automatically. Manual course creation (with real video links) is available as a secondary option.
- **AI Quiz Generation** — quizzes generated on demand from a lesson's content
- **Content Summarization** — key points + flashcards generated from a lesson's content
- **Personalized Learning Path** — an AI-generated, ordered roadmap built from the student's stated goal and the real, current course catalog
- **AI Video Generation (Veo)** — instructors can optionally generate a real ~2-minute video per lesson using Google's Veo model, chained from multiple short clips. Explicit opt-in only, with the estimated cost shown before generating — see "About AI video generation" below before you try this.
- **General Chatbot** — platform-wide help assistant, grounded in the live course catalog so it answers accurately about what courses actually exist. Separate from the lesson-scoped AI Tutor.
- **Student / Instructor separation** — genuinely different dashboards, navigation, and permissions per role, not just a `role` field.
- **User Profile** — aggregates enrollments, progress, quiz history, and learning path for the logged-in user.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express (MVC architecture) |
| Database | MongoDB (via Mongoose) |
| AI (text) | Google Gemini API (`gemini-2.5-flash` by default) |
| AI (video) | Google Veo (`veo-3.1-fast-generate-001` by default) |
| Auth | JWT |

## Project structure

```
learnmade-ai/
  backend/
    config/          # MongoDB connection
    models/          # Mongoose schemas, incl. VideoJob for async Veo generation
    controllers/      # Route handlers - all business logic + AI orchestration
    routes/          # Express routers
    middleware/       # auth (JWT) + error handling
    services/
      geminiService.js    # all Gemini text-generation calls go through here
      courseGenService.js # the one place that defines "generate a course from a name" - used by both the API and the seed script
      veoService.js       # Veo video generation - scene planning, job submission, polling, streaming
    scripts/         # seed.js - generates starter courses via AI, not hardcoded
    server.js
  frontend/
    src/
      pages/
        Dashboard.jsx           # student course catalog
        InstructorDashboard.jsx # instructor's authored courses
        CreateCourse.jsx        # AI-generate (name only) + manual (full form) tabs
        CourseStudents.jsx      # instructor view of enrollment/progress
        CoursePlayer.jsx        # lessons + video pane + AI Tutor/Quiz/Summary tabs
        LearningPath.jsx, Profile.jsx, Login.jsx, Register.jsx
      components/
        Navbar.jsx        # role-aware links
        RoleRoute.jsx      # route guard by role, on top of ProtectedRoute
        ChatbotWidget.jsx
      context/AuthContext.jsx
      services/api.js     # axios instance + SSE streaming helper
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string (local or Atlas)
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — get one from https://aistudio.google.com/api-keys
- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`
- `VEO_MODEL` / `VEO_COST_PER_SECOND` — only needed if you plan to try AI video generation; read the section below first

Seed demo data — this now calls Gemini to *generate* two starter courses (not hardcoded text), so make sure `GEMINI_API_KEY` is set before running it:

```bash
node scripts/seed.js
```

Run the server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 3. Try it

- Register as an **instructor** → you'll land on "My Courses" → click **Create Course** → **Generate with AI** tab → type a course name → done, a full course with real lesson content appears
- Register as a **student** (or use the seeded instructor: `instructor@learnmade.ai` / `password123`, then register a separate student account) → browse the catalog → open a course
- Ask the **AI Tutor** a question about a lesson — streams a real, context-aware answer
- Generate a **quiz** and a **summary** for a lesson — both generated live and cached after first generation
- Go to **Learning Path**, describe a goal, get a roadmap built from the real courses in your database
- Check the **Profile** page — aggregates enrollments, progress, quiz history, learning path
- Try the floating **chatbot** — ask "what courses do you have?" — it answers from the real, live catalog
- As the instructor, open a course you created and check **View students** to see enrollment/progress

## About AI video generation (read before trying it)

This is the most experimental and expensive part of the project. Before you click "Generate AI video":

- **There is no free tier for Veo.** Every generation is billed from the first second, regardless of whether you're on the Gemini free tier for text.
- **A true 3-minute video isn't achievable.** Veo produces ~8-second clips, chainable up to roughly 20 clips (~2 minutes 20 seconds) — the app targets ~2 minutes and is capped at Veo's realistic ceiling.
- **Cost is real and shown upfront**: expect roughly $0.15–$0.40 per second of output depending on quality tier — a ~2-minute video can cost $15–$50+ per generation, and a failed/unusable attempt may still be billed.
- **Generation is asynchronous** — after confirming, the app polls a job status every few seconds; it can take a few minutes to finish.
- This feature is instructor-only and requires explicit confirmation after seeing the cost estimate — it will never run automatically or in bulk.

If you don't want to use this at all, just don't click "Generate AI video for this lesson" — everything else works fully without it, and lessons simply show the placeholder video pane (or a real video if you added one manually).

## What's explicitly out of scope

Multi-tenancy, certificates, discussion forum, gamification, assignment/task management beyond quizzes, analytics dashboards, and real-time features beyond AI response streaming (no WebSocket-based live notifications).
