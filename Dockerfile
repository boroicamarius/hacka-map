FROM node:18 AS frontend-build
# Set working directory for frontend
WORKDIR /app
# Copy package.json and package-lock.json for npm install
COPY package.json package-lock.json ./
# Install frontend dependencies
RUN npm install
# Copy the rest of the frontend source code
COPY ./src ./src
COPY ./next.config.js ./
# Build the frontend
RUN npm run build

FROM python:3.11-slim AS backend
# Set working directory for backend
WORKDIR /app
# Copy requirements and install backend dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Copy the backend source code
COPY app.py ./
# Copy the geodata directory if it exists
COPY geodata/ ./geodata/
# Copy the built frontend files
COPY --from=frontend-build /app/.next ./.next
COPY --from=frontend-build /app/public ./public
# Expose the port the app runs on
EXPOSE 5000
# Use a non-root user for security
RUN useradd -m appuser
USER appuser
# Command to run the application
CMD ["python", "app.py"]

---
yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - .:/app

---
# Optimal .dockerignore contents
node_modules
npm-debug.log
__pycache__
*.pyc
*.pyo
*.pyd
*.db
*.sqlite3
*.env
.DS_Store
.git
.gitignore
README.md
test.ipynb
geodata/graph_ml.osm