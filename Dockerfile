# Use a multi-stage build to keep the final image lean
FROM python:3.11-slim-bullseye AS builder

# Set working directory
WORKDIR /app

# Copy only the requirements file to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Final stage
FROM python:3.11-slim-bullseye

# Set working directory
WORKDIR /app

# Copy installed dependencies from the builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /app .

# Create a non-root user and switch to it for security
RUN useradd -m appuser
USER appuser

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["python", "app.py"]