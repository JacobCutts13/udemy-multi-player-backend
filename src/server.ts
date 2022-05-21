import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

// read in contents of any environment variables in the .env file
dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.get("/", (req, res) => {
  res.status(200).sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  socket.on("chat message", (message: string) => {
    console.log(message);
    socket.broadcast.emit("chat message", message);
  });
});

// use the environment variable PORT, or 3000 as a fallback
// const PORT_NUMBER = process.env.PORT ?? 3000;

server.listen(3000, () => {
  console.log("listening on port 3000");
});

// app.listen(PORT_NUMBER, () => {
//   console.log(`Server is listening on port ${PORT_NUMBER}!`);
// });
