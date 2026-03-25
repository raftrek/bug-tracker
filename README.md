# Bug Tracker (Jira Clone)

A full-stack, Jira-like bug tracker application built with React, TypeScript, Tailwind CSS, Express, and Prisma. The application allows users to seamlessly manage projects, organize issues through a Kanban board or list view, integrate with Google's Gemini AI for issue summarization, and track team collaboration.

---

## 🔍 Deep Check of Features

### ✅ Complete Features
- **Authentication & User Management:** 
  - User Registration and Login using JWT.
  - Profile settings, including avatar uploads via Multer.
- **Project Management:** 
  - Create and manage multiple projects.
  - Team member invitation system with Role-Based Access Control (Admin, Member, Viewer).
- **Issue Tracking & Kanban Board:**
  - Visualize issues across customizable statuses (TODO, IN PROGRESS, READY FOR TEST, DONE) using drag-and-drop mechanics.
  - List View for detailed scanning of all project issues.
  - Issue dependencies logic (blockers).
- **Issue Creation & Details:**
  - Create issues using pre-defined or custom templates.
  - Assign properties like Title, Type (Task, Bug, Feature), Description, Priority, Assignee, Tags, and Date Ranges.
- **Commenting System:** 
  - Add, edit, and delete real-time comments on specific issues.
- **AI Integration (Google Gemini):**
  - AI-driven issue summarization and actionable "Next Steps" generation for complex bug reports or tasks using the `@google/genai` SDK.
- **UI/UX:**
  - Responsive design powered by Tailwind CSS.
  - Light/Dark mode toggling.

### ⏳ Partial / In-Progress Features
- **Issue Attachments:** The database schema (`attachments` field in `Issue` model) supports attachments, but front-end file uploads for individual issues still require integration polish.
- **Tags System:** Tag inputs are present in the UI and stored as JSON strings, but advanced tag filtering/search logic could be expanded.

### 🚧 To Implement (Missing Features)
- **Real-Time Updates (WebSockets):** Currently relies on REST API polling or manual refreshes. Implementing `Socket.io` would make the Kanban board collaborative in real-time.
- **Global Search:** Full-text search across all projects, issues, and comments.
- **Email/Push Notifications:** Notify users when they are assigned to an issue, mentioned in a comment, or when a project role changes.
- **Advanced Analytics/Reporting:** Velocity tracking, Burn-down charts, and time-tracking features.

---

## 🚀 Getting Started (Windows & macOS)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) installed on your machine. You can verify your installation by running `node -v` in your terminal.

### 1. Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/jira-clone-bug-tracker.git
   cd jira-clone-bug-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root of the project (if it doesn't already exist) and add the following configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="supersecretkeychangeinproduction"
   PORT=3001
   API_KEY="your_google_gemini_api_key_here" # Required for AI Issue Summarization
   ```

4. **Initialize the Database (SQLite via Prisma):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### 2. Running the Application (Development)

To run the application locally, you will need to start both the frontend and backend servers. Open two separate terminal windows/tabs:

**Terminal 1 (Backend Server):**
```bash
npm run server
```
*The backend API will run on `http://localhost:3001`.*

**Terminal 2 (Frontend Client):**
```bash
npm run dev
```
*The React frontend will be available at `http://localhost:3000` (or the port indicated in your terminal). Open this URL in your browser.*

### 3. Testing the App

1. Navigate to `http://localhost:3000`.
2. Register a new user account.
3. Create a new Workspace/Project.
4. Go to Project Settings to add dummy team members if needed.
5. Create your first issue, assign a priority, and add some tags.
6. Test the drag-and-drop Kanban board by moving the issue from "TODO" to "IN PROGRESS".
7. Click the AI icon (Brain circuit) on an issue card to test the Gemini summary feature (ensure your `API_KEY` is valid).

### 4. Building for Production

To build the application for a production environment (both macOS and Windows):

1. **Build the Frontend:**
   ```bash
   npm run build
   ```
   *This command uses Vite to bundle the React application into static files, outputting them to the `dist` directory.*

2. **Run the Production Backend (Optional Next Step):**
   In a real-world scenario, you would serve the built frontend `dist` folder via your Express server or a CDN, and run the Node.js backend using a process manager like `pm2`.
   ```bash
   # Example of starting the server script with Node (requires transpiling TypeScript first or using tsx/ts-node in prod)
   npx tsx server/index.ts
   ```
