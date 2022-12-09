var shareScreen = {}, isSharing = {}, isReversed = {}, isClickSharing = {};

async function shareStart(){

    var nua = detectMobileDevice(window.navigator.userAgent);

    if(nua == true){
        alert('모바일 기기에서는 화면공유 기능을 지원하지 않습니다.');
        return false;
    }

    var stream;
    var voiceStream;
    var desktopStream;
    var tracks;

    desktopStream = await navigator.mediaDevices.getDisplayMedia({video:true});
    if(!document.getElementById(loginId+'Video').parentElement.parentElement.querySelector('.label.mic').classList.contains('active')){
        voiceStream = await navigator.mediaDevices.getUserMedia({video:false, audio:true});
        tracks = [...desktopStream.getTracks(), ...voiceStream.getAudioTracks()];
    }else{
        voiceStream = null;
        tracks = desktopStream.getTracks();
    }
    
    stream = new MediaStream(tracks);
    
    var video = $('#'+loginId+'Video')[0];
    video.srcObject = stream;
    shareScreen[roomId] = stream;

    try{
        changeTrack(stream);
        $('.sharing_nope').css('display', 'block');
        reverseScreen(loginId);
    }catch(e){
        console.log("userStream error : "+e);
    }
}

function end_share(){
    var flag = confirm('화면공유를 중단 하시겠습니까?');

    if(!flag){
        return false;
    }
    if (shareScreen[roomId]){
        shareScreen[roomId].getTracks().forEach(track => {
            track.stop();
        });
    }

    $('.sharing_nope').css('display', 'none');
    $('.h_btn.share').removeClass('on').addClass('off');
    
    reverseScreen(loginId);

    if($('.items.mic').hasClass('active'))
        $('.items.mic').removeClass('active');
        
    $('.h_btn.share').removeClass('active');
    changeDevice();
}

function clickSharing(data){
    var videoElement = $('#'+loginId+'Video')[0];
    var flag = confirm('이 비디오를 공유하시겠습니까?');
    if(flag){
        isClickSharing[roomId] = true;
        isSharing[roomId] = true;
        data[0].childNodes.forEach(function(video){
            if(video.tagName == 'VIDEO'){
                videoElement.srcObject = video.srcObject;
                shareScreen[roomId] = video.srcObject;

                if(!$('.'+video.id).css('transform').includes('3d')){
                    $('.mainVideo').css('transform', 'translate(-50%, 0)');
                    socket.emit('share_reflect_teacher', {roomId : roomId, flag : true, studentId: (userName !== undefined ? userName : null)});
                    isReversed[roomId] = true;
                }else{
                    $('.mainVideo').css('transform', 'rotateY(180deg) translate(50%, 0)');
                    socket.emit('share_reflect_teacher', {roomId : roomId, flag : false, studentId: (userName !== undefined ? userName : null)});
                }

                try{
                    changeTrack(video.srcObject);
                }catch(e){
                    console.log("userStream error : "+e);
                }
            }
        })
    }
}

function checkSharing(){
    if(isSharing[roomId]){
        if(isReversed[roomId]){
            socket.emit('share_reflect_teacher', {roomId : roomId, flag : true, studentId: (userName !== undefined ? userName : null)});
        }else{
            socket.emit('share_reflect_teacher', {roomId : roomId, flag : false, studentId: (userName !== undefined ? userName : null)});
        }

        try{
            changeTrack(shareScreen[roomId]);
    
        }catch(e){
            console.log("userStream error : "+e);
        }
    }
}

function changeTrack(data){
    PCs.forEach(function(pc){
        if(pc.getSenders() != null){
            pc.getSenders().find(function(s){
                if(s.track != null){
                    if(s.track.kind == 'video'){
                        s.replaceTrack(data.getVideoTracks()[0]);
                    }else
                    if(s.track.kind == 'audio'){
                        if(data.getAudioTracks()[0] != undefined){
                            s.replaceTrack(data.getAudioTracks()[0]);
                        }
                    }
                }
            });
        }
    })
}

function reverseScreenT(obj){
    var videoCss = $(obj).parent().parent().parent().find('video');

    var id = videoCss.attr('id').replace('Video', '');
    var matrix = videoCss.css('transform');
    var newMatrix;
    if(matrix.includes('\(-1')){
        newMatrix = matrix.replace('\(-1','\(1');
    }else{
        newMatrix = matrix.replace('\(1','\(-1');
    }
    videoCss.css('transform', newMatrix);

    if(id == loginId){
        socket.emit('reverseOtherScreen', {roomId : roomId, flag : true, id : id});
    } 
}

function reverseScreen(obj){
    if(typeof(obj) == 'string'){
        var videoCss = $('#'+obj+'Video');
    }else{
        var videoCss = $(obj).parent().parent().parent().find('video');
    }
    var id = videoCss.attr('id').replace('Video', '');
    var matrix = videoCss.css('transform');
    var newMatrix;
    if(matrix.includes('\(-1')){
        newMatrix = matrix.replace('\(-1','\(1');
    }else{
        newMatrix = matrix.replace('\(1','\(-1');
    }
    videoCss.css('transform', newMatrix);
    socket.emit('reverseOtherScreen', {roomId : roomId, flag : true, id : id});
}

function reverseOtherScreen(id){
    var videoCss = $('#'+id+'Video');
    var matrix = videoCss.css('transform');
    var newMatrix;
    if(matrix.includes('\(-1')){
        newMatrix = matrix.replace('\(-1','\(1');
    }else{
        newMatrix = matrix.replace('\(1','\(-1');
    }
    videoCss.css('transform', newMatrix);
}