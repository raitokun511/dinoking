import WebSocket, { WebSocketServer } from 'ws';
import RoomManager from './src/room/roomManager.cjs';
import MEMBER_PER_ROOM from './src/room/roomManager.cjs';
import {createServer} from 'https';
import { readFileSync } from 'fs';
import UserData from './src/database/user.cjs';
//Event send socket
const CONNECTION_JOIN = 100;
const JOIN_ROOM = 101;
const ROOM_STATE = 102;
const UPDATE_ROOM_INFO = 110;
const SEND_CHARACTER_INFO = 103;
const CHARACTER_DISCONNECT = 104;
const SEND_FOOD = 105;
const SEND_OBSTACLE = 106;
const EAT_FOOD = 107;
const ROOM_START = 108;
const PLAYER_COLLIDE = 120;
const GAME_READY = 200;

const MAX_ROW = 15;
const MAX_COL = 15;
const MAX_TILE = MAX_COL * MAX_ROW;

const Time_Send_Obstacle = 2000;
const Time_Send_Food = 5000;
const Time_Wait_Room = 10;

const connections = new Map();
const roomInstance = new RoomManager();

var idstart = 100;
var idRoomStart = 100;

const IS_PRODUCTION = true;
const PORT = 8301;
//ssl
const server = createServer({
  cert: readFileSync('./certs/fullchain.pem','utf-8'),
  key: readFileSync('./certs/privkey.pem','utf-8'),
  passphrase:'123456'
});

let wss;


function startLocal(){
  wss = new WebSocketServer({
    port: PORT,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed if context takeover is disabled.
    }
  });
}

function startProduction(){
  wss = new WebSocketServer({ server });
  server.listen(PORT);
}

if(IS_PRODUCTION){
  startProduction();
} else {
  startLocal();
}
var info;
wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  ws.on('error', console.error);
  console.log('Connect Server');
  // const user = new UserData();
  // user.connectDatabase();
  // user.login("dino1", "kingkingdo", (err, results) => {
  //   if (err)
  //     console.log("err " + err);
  //   else
  //     ws.id = results[0]['id'];
  // });
  // const pInterval = setInterval(() => {
  //     user.updateXP(100, ws.id);
  //     user.updateGold(1000, ws.id);
  //     user.updateDia(2, ws.id);
  // }, 2000);
  //user.register();
  //user.close();


  //Set id for each socket connection
  connections.set(idstart, ws);
  ws.id = idstart;
  const id_data = [CONNECTION_JOIN, idstart, ...roomInstance.getRoomListInfo()];
  ws.send(id_data, { binary: true });
  idstart++;
  console.log("Connect " + getConnectionId(ws));
  //
  ws.imgid = getRandomNumber(0,15);
  console.log("Set PlayerImage ID = " + ws.imgid);

  // Gửi ping mỗi 30 giây để giữ kết nối sống
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 10000);


  // Xử lý khi nhận được pong từ client
  ws.on('pong', () => {
    console.log('Received PONG from client');
  });

  //Get message from clients
  ws.on('message', function message(data, isBinary) {
    if (data[0] === JOIN_ROOM) {
      const memberRoom = roomInstance.addSocketToRoom(ws);
      var roomID = ws.room;//data[1];
      const allPlayerRoom = roomInstance.getAllPLayerInRoom(roomID);
      console.log("Client want to join room " + roomID + "  with member " + memberRoom + " , IMGID0: " + allPlayerRoom[0]);
      if (memberRoom > 0) {
        var senddata = [JOIN_ROOM, roomID, memberRoom, ...allPlayerRoom];
        ws.send(senddata, { binary: isBinary });
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN && roomInstance.socketsIsSameRoom(ws, client)) {
            var roomdata = [UPDATE_ROOM_INFO, roomID, memberRoom, ...allPlayerRoom];
            client.send(roomdata, { binary: isBinary });
          }
        });
        //Nếu full nhân vật
        if (memberRoom == 1) {
          console.log("Ready ! Countdown");
          var countdown = Time_Wait_Room;
          const countInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              if (countdown > 0)
              {
                countdown--;
                wss.clients.forEach(function each(client) {
                  if (client.readyState === WebSocket.OPEN && roomInstance.socketsIsSameRoom(ws, client)) {
                    console.log("Send Count to client " + countdown);
                    client.send([GAME_READY, countdown], { binary: isBinary });
                  }
                });
              }
              else
              {
                clearInterval(countInterval);
                console.log("Room " + roomID + " full => Start");
                let startPos = [224, 223, 222, 221, 220, 219, 218, 217, 216, 215];
                let cur = 0;
                wss.clients.forEach(function each(client) {
                  if (client.readyState === WebSocket.OPEN && roomInstance.socketsIsSameRoom(ws, client)) {
                    var roomstart = [ROOM_START, roomID, startPos[cur++]];
                    console.log("Send Start to client ");
                    client.send(roomstart, { binary: isBinary });
                  }
                });
              }
            }
          }, 1000);


        }
      }
      //New room
      if (memberRoom == 1) {
        console.log("New room, begin set send obstacle");
        let listObstacle = Array(MAX_COL * MAX_ROW).fill(1);
        let iObstacle = 0;

        //Gửi obstacle về client sau mỗi khoảng thời gian
        const obstacleInterval = setInterval(() => {
          if (iObstacle < MAX_TILE - 5) {
            //console.log(listObstacle);
            listObstacle[iObstacle++] = 0;
            listObstacle[iObstacle++] = 0;
            listObstacle[iObstacle++] = 0;
            listObstacle[iObstacle++] = 0;
            listObstacle[iObstacle++] = 0;
            let sendObstacle = [SEND_OBSTACLE, ...listObstacle];
            wss.clients.forEach(function each(client) {
              if (client.readyState === WebSocket.OPEN && roomInstance.socketsIsSameRoom(ws, client)) {
                client.send(sendObstacle, { binary: true });
              }
            });
          }
        }, Time_Send_Obstacle);

        //Gủi food về sau sau 1 thời gian Food Time Tim
        const foodInterval = setInterval(() => {
          const newfoods = roomInstance.randomFoodForRoom(MAX_ROW, MAX_COL);
          newfoods.unshift(SEND_FOOD);
          //console.log(newfoods);
          wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN && roomInstance.socketsIsSameRoom(ws, client)) {
              client.send(newfoods, { binary: true });
            }
          });
        }, Time_Send_Food);

      }
    }
    if (data[0] === GAME_READY) {
      console.log("Ready, Start");
      var gamestart = [GAME_READY, roomID];
      ws.send(gamestart, { binary: isBinary });
    }
    if (data[0] === PLAYER_COLLIDE)
    {
      const otherId = data[1];
      const target = [data[2], data[3], data[4]];
      ws.direction = target;
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client.id == otherId) {
          client.send([PLAYER_COLLIDE, otherId], { binary: isBinary });
        }
      });
    }
    if (data[0] === EAT_FOOD) {
      console.log("player eat food");
      var eatFoodData = [EAT_FOOD, data[1]];
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && roomInstance.socketsIsSameRoom(ws, client)) {
          client.send(eatFoodData, { binary: isBinary });
        }
      });
    }
    if (data[0] == CHARACTER_DISCONNECT) {//manual
    const rCloseID = roomInstance.getRoomIdBySocket(ws);
    const allplayer = roomInstance.getAllPLayerInRoom(rCloseID, ws);
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          if (roomInstance.socketsIsSameRoom(ws, client)) {
            var disconnect_data = [CHARACTER_DISCONNECT, getConnectionId(ws)];
            client.send(disconnect_data, { binary: true });
            let roomData = [UPDATE_ROOM_INFO, rCloseID, allplayer.length / 2, ...allplayer];
            client.send(roomData, { binary: true });
          }
        }
      });
      roomInstance.removeRoomByClient(ws);
    }
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (data[0] === SEND_CHARACTER_INFO && roomInstance.socketsIsSameRoom(ws, client)) {
          client.send(data, { binary: isBinary });
        }
      }
    });

  });

  ws.on('close', () => {
    const rCloseID = roomInstance.getRoomIdBySocket(ws);
    const allplayer = roomInstance.getAllPLayerInRoom(rCloseID, ws);
    console.log('Client disconnected ');
    clearInterval(pingInterval);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        if (roomInstance.socketsIsSameRoom(ws, client)) {
          var disconnect_data = [CHARACTER_DISCONNECT, getConnectionId(ws)];
          client.send(disconnect_data, { binary: true });
          let roomData = [UPDATE_ROOM_INFO, rCloseID, allplayer.length / 2, ...allplayer];
          client.send(roomData, { binary: true });
        }
      }
    });
    roomInstance.removeRoomByClient(ws);
  });

});

wss.on('close', function close(ws) {
  console.log('Close');
});

function getConnectionId(socket) {
  for (const [connectionId, connectionSocket] of connections) {
    if (connectionSocket === socket) {
      return connectionId;
    }
  }
  return -1;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}