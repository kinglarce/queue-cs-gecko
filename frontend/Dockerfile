FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY external-deps.json ./

# Install dependencies with legacy-peer-deps flag to resolve TypeScript version conflict
RUN npm install --legacy-peer-deps

# Install external dependencies from separate file
RUN npm install --legacy-peer-deps $(node -e "console.log(Object.entries(require('./external-deps.json').dependencies).map(([pkg, ver]) => pkg + '@' + ver.replace(/^\^/, '')).join(' '))")

# Copy the rest of the application
COPY . .

# Give TypeScript time to recognize the newly installed modules
RUN touch src/App.js

# Build the app (for production)
# RUN npm run build

# For development
EXPOSE 3000
CMD ["npm", "start"]

# For production
# EXPOSE 80
# CMD ["npm", "run", "serve"] 