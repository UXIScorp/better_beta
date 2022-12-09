const express = require('express')
const app = express();
const fs = require('fs');
const formidable = require('formidable');
const https = require('https');
const bodyParser = require('body-parser');
const port = 443;
const logger = require('./config/winston').logger;

const options={
	ca: fs.readFileSync(''),
	key: fs.readFileSync(''),
	cert: fs.readFileSync('')
};

let date = new Date();
date.setHours(date.getHours()+9);
const server = https.createServer(options, app).listen(port, () => console.log('P2P Server running', date));

const io = require('socket.io')(server, {
    pingInterval: 10000000,
    pingTimeout: 10000000    
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

io.sockets.on('error', e=> console.log(e));
exports.ioData = io;

const router = require('./route.js');
const dbQuery = require('./DB/dbQuery');
const calc = require('./js/mediapipe/calculate');

app.use(router);

const basicController = require('./controllers/basicController.js');

let maximum = 12;
let users = {};
let socketToRoom = {};

let peerStreams = {};
let peerConnections = {};

let OnPeering = {}; 

function printUsers( pRoomId ){
    console.log('---- 피어링상태 -------', OnPeering[pRoomId]);
    console.log('---- 사용자 출력 users-------');

    if(users[pRoomId]!=undefined){
        console.log('---- [room: ' + pRoomId + ' '+ users[pRoomId].length +'명 ]-------');
        for(var i=0; i<users[pRoomId].length; i++){
            console.log(i + " : " + users[pRoomId][i]['loginId'] + " - " + users[pRoomId][i]['socketId'] );
        }
    }
    else{
        console.log('사용자없음.');
    }
    console.log('----사용자 출력종료-------');
}

router.post('/login', (request, response) => {
    try {
        logger.info('POST /login || roomId: '+request.body.input_rm+' || userName: '+request.body.input_nm);
        basicController.login(request, response, users);
    } catch (error) {
        logger.error('Error message || roomId: '+request.body.input_rm+' || userName: '+request.body.input_nm);
        response.sendStatus(500); 
    }
    
});

router.post('/meeting', (request, response) => {
    try {
        logger.info('POST /meeting || roomId: '+request.body.room_id+' || userName: '+request.body.input_nm);
        basicController.makeRoom(request, response, users);
    } catch (error) {
        logger.error('Error message || roomId: '+request.body.room_id+' || userName: '+request.body.input_nm);
        response.sendStatus(500); 
    }
    
});

io.sockets.on('connection', socket => {

    socket.on('CHECK_USER', (roomId, loginId) => {

        printUsers(roomId);
        console.log('CHECK_USER ( ' + roomId + ', ' + loginId + ' )');
        if(users[roomId] != undefined){

            let hasError = false;
            if(users[roomId].length == maximum){
                io.sockets.to(socket.id).emit('ROOM_FULL');
                console.log('사용자수 초과');
                hasError = true;
                return false;
            }

            console.log('중복참여체크');
            if(hasError == false){
                for(var i=0; i<users[roomId].length; i++){
                    console.log(i + " : " + users[roomId][i]['loginId'] + " - " + loginId);
                    if(users[roomId][i]['loginId']==loginId){
                        io.sockets.to(socket.id).emit('DUP_USER');
                        console.log('중복참여');
                        hasError = true;
                        break;
                    }
                }
            }

			if(OnPeering[roomId] == true){
				io.sockets.to(socket.id).emit('ON_PEERING');
				console.log('다른사용자가 입장중입니다. 잠시후 접속해주세요.', OnPeering[roomId]);
				hasError = true;
                OnPeering[roomId] = false;
				return false;
			}

            if(hasError == false){
                console.log('오류없음.');
                io.sockets.to(socket.id).emit('OK_USER', users[roomId], socket.id);
                
                console.log(roomId + '번방 ' + loginId + ' 입장합니다.');
                OnPeering[roomId] = false;
            }
        }
        else { 
            users[roomId] = [];
            io.sockets.to(socket.id).emit('OK_USER', users[roomId], socket.id);
            
            console.log(roomId + '번방 ' + loginId + ' 입장합니다.');
            OnPeering[roomId] = false;
        }
		
        printUsers(roomId);
    });

    socket.on('JOIN_ROOM', data => {

        try {
            
            OnPeering[data.roomId] = true;

            if(users[data.roomId]!=undefined){
                users[data.roomId].push({ socketId: socket.id, roomId:data.roomId, loginId:data.loginId, role:data.role, status:'ready'});
            }
            else{
                users[data.roomId] = [{ socketId: socket.id, roomId:data.roomId, loginId:data.loginId, role:data.role, status:'connected'}];
            }
            
            console.log('[사용자추가] 방번호: ' + data.roomId + '아이디: ' + data.loginId);
            printUsers(data.roomId);

            socketToRoom[socket.id] = data.roomId;
            socket.join(data.roomId);

            console.log('[SERVER:SOCKET] JOIN_ROOM RECEIVED AND SEND ALL_USERS TO SOCKET.ID', data, users, users.length)
            io.sockets.to(socketToRoom[socket.id]).emit('ALL_USERS', users, socket.id);

        } catch (error) {
            
            console.log('JOIN_Error: ' + err);
            OnPeering[data.roomId] = false;    
            delete peerConnections[socket.id];
        }
    });

    socket.on('PEER_COPY_OFFER', data => { 

        try {
            socket.to(data.oppositeSocketId).emit("GET_PEER_COPY_OFFER", data);
        } catch (error) {
            console.log('PEER_COPY_OFFER_ERR: ',error);                
            delete peerConnections[socket.id];
        }
        
    });

    socket.on("PEER_COPY_ANSWER", data => {
        
        try {
            socket.to(data.oppositeSocketId).emit("GET_PEER_COPY_ANSWER", data);            
        } catch (error) {
            console.log('PEER_COPY_ANSWER_ERR: ',error);                
            delete peerConnections[socket.id];
        }
       
    });

    socket.on('PEER_COPY_ANSWER_OK', () => { 

        try {
            io.sockets.to(socket.id).emit('ALL_USERS', users, socket.id);    
        } catch (error) {
            console.log('PEER_COPY_ANSWER_OK_ERR: ',error);
            delete peerConnections[socket.id];    
        }
		
    });

    socket.on('NO_MORE_PEERING', data => {  

        try {
            OnPeering[data.roomId] = false;    
        } catch (error) {
            console.log('NO_MORE_PEERING_ERR: ',error);
            delete peerConnections[socket.id];    
        }
		
    });

    socket.on("COPY_CANDIDATE", (oppositeSocketId, candidate) => {

        try {
            io.sockets.to(oppositeSocketId).emit("GET_CANDIDATE", socket.id, candidate);    
        } catch (error) {
            console.log("COPY_CANDIDATE_ERR: ",error);
            delete peerConnections[socket.id];
        }
        
    });

    router.post('/send-file', function (request, response, next) {

        var form = new formidable.IncomingForm();
        form.multiples = true;

        var roomId;
        var fileId;
        try{
            logger.info('POST /send-file');
            form.parse(request,function(error,fields,files) {
                roomId = fields.file_roomid;
                fileId = fields.file_id;
            });

            form.on('progress', (bytesReceived, bytesExpected) =>{
                let percent = Math.round(bytesReceived / bytesExpected * 100);
                io.sockets.emit('progressRate',{
                    percent: percent
                });
            });

            form.on('error', function(err) {
                console.log('업로드중 에러: \n',err);
                io.to(roomId).emit('uploadError');
            });

            form.on('end',function() {
                var cnt = 0;
                for(var i=0; i<this.openedFiles.length; i++) {
                    var oldpath = this.openedFiles[i].filepath;
                    var newpath_dir = __dirname + "/files/" + roomId + "/";
                    const isExists = fs.existsSync(newpath_dir);
                    if( !isExists ) {
                        fs.mkdirSync(newpath_dir, { recursive: true } );
                    }
                    var newpath = __dirname + "/files/" + roomId + '/' + this.openedFiles[i].originalFilename;
                    fs.rename(oldpath,newpath, function(error){
                        if(error) console.log(error);
                        cnt++;
                    });
                }
            });
        }catch(error){
            console.log('error in send-file', error);
            logger.error('Error message');
            response.sendStatus(500); 
        }
    });

    socket.on('audio_mute', function(data) {
        socket.broadcast.to(data.roomId).emit('audio_mute_info',{
            socketId: socket.id,
            roomId: data.roomId,
            userName: data.userName,
            audio: data.audio
        });
    });

    socket.on('Change_Nick', function(oriId, newId, roomId, cUsers) {

        users = cUsers;
        console.log(users);

        socket.broadcast.to(roomId).emit('change_nick_p', {
            oriId: oriId,
            newId: newId,
            roomId: roomId
        });
    });

    socket.on('reverseOtherScreen', (data) => {

        try {
            socket.broadcast.to(data.roomId).emit('reverseScreen', data.id);    
        } catch (error) {
            console.log('reverseOtherScreen_ERR: ',error);
            delete peerConnections[socket.id];
        }
                
    });

    socket.on('req_chat',function(data){

        try{
            dbQuery.selectMessage(data.roomId).then(function(data){
                io.to(socket.id).emit('getChat', {result: data});
            }).catch((err)=>{
                console.log('MSG[DB]error' + err);
            });
        }catch(err){
            console.err("[DB SELECT ERROR] "+err)
        }
    
    });

    socket.on('file_data', (data) => {
        try {
            dbQuery.insertFileData(data);
        } catch (error) {
            console.log('[DB INSERT ERROR] ', error);
        }    
    });

    socket.on('message', (data) => {

        try{
            if(data.selected == 'All')
                socket.broadcast.to(data.roomId).emit('update', data);
            else{
                var member = users[data.roomId].filter(user => user.loginId == data.selected);
                if(member[0] != undefined)
                    socket.broadcast.to(member[0].id).emit('update', data);
            }
        }catch(error){
            console.log('Error in message: ', error);
        }

        try{
            dbQuery.insertMessage(data);
        }catch(err){
            console.err("[DB INSERT ERROR] "+err)
        }
    });

    socket.on('sendTxt', function(data){
        
        try {
            calc.saveData(data);    
        } catch (error) {
            delete peerConnections[socket.id];
        }
                        
    });

    socket.on('SPEAKING', function(data) {

        try {
            io.to(data.roomId).emit('SPEAKING_USER',{
                roomId: data.roomId,
                loginId: data.loginId
            });    
        } catch (error) {
            console.log('SPEAKING_ERR: ',error);
            delete peerConnections[socket.id];
        }
        
    });

    socket.on('STOPPED_SPEAKING', function(data) {

        try {
            io.to(data.roomId).emit('STOPPED_SPEAKING_USER',{
                roomId: data.roomId,
                loginId: data.loginId
            });    
        } catch (error) {
            console.log('STOPPED_SPEAKING_ERR: ',error);
            delete peerConnections[socket.id];        
        }
        
    });

    socket.on('disconnect', () => {

        const roomId = socketToRoom[socket.id];
        var room = users[roomId];
        var member;
        
        if(room){
            member = room.filter(user => user.socketId == socket.id);
            room = room.filter(user => user.socketId !== socket.id);
            users[roomId] = room;

            if(member.length == 1){
                const roomData = {
                    'drop_time' : new Date(),
                    'room_id' : roomId,
                    'user_name' : member[0].loginId,
                }
                dbQuery.updateDropTime(roomData).catch((error)=>console.log('In UpdateDropTime error: ', error));
            }

            const exitData = {
                'exit_time' : new Date(),
                'room_id' : roomId,
                'user_name' : member[0].loginId,
            }

            dbQuery.updateExitTime(exitData).catch((error)=>console.log('In updateExitTime error', error));

            if(users[roomId].length == 0){
                delete users[roomId];
            }
                        
            delete socketToRoom[socket.id];

            OnPeering[roomId] = false;

            socket.broadcast.to(roomId).emit('USER_EXIT', socket.id);
            printUsers(roomId, member);
        }else{
            OnPeering[roomId] = false;    
        }
    });
});

