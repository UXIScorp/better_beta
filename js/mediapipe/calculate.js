const fs = require('fs');
const algorithm = require('./kmeans');
const io = require('../../server');

let users = {};
var resultScore = {};
let interval;

exports.saveData = async(data) => {
    try{
        if(data.status == 'disconnect'){
            if(users[data.room]['users'].length == 1){
                delete users[data.room];
                delete resultScore[data.room];
            }else{
                for(var loginId in users[data.room]['users']){
                    if(users[data.room]['users'][loginId] == data.loginId){
                        users[data.room]['users'].splice(loginId, 1);
                    }
                }
            }
        }else{
            var time = new Date();
            time.setHours(time.getHours()+9);
            var today = time.toISOString().replace(/\.[0-9]{3}/,'');  
            
            if(Math.floor(time.getTime()/1000) % 2 != 0){
                var realTime = time.getTime()-1000;
                time.setTime(realTime);
                today = time.toISOString().replace(/\.[0-9]{3}/,'');
            }
            
            var iris = data.result.split('/');
            var iris = parseInt((parseFloat(iris[0]) + parseFloat(iris[2]))/2 * 100);
            if(users[data.room] != undefined){
                if(users[data.room][today]){
                    users[data.room][today][data.loginId] = iris;
                }
                else{
                    users[data.room][today] = [];
                    users[data.room][today][data.loginId] = iris;
                }
            }else{
                users[data.room] = {};
                users[data.room][today] = [];
                users[data.room]['users'] = [data.loginId];
                users[data.room][today][data.loginId] = iris;
            }
            var flag = false;
            for(var loginId in users[data.room]['users']){
                if(users[data.room]['users'][loginId] == data.loginId)flag = true;
            }
            if(!flag)users[data.room]['users'].push(data.loginId);
            
            getResult(data, today);
        }
    }catch(error){}
}

function getResult(data, today){
    try{
        var score = 0;
        if(resultScore[data.room]==undefined)resultScore[data.room] = {};

        if(users[data.room]){
            var iris = users[data.room][today][data.loginId];
            if(iris >= 30 && iris <= 70){
                score = 100;
            }
            if(resultScore[data.room][data.loginId])
                resultScore[data.room][data.loginId] = parseInt((resultScore[data.room][data.loginId] + score)/ 2);
            else
                resultScore[data.room][data.loginId] = score;
        }
        delete users[data.room][today];
    }catch(error){
        console.log('getResult Error: ', error);
    }
}

function sendToWebServer(){
    interval = setInterval(async function(){
        try{
            for(var roomId in users){
                await algorithm.countScore(resultScore[roomId]);
            }
            if(resultScore != {}){

                makeFile();
                for(var roomId in resultScore){
                    var score = resultScore[roomId];
                    io.ioData.to(roomId).emit('getMediapipeResult', score);
                }
                resultScore = {};

            }
        }catch(err){}
    }, 30000);
}
sendToWebServer();

function makeFile(){
    var time = new Date();
    time.setHours(time.getHours()+9);
    var today = time.toISOString().replace(/\.[0-9]{3}/,'');
    
    if(Math.floor(time.getTime()/1000) % 2 != 0){
        var realTime = time.getTime()-1000;
        time.setTime(realTime);
        today = time.toISOString().replace(/\.[0-9]{3}/,'');
    }
    var roomIds = Object.keys(resultScore);
    for(var i in roomIds){
        var roomId = roomIds[i];
        let room_directory = "./uploads/"+roomId;
    
        var remoteUserDirectory = __dirname + room_directory.replace('.', '');
    
        if(!fs.existsSync(room_directory))fs.mkdirSync(room_directory);
    
        let filename = room_directory+'/result.txt';
        var loginIds = Object.keys(resultScore[roomId]);
        let resultText = '[' + today + ',RoomId:' + roomId + ',TotalScore:' + resultScore[roomId].totalScore+ ',';

        for(var j in loginIds){
            var loginId = loginIds[j];
            if(loginId == 'totalScore')continue;
            resultText += loginId + ':' + resultScore[roomId][loginId] + ',';
        }
        resultText = resultText.slice(0, -1);
        resultText += ']\n';
        
        fs.open(filename, 'a+', function(err, fd){
            if(err)console.log('fs open error: ', err);
            if(fd == '9'){
                fs.writeFile(filename, resultText, 'utf8', function(err){
                    if(err)console.log('writeFile error: ', err);
                });
            }else{
                fs.appendFile(filename, resultText, function(err){
                    if(err)console.log('appendFile error: ', err);
                })
            }
        });
    }
}

function removeDirectory(data){
	let user_directory = "./captures/"+data.room;

	fs.rmdir(user_directory, {recursive:true}, (err)=>{
		if(err){
			console.log('in rmdir error:', err);
		}
	})
}