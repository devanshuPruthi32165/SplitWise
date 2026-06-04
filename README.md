# SplitWise

This workspace contains:
- `backend/`: Node.js + Express API
- `Frontend/`: Angular web app

## Build and run

Install dependencies:
```bash
npm install
npm --prefix Frontend install
```

Run backend:
```bash
npm run backend:start
```

Run frontend locally:
```bash
npm run frontend:start
```

Build frontend for production:
```bash
npm run build
```

## Android APK (Angular mobile packaging)

This project uses Capacitor to wrap the Angular web app into a native Android app.

1. Install Capacitor packages:
```bash
cd Frontend
npm install
```

2. Build the Angular web UI:
```bash
npm run build
```

3. Initialize Capacitor (only once):
```bash
npm run cap:init
```

4. Add Android support:
```bash
npm run cap:add:android
```

5. Copy the latest web build into the native project:
```bash
npm run cap:copy
```

6. Open Android Studio:
```bash
npm run cap:open:android
```

7. In Android Studio, build a signed APK or bundle.

## Backend deployment

### Prepare environment

The backend expects environment variables such as:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`

Create a `.env` file in `backend/` for local development:
```env
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Deploy options

You can deploy the backend to any Node.js host such as:
- Render
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk or ECS

### Render deployment

1. Push the repo to GitHub.
2. Create a new Web Service on Render.
3. Select your repository and branch.
4. For the service root, use `backend`.
5. Set environment to `Node`.
6. Use these commands:
   - Build command: `npm install`
   - Start command: `npm run start`
7. Add Render environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT`

If you want, you can also use `render.yaml` from the repository root so Render automatically configures the service.

### If you use MongoDB Atlas

- Create a cluster
- Whitelist your app IPs or use `0.0.0.0/0` for testing
- Use the connection string as `MONGODB_URI`

## Notes

- The Angular app is packaged as a web app inside Capacitor, not a native native app.
- APK generation requires Android Studio and Android SDK on your machine.
- Backend deployment requires a running MongoDB instance accessible from the deployed service.
