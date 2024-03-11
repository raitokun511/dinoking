const MAX_DYNAMIC_OBSTACLES = 10;
const MAX_ITEM_NUMBER = 10;
const MEMBER_PER_ROOM = [
    10,10,10,10,10,10
]

class RoomManager {
    constructor() {
        this.roomGroup = {};
        this.timeBeginGroup = [];
        this.foodRoomGroup = {};
        this.maxFoodPerRoom = 10;
        this.roomIDStart = 0;
        this.roomFood = [];
    }
    getMemberPerRoom(rid) {
        return MEMBER_PER_ROOM[rid];
    }
    addSocketToRoom(socket, id) {
        let addedToExistingRoom = false;
        let isRoomExist = false;
        if (this.getRoomIdBySocket(socket) != null)
            return -1;
        for (const [roomid, sockets] of Object.entries(this.roomGroup)) {
            if (roomid == this.roomIDStart) {
                isRoomExist = true;
                if (sockets.length < MEMBER_PER_ROOM[roomid]) {
                    // Thêm socket vào phòng hiện tại nếu chưa đầy
                    sockets.push(socket);
                    addedToExistingRoom = true;
                    socket.room = roomid;
                    return sockets.length;
                }
            }
        }

        //Nếu chưa có phòng 
        if (!isRoomExist) {
            this.roomIDStart++;
            this.roomGroup[this.roomIDStart] = [socket];
            console.log("New Room " + this.roomIDStart);
            socket.room = this.roomIDStart;
            return 1;
        }
        if (!addedToExistingRoom) {
            return -1;
        }
    }
    getRoomListInfo(){
        let roomList = [0,0,0,0,0,0];
        for (const [roomID, sockets] of Object.entries(this.roomGroup)) {
            roomList[roomID] = sockets.length;
        }
        return roomList;
    }
    getAllPLayerInRoom(rID, removesocket = null)
    {
        let result = [];
        const allsock = this.getSocketFromRoom(rID);
        for (let webSocket of allsock)
        if (webSocket != removesocket) {
            result.push(webSocket.id);
        }
        for (let webSocket of allsock) 
        if (webSocket != removesocket) {
            result.push(webSocket.imgid);
        }
        return result;
    }
    getFoodByRoomId(id) {
        return this.foodRoomGroup[id];
    }
    between(min, max) {
        return Math.floor(
            Math.random() * (max - min) + min
        )
    }
    randomFoodForRoom(row, col) {
        let listFoods = Array(row * col).fill(0);
        for (let i = 0; i < MAX_ITEM_NUMBER; i++) {
            let randomIndex = Math.floor(Math.random() * (row * col + 1));
            listFoods[randomIndex] = this.between(1,4);
        }
        return listFoods;
    }

    removeRoom(roomID) {
        delete this.roomGroup[roomID];
    }
    removeRoomByClient(socket) {
        const room = this.getRoomIdBySocket(socket);
        for (const [roomID, sockets] of Object.entries(this.roomGroup)) {

        }
        delete this.roomGroup[room];
    }


    getSocketFromRoom(roomID) {
        return this.roomGroup[roomID] || [];
    }
    getRoomIdBySocket(socket) {
        for (const [roomID, sockets] of Object.entries(this.roomGroup)) {
            if (sockets.includes(socket)) {
                return roomID;
            }
        }
        return null; // Trả về null nếu không tìm thấy
    }

    socketsIsSameRoom(socket1, socket2) {
        const roomID1 = this.getRoomIdBySocket(socket1);
        const roomID2 = this.getRoomIdBySocket(socket2);
        return roomID1 !== null && roomID1 === roomID2;
    }

    makeObstacleList() {
        const randNumberObstacle = getRandomNumber(2, MAX_DYNAMIC_OBSTACLES);
        const numbers = Array.from({ length: MAX_DYNAMIC_OBSTACLES }, (_, index) => index + 1);
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        const result = numbers.slice(0, randNumberObstacle);
        return result;
    }
}
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


module.exports = RoomManager;