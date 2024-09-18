# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the entire application into the working directory
COPY . .

# Expose the application port
EXPOSE 3000

# Command to run migrations, seed, and start the app
CMD ["bash", "-c", "npm run seed && npm start"]
