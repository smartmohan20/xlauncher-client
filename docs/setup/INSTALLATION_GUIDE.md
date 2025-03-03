## **React Vite Application Installation Guide**

This guide will help you set up and run the Xlauncher Client React Vite application on your local machine.

### Step 1: Prerequisites

Ensure you have the following installed:
- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Git

You can verify your installations with:
```bash
node --version
npm --version
git --version
```

### Step 2: Clone the Repository

Clone the project repository to your local machine:

```bash
git clone https://github.com/yourusername/xlauncher-client.git
cd xlauncher-client
```

### Step 3: Install Dependencies

Install the required project dependencies:

```bash
npm install
```

### Step 4: Environment Setup

1. Create a `.env` file in the root directory:
```bash
touch .env
```

2. Add the following environment variables to your `.env` file:
```env
# Application Configuration
VITE_APP_ENV="YOUR_APP_ENV"                      # Set your app environment (development, staging, or production)
VITE_APP_NAME="YOUR_APP_NAME"                    # Your application name
VITE_API_BASE_URL="YOUR_BASE_URL"                # Your backend base URL (e.g., http://localhost:2354)
VITE_WEBSOCKET_URL="YOUR_SOCKET_URL"             # Port number for your application (e.g., 2354)
```

3. For development, you might want to create a `.env.development` file with local development values.

### Step 5: Available Scripts

The application comes with several predefined scripts:

#### Development Mode
Run the application in development mode with hot-reload:
```bash
npm run dev
```

#### Build
Create a production build:
```bash
npm run build
```

#### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

#### Linting
Check for code style issues:
```bash
npm run lint
```

#### Testing
Run the test suite:
```bash
npm run test
```

### Step 6: Development Server

When running in development mode:
1. The application will start on the configured port (default: 5173)
2. Open your browser and navigate to the frontend URL (e.g., http://localhost:5173)

### Step 7: Build for Production

To deploy the application:

1. Create a production build:
```bash
npm run build
```

2. The build output will be in the `dist` directory
3. Test the production build locally:
```bash
npm run preview
```

### Environment-Specific Configurations

You can create different environment files:
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Troubleshooting

Common issues and solutions:

1. **Port Already in Use**
   ```bash
   # Find process using the port
   lsof -i :5173
   # Kill the process
   kill -9 <PID>
   ```

2. **Node Modules Issues**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment Variables Not Loading**
   - Ensure all environment variables are prefixed with `VITE_`
   - Restart the development server after changing environment variables
   - Variables must be used through import.meta.env in your code

### Best Practices

1. Always use the appropriate environment file for your setup
2. Don't commit the `.env` file to version control
3. Update environment variables documentation when adding new variables

Remember to check the backend API is running and accessible before starting the frontend application.
