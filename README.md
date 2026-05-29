# Project Title: Green Circle — Ethiopian Startup Discovery Platform

## Contributors
- Alemayehu Dabi *(Registered participant)*
- Bemnet Mussa *(Registered participant)*

## Project Synopsis

### Problem Statement
Ethiopian startups lack visibility and access to capital. There's no centralized way for investors and partners to discover who's building, at what stage, and how to connect. As a result, founders miss funding opportunities and investors miss deals.

### Planned Solution
We will build a web platform where:
- Startups create profiles to showcase their team, traction, and funding needs.
- Founders get discovered by investors, diaspora, and ecosystem partners.
- Investors browse a curated directory with clear signals on stage, sector, and investment readiness.
- Partners connect directly with founders for capital, mentorship, and collaboration.

### Expected Outcome
- Visible ecosystem of Ethiopian startups discoverable by global investors.
- Centralized directory with clear investment signals (stage, sector, traction).
- Direct founder-investor connections that lead to funded deals.
- Improved investment flow and strategic partnerships for Ethiopian founders.

### Fayda's Role
Fayda will be used to:
- Verify startup founders' identities during registration.
- Build trust in the authenticity of submitted startups.
- Prevent fraud and duplication.

## Tech Stack
- Frontend: **Next.js** — Web framework
- Authentication: VeriFayda OIDC integration
- Database: MongoDB
- Deployment: Railway or Vercel (TBD)
- Version Control: GitHub



## Installation and Deployment

## use this link
   https://startup-ethiopia-kohl.vercel.app/

Follow these instructions to set up and run the project locally or deploy it using Docker.

### Prerequisites
*   Node.js (v20 or later recommended)
*   npm or Yarn
*   Docker (for Docker deployment)

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/BemnetMussa/Startup-Ethiopia.git
cd Startup-Ethiopia # Navigate into your project directory
\`\`\`

### 2. Install Dependencies
Using npm:
\`\`\`bash
npm install
\`\`\`
Or using Yarn:
\`\`\`bash
yarn install
\`\`\`




### 4. Running the App Locally
To run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 5. Deploying the App using Docker
Ensure Docker is installed and running on your system.

#### Build and Run with Docker Compose
This is the recommended method for easy setup and deployment.
\`\`\`bash
docker-compose up --build -d
\`\`\`
*   `--build`: Builds the Docker image from the `Dockerfile`.
*   `-d`: Runs the containers in detached mode (in the background).

The application will be accessible at [http://localhost:3000](http://localhost:3000).

#### Stop Docker Containers
To stop the running containers:
\`\`\`bash
docker-compose down
\`\`\`

#### Manual Docker Build and Run (Alternative)
You can also build and run the Docker image manually:
1.  **Build the Docker image:**
    \`\`\`bash
    docker build -t ethiopia-startup-app .
    \`\`\`
2.  **Run the Docker container:**
    \`\`\`bash
    docker run -p 3000:3000 ethiopia-startup-app
    
