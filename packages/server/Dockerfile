# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy the root package files
COPY package*.json pnpm-lock.yaml ./

# Copy pnpm workspace file
COPY pnpm-workspace.yaml ./

# Copy all packages
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install

# Build the application
RUN pnpm --filter server build

# Change working directory to server
WORKDIR /app/packages/server

# Expose the port the app runs on
EXPOSE $PORT

# Define the command to run the application
CMD [ "pnpm", "start" ]