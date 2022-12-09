const dbQuery = require('./../DB/dbQuery');
const requestIp = require('request-ip');
const fs = require('fs');

exports.saveLog = (request, response) =>{
    try {
        var ip = requestIp.getClientIp(request);
        var roomcode = request.query.roomcode;
        dbQuery.insertLog(ip);
        dbQuery.selectRoomAll()
        .then(function(data){
            
            var rooms = [];
            var times = [];
            var cnts = [];

            for(var d of data){
                rooms.push(d.host_id + "(" + d.room_id + ")");
                if(d.drop_time != '' && d.drop_time != null){
                    times.push(Math.round((new Date(d.drop_time).getTime() - new Date(d.regi_time).getTime()) / 1000 / 60 * 100) / 100);
                }else{
                    times.push(0);
                }
                cnts.push(d.cnt);
            }

            response.render('./basic/intro.ejs', {
                roomList : data,
                rooms : rooms,
                times : times,
                cnts : cnts,
                roomcode : roomcode
            });
        });
    } catch (error) {
        console.log('Error in insertLog DB',error);
    }
}

exports.searchDate = (request, response) =>{
    var regi_time = request.body.regi_time + " 00:00:00";
    var drop_time = request.body.drop_time + " 23:59:59";

    try {
        
        const dateData = {
            'regi_time' : regi_time,
            'drop_time' : drop_time
        }

        dbQuery.selectRoomByDate(dateData)
        .then(function(data){
            
            var rooms = [];
            var times = [];
            var cnts = [];

            for(var d of data){
                rooms.push(d.host_id + "(" + d.room_id + ")");
                times.push(Math.round((new Date(d.drop_time).getTime() - new Date(d.regi_time).getTime()) / 1000 / 60 * 100) / 100);
                cnts.push(d.cnt);
            }

            response.render('./basic/intro.ejs', {
                roomList : data,
                rooms : rooms,
                times : times,
                cnts : cnts,
                regi_time : request.body.regi_time,
                drop_time : request.body.drop_time,
                roomcode : ''
            });
        });                
    } catch (error) {
        console.log('Error in searchDate DB',error);
    }
}

exports.login = (request, response, users) =>{
    
    var ip = requestIp.getClientIp(request);
    var requestRoomId = request.body.input_rm;
    var requestUserName = request.body.input_nm;
    try{
        requestUserName = requestUserName.replace(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/ ]/g, '');
    }catch(error){

    }
    
    //유효성 체크
    if(requestRoomId.trim().length <= 0 || requestUserName.trim().length <= 0) {

        console.log('방이름 혹은 닉네임을 기입해주세요.'); 
        dbQuery.selectRoomAll()
        .then(function(data){
            //console.log(data);
            var rooms = [];
            var times = [];
            var cnts = [];

            for(var d of data){
                rooms.push(d.host_id + "(" + d.room_id + ")");
                if(d.drop_time != '' && d.drop_time != null){
                    times.push(Math.round((new Date(d.drop_time).getTime() - new Date(d.regi_time).getTime()) / 1000 / 60 * 100) / 100);
                }else{
                    times.push(0);
                }
                cnts.push(d.cnt);
            }

            response.render('./basic/intro.ejs', {
                roomList : data,
                rooms : rooms,
                times : times,
                cnts : cnts,
                success: 'false_input',
                roomcode : ''
            });
        });

        return false;
        
    }
    
    if(users[requestRoomId] == undefined) {

        console.log('해당하는 '+ requestRoomId +' 방이 없습니다.');
        dbQuery.selectRoomAll()
        .then(function(data){
            
            var rooms = [];
            var times = [];
            var cnts = [];

            for(var d of data){
                rooms.push(d.host_id + "(" + d.room_id + ")");
                if(d.drop_time != '' && d.drop_time != null){
                    times.push(Math.round((new Date(d.drop_time).getTime() - new Date(d.regi_time).getTime()) / 1000 / 60 * 100) / 100);
                }else{
                    times.push(0);
                }
                cnts.push(d.cnt);
            }

            response.render('./basic/intro.ejs', {
                roomList : data,
                rooms : rooms,
                times : times,
                cnts : cnts,
                success: 'false_room',
                roomcode : ''
            });
        });
        return false;
    }

    for(i in users[requestRoomId]){
        if(users[requestRoomId][i].userName == requestUserName){

            console.log('중복된 이름이 존재합니다');
            dbQuery.selectRoomAll()
            .then(function(data){
                
                var rooms = [];
                var times = [];
                var cnts = [];

                for(var d of data){
                    rooms.push(d.host_id + "(" + d.room_id + ")");
                    if(d.drop_time != '' && d.drop_time != null){
                        times.push(Math.round((new Date(d.drop_time).getTime() - new Date(d.regi_time).getTime()) / 1000 / 60 * 100) / 100);
                    }else{
                        times.push(0);
                    }
                    cnts.push(d.cnt);
                }

                response.render('./basic/intro.ejs', {
                    roomList : data,
                    rooms : rooms,
                    times : times,
                    cnts : cnts,
                    success: 'false_duplicated',
                    roomcode : ''
                });
            });
            return false;
        }
    }
    

    dbQuery.selectRoom(requestRoomId)
    .then(function(data){

        const userData = {
            'user_name' : requestUserName,
            'user_ip' : ip,
            'host_id' : data.host_id,
            'room_id' : requestRoomId,
            'enter_time' : new Date()
        }
        dbQuery.insertUserData(userData)
        .catch((error)=>console.log('Error in insertUserData DB', error));

    })
    .catch((error)=>console.log('Error in select room DB', error));
    
    response.render('./index.ejs', {
        roomId: requestRoomId,
        loginId: requestUserName,
    });
}

exports.makeRoom = (request, response, users) =>{

    let roomId = request.body.room_id_old;
    let userName = request.body.input_nm;
    let newRoomId = request.body.new_room_id;
    var ip = requestIp.getClientIp(request);
    try{
        userName = userName.replace(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/ ]/g, '');
    }catch(error){}

    console.log('생성용 룸아이디: ',roomId);
    console.log('생성용 새방이름: ',newRoomId);
    console.log('생성용 유저네임: ',userName);
    
    //유효성 체크
    if(userName.trim().length <= 0) {
        
        console.log('닉네임을 기입해주세요.');
        dbQuery.selectRoomAll()
        .then(function(data){
            
            var rooms = [];
            var times = [];
            var cnts = [];

            for(var d of data){
                rooms.push(d.host_id + "(" + d.room_id + ")");
                if(d.drop_time != '' && d.drop_time != null){
                    times.push(Math.round((new Date(d.drop_time).getTime() - new Date(d.regi_time).getTime()) / 1000 / 60 * 100) / 100);
                }else{
                    times.push(0);
                }
                cnts.push(d.cnt);
            }

            response.render('./basic/intro.ejs', {
                roomList : data,
                rooms : rooms,
                times : times,
                cnts : cnts,
                success: 'false_nick',
                roomcode : ''
            });
        });
        return false;
    }
    
    if(newRoomId !=='')
        roomId = newRoomId;
            
    var dirName = __dirname.replace('/controllers', '');
    make_directory(dirName+'/uploads/'+roomId); //file upload
        
    try{
        const room = {
            'host_id': userName,
            'regi_id': userName,
            'regi_time': new Date(),
            'room_id' : roomId
        }
        dbQuery.insertBasicRoom(room);

        const userData = {
            'user_name' : userName,
            'user_ip' : ip,
            'host_id' : userName,
            'room_id' : roomId,
            'enter_time' : new Date()
        }
        dbQuery.insertUserData(userData);        
    }catch(error){
        console.log('Error in insert Meeting DB', error);
    }

    response.render('./index.ejs', {
        roomId: roomId,
        loginId: userName,
    });
}

//file upload
function make_directory(path) {
    
    const isExist = fs.existsSync(path);
    if(!isExist) {
        fs.mkdirSync(path, {recursive : true});
        console.log("make",path);
    }
}