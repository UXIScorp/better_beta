const socket = io('', {'reconnect': true, 'reconnection delay': 500, 'max reconnection attempts': 10});

var roomId;
var loginId;
var role;
let PCs = [];
var socketId;
let peerConnections = {};
let users = {};
var interval;

roomId = document.getElementById('roomId').innerText;
loginId = document.getElementById('loginId').innerText;

const config = {
    iceServers: [
        {
            urls: "stun:"
        },
        {
            urls: "turn:",
                    "username": "",
                    "credential": ""
        }
    ]
};

socket.emit('CHECK_USER', roomId, loginId);

function start(){
    
    memberUpdate('enter', loginId, socketId);

    getStream()
    .then( stream => {
        socket.emit('JOIN_ROOM', {
            socketId : socketId,
            roomId : roomId,
            loginId : loginId
        });
    })
    .catch(handleError);
}

socket.on('OK_USER', ( pUsers, pMySocketId ) =>{
	socketId = pMySocketId;
    users = pUsers;
  
    start();
});

socket.on('ALL_USERS', (pUsers, pFromSocketId) =>{ 

    users = pUsers;

    if(pFromSocketId == socketId){

		var peerCount = 0;

        for(var i=0; i<pUsers[roomId].length; i++){

            pUsers[roomId][i]['socketId']
            
            if(
                pUsers[roomId][i]['socketId'] != socketId && 
                peerConnections[pUsers[roomId][i]['socketId']] == undefined 
            ){
				peerCount++;

                var addedSocketId = pUsers[roomId][i]['socketId'];

                peerConnections[addedSocketId] = new RTCPeerConnection(config);

                showStream.getTracks().forEach( track => {
                    peerConnections[addedSocketId].addTrack(track, showStream);
                });

                peerConnections[addedSocketId].onicecandidate = event => {
                    if(event.candidate){
                        socket.emit('COPY_CANDIDATE', addedSocketId, event.candidate);
                    }
                };

                peerConnections[addedSocketId].oniceconnectionstatechange = event => {};

                peerConnections[addedSocketId].ontrack = event => {
                    var remoteUserId = '';
                    if(users != undefined){
                        for( var i=0; i<users[roomId].length; i++){
                            if(users[roomId][i]['socketId'] == addedSocketId){
                                remoteUserId = users[roomId][i]['loginId'];
                                break;
                            }
                        }
                    }
                    
                    if(remoteUserId!=''){
                        var remoteVideo = document.getElementById(remoteUserId+"Video");
                        if(event.streams[0] != null && event.streams[0] != undefined){
                            memberUpdate('enter', remoteUserId, addedSocketId);
                    
                            if(remoteVideo != null){
                                remoteVideo.srcObject = event.streams[0];
                            }
                        }else{
                            delete peerConnections[addedSocketId];
                        }
                    }
                };

                peerConnections[addedSocketId]
                .createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then(sdp =>{
                    peerConnections[addedSocketId].setLocalDescription(sdp); 
                    
                    socket.emit('PEER_COPY_OFFER', {
                        socketId : socket.id,
                        oppositeSocketId : addedSocketId,
                        roomId : roomId,
                        loginId : loginId,
                        sdp : sdp
                    });
                    
                    PCs.push(peerConnections[addedSocketId]);
                    
                    socket.emit('req_chat', {
                        roomId: roomId,
                    });
                })
                .catch(handleError);
                break;
            }
        }

		if(peerCount==0){
            socket.emit('NO_MORE_PEERING', {roomId, socketId} );
		}
    }
    var cnt = document.getElementById('user_count');
    cnt.innerText = pUsers[roomId].length + '명';

    var vid_ul = document.getElementById('vid_ul');

    if(pUsers[roomId].length >= 3 && pUsers[roomId].length < 5){
        vid_ul.removeAttribute('class');
        vid_ul.setAttribute('class', 'vid_nm_34');
    }

    if(pUsers[roomId].length >= 5 && pUsers[roomId].length < 7){
        vid_ul.removeAttribute('class');
        vid_ul.setAttribute('class', 'vid_nm_56');
    }

    if(pUsers[roomId].length >= 7){
        vid_ul.removeAttribute('class');
        vid_ul.setAttribute('class', 'vid_nm_78');
    }

});

socket.on("GET_CANDIDATE", (pSenderSocketId, candidate) => {
    if(peerConnections[pSenderSocketId] != undefined){
        peerConnections[pSenderSocketId].addIceCandidate(new RTCIceCandidate(candidate)).then(() => {});
    }
    else {}
});

socket.on('GET_PEER_COPY_OFFER', (data) => {

    var pSocketId = data.socketId;

    const peer = new RTCPeerConnection(config);

    peerConnections[pSocketId] = peer;

    showStream.getTracks().forEach( track => {
        peerConnections[pSocketId].addTrack(track, showStream);
    });

    peerConnections[pSocketId].onicecandidate = event => {
        if(event.candidate){
            socket.emit('COPY_CANDIDATE', pSocketId, event.candidate);
        }
    };

    peerConnections[pSocketId].ontrack = event => {
        var remoteUserId = '';
        if(users != undefined){
            for( var i=0; i<users[roomId].length; i++){
                if(users[roomId][i]['socketId'] == pSocketId){
                    remoteUserId = users[roomId][i]['loginId'];
                    break;
                }
            }
        }

        if(remoteUserId!=''){
            memberUpdate('enter', remoteUserId, pSocketId);  
            var remoteVideo = document.getElementById(remoteUserId+"Video");
            if(remoteVideo != null){
                remoteVideo.srcObject = event.streams[0];
            }
        }
    };

    peerConnections[pSocketId].setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
        peerConnections[pSocketId]
        .createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(sdp =>{
            peerConnections[pSocketId].setLocalDescription(new RTCSessionDescription(sdp));
            socket.emit('PEER_COPY_ANSWER', {
                socketId : socket.id,
                oppositeSocketId : pSocketId,
                roomId : roomId,
                loginId : loginId,
                sdp : sdp
            });

            PCs.push(peerConnections[pSocketId]);
        })
        .catch(error => {
            console.log(error);
        });
    });

});

socket.on('GET_PEER_COPY_ANSWER', (data) =>{ 
    const desc = new RTCSessionDescription(data.sdp);
    peerConnections[data.socketId].setRemoteDescription(desc).catch( e=> console.log(e) );

    socket.emit('PEER_COPY_ANSWER_OK');
});

socket.on('PEER_COPY_ANSWER', (data) =>{ 
    const desc = new RTCSessionDescription(data.sdp);
    peerConnections[data.oppositeSocketId].setRemoteDescription(desc).catch( e=> console.log(e) );

    socket.emit('PEER_COPY_ANSWER_OK');
});

socket.on('JOIN_ROOM_PERMIT', (sdp) =>{
    const desc = new RTCSessionDescription(sdp);
    peerConnections[socketId].setRemoteDescription(desc).catch( e=> console.log(e) );
    socket.emit('PEERING_SUCCESS', {
        socketId : socketId,
        roomId : roomId,
        loginId : loginId,
        role : role
    });
});

socket.on('ROOM_FULL', () =>{
    alert('설정된 참여자수를 초과하였습니다.');
    window.history.back();
});


socket.on('ON_PEERING', () =>{
    alert('다른 참여자가 입장중입니다. 잠시후 입장해주세요.');
    window.history.back();
});

socket.on('DUP_USER', () =>{
    alert('중복참여할 수 없습니다.');
    window.history.back();
});

socket.on("audio_mute_info", (message) => {
    getAudioMuteChange(message);
});

socket.on('change_nick_p', (message) => {
    getNickChange(message);
})

socket.on('reverseScreen', (videoId) =>{
    reverseOtherScreen(videoId);
});

socket.on('getChat', function(data) {
    getChat(data.result);
});

socket.on("SPEAKING_USER", (message) => {
    speaking_user(message);
});

socket.on("STOPPED_SPEAKING_USER", (message) => {
    stopped_speaking_user(message);
});

socket.on("update", (data) => {
    update(data);
});

socket.on('progressRate', (percent) =>{
    updateProgress(percent);
});

socket.on('uploadError', () => {
    uploadError();
});

socket.on('USER_EXIT', (pSocketId) =>{
    for(var i=0; i < users[roomId].length ; i++){
        if(users[roomId][i]['socketId']==pSocketId){
            var video = document.getElementById(users[roomId][i]['loginId']+"Video");
            video.srcObject = null;
            video.removeAttribute('class');
            video.setAttribute('class', 'stream_off');
            video.id = '';
            
            video.parentElement.parentElement.style.display = 'none';            
			users[roomId].splice(i,1);
			delete peerConnections[pSocketId];
            break;
        }
    }
    
    var cnt = document.getElementById('user_count');
    cnt.innerText = users[roomId].length + '명';

    var ul = users[roomId].length;
    var vid_ul = document.getElementById('vid_ul');

    if(ul < 3){
        vid_ul.removeAttribute('class');
    }

    if(ul >= 3 && ul < 5){
        vid_ul.removeAttribute('class');
        vid_ul.setAttribute('class', 'vid_nm_34');
    }

    if(ul >= 5){
        vid_ul.removeAttribute('class');
        vid_ul.setAttribute('class', 'vid_nm_56');
    }

    socket.emit('USER_EXIT_COMPLETE');
});

socket.on('OFF_SPEAKING', (oid) =>{
    off_speaking(oid);
});

socket.on('dis_record', () =>{
    dis_record();
});

function getAudioMuteChange(message){
    if(message.audio === true)
        document.getElementById(message.userName+'Video').parentElement.parentElement.querySelector('.info_ctxt').querySelector('button').classList.remove('off');
    else
        document.getElementById(message.userName+'Video').parentElement.parentElement.querySelector('.info_ctxt').querySelector('button').classList.add('off');
}

function openInvite(roomId){
    var _width = '500';
    var _height = '350';
    var _left = Math.ceil((window.screen.width-_width)/2);
    var _top = Math.ceil((window.screen.height -_height)/2);

    window.open('invite.ejs?roomId='+roomId, 'invite_page', 'width='+_width+',height='+_height+',left='+_left+',top='+_top+'resizable = no, scrollbars = no');
}

function startRecordingTimer(showTime){
    var hour = 0;
    var minutes = 0;
    var seconds = 0;

    interval = setInterval(function(){
        seconds = parseInt(seconds) + 1;
        if(seconds >= 60){minutes = parseInt(minutes) + 1; seconds = 0;}
        if(minutes >= 60){hour = parseInt(hour) + 1; minutes = 0;}

        showTime.innerHTML = `${hour<10 ? `0${hour}`:hour}:${minutes<10 ? `0${minutes}`:minutes}:${seconds<10 ? `0${seconds}`:seconds}`;
    }, 1000);
}

function dis_record(){
    for(var i in mediaRecorder){
        if(mediaRecorder[i].state != 'inactive'){
            var r = document.getElementById('record_set');
            r.innerHTML ='<i class="ri-record-mail-fill"></i><span class="name">녹화</span>';
            r.removeAttribute('onclick');
            r.setAttribute('onclick', 'recordWhole(this)');
            var clock = document.getElementsByClassName('clock')[0];
            clock.innerText = '';
            clearInterval(interval);
            mediaRecorder[i].stop();
            clock.style.margin = '0 0 0 0';
        }
    }
}

function off_speaking(oid){
    $('#'+oid+'Video').parents('li').css("boxShadow", "none");
}

function speaking_user(message){
    $('#'+message.loginId+'Video').parents('li').css("boxShadow", "0 0 0 3px yellow");
}

function stopped_speaking_user(message){
    $('#'+message.loginId+'Video').parents('li').css("boxShadow", "none");
}

function vPlay(obj){
    obj.play();
}

function onExit(){
    if(confirm('정말 종료하시겠습니까?')){
       location.href = '/';
    }else{
        return false;
    }
}

function getStream() {
    return changeDevice();
}

function handleError(error){
    if(error.name == 'NotAllowedError'){
        $('.view_all').removeClass('on');
        $('.h_btn.share').removeClass('on');
        $('.h_btn.share').addClass('off');
    }else{
        alert('시작하기에 불충분한 요소가 포함되어 있습니다.\n' + error);
        location.href = '/';
    }
}

async function memberUpdate(data, id, sid){
    var video = document.querySelectorAll('video');
    
    var nicknm = document.getElementsByClassName('nicknm');
    var s_id = document.getElementsByClassName('s_id');
    
    if(data == 'enter'){
        for(var i=0; i<video.length; i++){
            if(video[i].id == (id+'Video')){video[i].id = '';}
            if(video[i].id == ''){
                s_id[i].value = sid;
                video[i].removeAttribute('class');
                video[i].setAttribute('class', 'stream_on');
                video[i].id = id + 'Video';
                video[i].muted = false;
                video[i].parentElement.removeAttribute('class');
                video[i].parentElement.setAttribute('class', 'v_view');
                video[i].parentElement.parentElement.style.display = 'block';

                nicknm[i].innerText = id;
                break;
            }

            if(video[i].id == (loginId+'Video')){
                for(var j=0; j<video[i].parentElement.parentElement.querySelector('.nicknmBtn').querySelectorAll('i').length; j++){
                    video[i].parentElement.parentElement.querySelector('.nicknmBtn').querySelectorAll('i')[j].style.display = 'none';
                }
                var v_icon = video[i].parentElement.parentElement.querySelector('.label.mic').querySelectorAll('i');
                v_icon[0].removeAttribute('class');
                v_icon[0].setAttribute('class', 'micicon on');
                v_icon[1].removeAttribute('class');
                v_icon[1].setAttribute('class', 'micicon off');
            }

            var c_sw = document.getElementsByClassName('label cameraswitch');
            for(var k=0; k<c_sw.length; k++){
                if(c_sw[k].parentElement.parentElement.parentElement.querySelector('video').id != (loginId + 'Video')){
                    c_sw[k].style.display = 'none';
                }
            }
           
        }
    }
}

function memberReset(){
    var video = document.querySelectorAll('video');
    var nicknm = document.getElementsByClassName('nicknm');

    for(var i = 0; i < video.length; i++){
        video[i].id = '';
        nicknm[i].innerText = '';
    }
}

function allUpdate(arr){
    var video = document.querySelectorAll('video');
    var nicknm = document.getElementsByClassName('nicknm');
    var s_id = document.getElementsByClassName('s_id');

    var len = arr.length;
    for(var i=0; i<len; i++){
        if(video[i].id == ''){
            video[i].id = arr[i]['loginId']+'Video';
            video[i].muted = false;
            video[i].removeAttribute('class');
            video[i].setAttribute('class', 'stream_on');
            video[i].parentElement.removeAttribute('class');
            video[i].parentElement.setAttribute('class', 'v_view');
            video[i].parentElement.parentElement.style.display = 'block';
            
            nicknm[i].innerText = arr[i]['loginId'];

            s_id[i].value = arr[i]['socketId'];
            break;
        }
    }
}

function changeNm(obj){
    var oriId = document.getElementById('loginId').innerText;
    var newId = obj.parentElement.querySelector('#change_nm').value;
    document.getElementById('loginId').innerText = newId;
    var vid = document.getElementById(oriId+'Video');
    var nicknm = vid.parentElement.parentElement.querySelector('.nicknm');
    nicknm.innerText = newId;
    vid.removeAttribute('id');
    vid.setAttribute('id', newId+'Video');
    loginId = newId;
 
    for(var i=0; i<users[roomId].length; i++){
        if(users[roomId][i].loginId == oriId){
            users[roomId][i].loginId = newId;
        }
    }

    alert('닉네임이 변경되었습니다.');
    socket.emit('Change_Nick', oriId, newId, roomId, users);   
}

function getNickChange(message){
    var vid = document.getElementById(message.oriId+'Video');
    vid.removeAttribute('id');
    vid.setAttribute('id', message.newId+'Video');
    document.getElementById(message.newId+'Video').parentElement.parentElement.querySelector('.nicknm').innerText = message.newId;
}

$(function(){
    setInterval(function(){
        $('video').parents('li').css("boxShadow", "none");
    }, 2000);
});