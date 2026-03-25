# Use the Node.js 20 Alpine image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of your backend source code
COPY . .

# Expose the port your server.js uses (usually 5000 or 8080)
EXPOSE 5000

# Start the application using the 'start' script from package.json
CMD ["npm", "start"]