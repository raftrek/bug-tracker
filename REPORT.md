# Project Analysis Report: Jira Clone / Bug Tracker

## 1. Project Overview
This project is a web-based bug tracking application similar to Jira.
- **Frontend**: React (Vite), React Router, Tailwind CSS.
- **Backend**: Node.js, Express.
- **Database**: SQLite with Prisma ORM.
- **Authentication**: JWT-based (bcryptjs, jsonwebtoken).
- **AI Integration**: Google Gemini API for issue summarization.

## 2. Proposed New Features

### 🚀 AI Enhancements
- **Intelligent Auto-Assignment**: Use Gemini to analyze the issue description and suggest the best team member based on past tasks.
- **Duplicate Detection**: Check for similar existing issues before creating a new one to prevent clutter.
- **Natural Language Search**: Allow users to search for "bugs related to login" instead of exact keyword matching.
- **Chat with Project**: A chatbot interface to ask questions about project status (e.g., "How many high-priority bugs are open?").

### ⚡ Real-time Collaboration
- **WebSockets (Socket.io)**: Implement real-time updates for the Kanban board. When one user moves a card, it should update instantly for everyone.
- **Live User Presence**: Show who is currently viewing or editing an issue.

### 🔔 Notifications & Workflow
- **In-App & Email Notifications**: Notify users when they are assigned an issue or mentioned in a comment.
- **Audit Logs**: Track who changed what and when (history of changes).

## 3. Improvements (Code Quality & Architecture)

### 🛠 Backend & Database
- **Data Modeling**: 
  - Currently, `tags` and `attachments` are stored as JSON strings. This makes querying difficult (e.g., "Find all issues with tag 'urgent'").
  - **Recommendation**: Refactor `tags` to a separate `Tag` model with a many-to-many relation to `Issue`.
- **Input Validation**:
  - No validation library is used for API requests.
  - **Recommendation**: Integrate **Zod** or **Joi** to validate request bodies (e.g., ensure `priority` is one of the allowed values).
- **Error Handling**:
  - Current error handling is generic (`res.status(500)`).
  - **Recommendation**: Create a centralized error handling middleware and custom Error classes (e.g., `ValidationError`, `NotFoundError`).
- **Pagination**:
  - The `GET /projects/:id` endpoint fetches *all* issues for a project.
  - **Recommendation**: Implement pagination (cursor-based or offset-based) to handle large numbers of issues.

### 🎨 Frontend
- **State Management**:
  - As the app grows, `Context` might become a performance bottleneck.
  - **Recommendation**: Consider **TanStack Query (React Query)** for server state management (caching, loading states) and **Zustand** for complex global client state.
- **Code Splitting**:
  - All pages are imported eagerly in `App.tsx`.
  - **Recommendation**: Use `React.lazy` and `Suspense` to lazy load pages and reduce initial bundle size.

## 4. Optimizations

### 🏎 Performance
- **Database Indexing**: Ensure Prisma schema defines indexes on frequently queried fields (e.g., `assigneeId`, `projectId`, `status`).
- **Asset Optimization**: Serve static assets (images, avatars) via a CDN or optimized static file serving strategy (currently served from `uploads/`).

### 🔒 Security
- **Rate Limiting**: Implement `express-rate-limit` to prevent abuse of the API (especially the Login and AI endpoints).
- **Sanitization**: Ensure all user inputs (especially Markdown in descriptions/comments) are sanitized to prevent XSS.

## 5. Summary of Actionable Next Steps
1.  **Refactor Database**: Normalize `tags` and `attachments`.
2.  **Add Pagination**: Update the `GET /projects/:id` endpoint.
3.  **Implement Validation**: Add Zod middleware to backend routes.
4.  **Setup Real-time**: Install `socket.io` and basic event emitters for board updates.
