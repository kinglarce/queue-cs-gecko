FROM node:18-alpine

WORKDIR /app

# Install create-react-app if starting fresh
RUN npm install -g create-react-app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install || echo "No package.json found, will initialize later"

# Start command if node_modules doesn't exist
CMD if [ ! -d "node_modules" ]; then \
      echo "No node_modules found, initializing React app..."; \
      npx create-react-app . --template typescript; \
      npm install; \
      npx tailwindcss init; \
    fi && \
    npm start

# Copy the rest of the application
COPY . .

# Use ARG to receive build-time environment variables
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_TITLE
ARG REACT_APP_VERSION
ARG REACT_APP_API_TIMEOUT
ARG REACT_APP_ENABLE_NOTIFICATIONS
ARG REACT_APP_ENABLE_SMS_NOTIFICATIONS
ARG REACT_APP_ENABLE_DARK_MODE
ARG REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON

# Ensure ARG values are passed to ENV variables for build
ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_ANON_KEY=${REACT_APP_SUPABASE_ANON_KEY}
ENV REACT_APP_TITLE=${REACT_APP_TITLE}
ENV REACT_APP_VERSION=${REACT_APP_VERSION}
ENV REACT_APP_API_TIMEOUT=${REACT_APP_API_TIMEOUT}
ENV REACT_APP_ENABLE_NOTIFICATIONS=${REACT_APP_ENABLE_NOTIFICATIONS}
ENV REACT_APP_ENABLE_SMS_NOTIFICATIONS=${REACT_APP_ENABLE_SMS_NOTIFICATIONS}
ENV REACT_APP_ENABLE_DARK_MODE=${REACT_APP_ENABLE_DARK_MODE}
ENV REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=${REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON}

# Give TypeScript time to recognize the newly installed modules
RUN touch src/App.tsx

# For development
EXPOSE 3000
CMD ["npm", "start"]

# For production
# EXPOSE 80
# CMD ["npm", "run", "serve"] 