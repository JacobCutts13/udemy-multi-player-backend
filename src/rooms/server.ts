import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server, Socket } from "socket.io";
import path from "path";
import util from "util";

interface CustomSocket extends Socket {
    room: string;
    username: string;
}

// read in contents of any environment variables in the .env file
dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server);

app.use(express.static("/../../../udemy-multi-player-frontend/src/rooms/"));
app.get("/", (req, res) => {
    res
        .status(200)
        .sendFile(
            path.resolve(
                __dirname + "/../../../udemy-multi-player-frontend/src/rooms/index.html"
            )
        );
});

io.on("connection", (socket) => {
    const customSocket = <CustomSocket>socket;
    console.log("a user connected");

    customSocket.on("disconnect", () => {
        console.log("a user disconnected");
    });
    io.emit("rooms", getRooms("connected"));
    customSocket.on("disconnect", function () {
        console.log("user disconnected");
    });
    customSocket.on("new room", function (room) {
        console.log(`A new room is created ${room}`);
        customSocket.room = room;
        customSocket.join(room);
        io.emit("rooms", getRooms("new room"));
    });
    customSocket.on("join room", function (room) {
        console.log(`A new user joined room ${room}`);
        customSocket.room = room;
        customSocket.join(room);
        io.emit("rooms", getRooms("joined room"));
    });
    customSocket.on("chat message", function (data) {
        io.in(data.room).emit("chat message", `${data.name}: ${data.msg}`);
    });
    customSocket.on("set username", function (name) {
        console.log(`username set to ${name}(${customSocket.id})`);
        customSocket.username = name;
    });
});

server.listen(3000, () => {
    console.log("listening on port 3000");
});

function getRooms(msg: string) {
    const nsp = io.of("/");
    const rooms = nsp.adapter.rooms;
    /*Returns data in this form
      {
        'roomid1': { 'socketid1', socketid2', ...},
        ...
      }
      */
    // console.log('getRooms rooms>>' + util.inspect(rooms));

    const list = {};

    for (const [roomName, socketList] of rooms) {
        const sockets = Array.from(socketList);
        //console.log('getRooms room>>' + util.inspect(room));
        const socketNames = [];
        for (const socketId in socketList) {
            //@ts-ignore
            const socket: CustomSocket = nsp.connected[socketId];
            if (
                socket === undefined ||
                socket.username === undefined ||
                socket.room === undefined
            )
                continue;
            //console.log(`getRooms socket(${socketId})>>${socket.username}:${socket.room}`);
            socketNames.push(socket.username);
        }
        //@ts-ignore
        list[roomName] = sockets; //{"room 1 Name": ["socket names"], "room 2 name": [] ...}
    }

    console.log(`getRooms: ${msg} >>` + util.inspect(list));

    return list;
}
