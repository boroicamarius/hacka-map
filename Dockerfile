# Use a multi-stage build to keep the final image lean
FROM node:18-slim AS build_frontend

# Set working directory for frontend
WORKDIR /app/frontend

# Copy package.json and package-lock.json for dependency installation
COPY package.json ./
COPY package-lock.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend application
RUN npm run build

# Use a lightweight image for the backend
FROM python:3.11-slim AS build_backend

# Set working directory for backend
WORKDIR /app/backend

# Copy requirements.txt for dependency installation
COPY requirements.txt ./

# Install backend dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY app.py ./

# Copy the built frontend files from the previous stage
COPY --from=build_frontend /app/frontend/public ./public
COPY --from=build_frontend /app/frontend/src ./src

# Create a non-root user to run the application
RUN useradd -m appuser
USER appuser

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]