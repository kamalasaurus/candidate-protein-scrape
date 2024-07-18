# Use the official Deno base image
FROM denoland/deno:latest

# Copy the rest of your application code into the image
COPY . .

RUN deno compile -A ./index.js

# Expose the port your app runs on (adjust if necessary)
EXPOSE 4567

# Command to run your application (adjust if necessary)
CMD ["/index"]