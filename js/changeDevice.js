let vi, vq, ai, ao, mv, qualityChange, showStream;
function changeDevice() {
    if (window.stream){
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    const videoinput = vi = $('#videoinput').val();
    const videoinput2 = vi2 = $('#videoinput2').val();
    const videoQuality = vq = $('#videoQuality').val() != undefined ? $('#videoQuality').val().split('x') : ['240', '180'];
    const audioinput = ai = $('#audioinput').val();
    const micVolume = mv = $('#micVolume').val();
    const audiooutput = ao = $('#audiooutput').val();
    const facinginput = fm = $('#facinginput').val() != undefined ? $('#facinginput').val() : "environment";
    document.getElementById(loginId+'Video').volume = 0;
   
    let d_width = videoQuality ? videoQuality[0] : undefined;
    let d_height = videoQuality ? videoQuality[1] : undefined;

    let constraints;
    
    const constraints_m = {
        audio:  {
            deviceId: audioinput ? {exact: audioinput} : undefined,
            volume: micVolume ? micVolume : undefined,
            echoCancellation : true,            
            noiseSuppression : true,            
            channelCount : 1,                   
            sampleRate: 16000,
            sampleSize: 16
        },
        video:  {
                    deviceId: videoinput2 ? {exact: videoinput2} : undefined,
                    facingMode: facinginput ? facinginput : "environment",
                    width: d_width,
                    height: d_height
        }
    };
    
    const constraints_p = {
        audio:  {
            deviceId: audioinput ? {exact: audioinput} : undefined,
            volume: micVolume ? micVolume : undefined,
            echoCancellation : true,            
            noiseSuppression : true,            
            channelCount : 1,                   
            sampleRate: 16000,
            sampleSize: 16
        },
        video:  {
                    deviceId: videoinput ? {exact: videoinput} : undefined,
                    width: d_width,
                    height: d_height
                }
    };

    const constraints_ip = {
        audio: true,
        video: {
            width: 640,
            height: 480
        }
    };

    const constraints_im = {
        audio: true,
        video: {
            facingMode: facinginput ? facinginput : "environment",
            width: 640,
            height: 480
        }
    }
        
    var b = getBrowserInfo();
    var nua = detectMobileDevice(window.navigator.userAgent);
    
    if(nua == true){
        if(b == 'SAFARI'){
            constraints = constraints_im;
        }else{
            constraints = constraints_m;
        }
    }else{
        if(b == 'SAFARI'){
            constraints = constraints_ip;
        }else{
            constraints = constraints_p;
        }
    }

    if(navigator.mediaDevices.getUserMedia(constraints)){
        return navigator.mediaDevices.getUserMedia(constraints)
                .then(gotStream)
                .catch(handleError)
                .finally(getDeviceInfo);
    }else{
        return false;
    }
}

function getDeviceInfo() {
    $('#audioinput').children().remove();
    $('#audiooutput').children().remove();
    $('#videoinput').children().remove();
    $('#videoinput2').children().remove();
    
    navigator.mediaDevices.enumerateDevices().then(function(deviceList){
        deviceList.forEach(function(device){
            if(device.kind == 'audioinput') {
                ai = ai === null ? device.deviceId : ai;
                $('#audioinput').append('<option value=' + device.deviceId + ' ' + (ai === device.deviceId ? 'selected >' : '>') + (device.label === "" ? device.deviceId : device.label) + '</option>' );
            }
            if(device.kind == 'audiooutput'){
                ao = ao === null ? device.deviceId : ao;   
                $('#audiooutput').append('<option value=' + device.deviceId + ' ' + (ao === device.deviceId ? 'selected >' : '>') + (device.label === "" ? device.deviceId : device.label) + '</option>' );
            }
            if(device.kind == 'videoinput'){
                vi = vi === null ? device.deviceId : vi;
                vi2 = vi2 === null ? device.deviceId : vi2;
                $('#videoinput').append('<option value=' + device.deviceId + ' ' + (vi === device.deviceId ? 'selected >' : '>') + (device.label === "" ? device.deviceId : device.label) + '</option>' );
                $('#videoinput2').append('<option value=' + device.deviceId + ' ' + (vi2 === device.deviceId ? 'selected >' : '>') + (device.label === "" ? device.deviceId : device.label) + '</option>' );
            }
        });
    }).then(checkDevice).catch(function(err){
        console.log(err.name + " : " + err.message);
    });

    return showStream;
}

function handleError(error) {
    
    if(error.name == 'OverconstrainedError'){
        console.log('Changing Video Quality Error : ', error.name)
    }else if(error.name == 'ConstraintNotSatisfiedError'){
        console.log("미디어 장비에서 "+ constraints.video.width.exact + "x" + constraints.video.height.exact + " 를 지원하지 않습니다. ");
    }else if(error.name == 'NotAllowedError'){
        console.log('화면공유를 취소하였습니다.');
        $('.resume.right_btn').removeClass('active');
        $('.view_all').removeClass('on');
    }else{
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }}

function attachSinkId(){
    const element = document.querySelectorAll('video');
    const sinkId = $('#audiooutput').val();
    
    element.forEach(function(video){
        if(typeof video.sinkId !== 'undefined'){
            video.setSinkId(sinkId)
                .catch(error => {
                    if(error.name === "SecurityError"){
                        console.log('You need to use TTPS for selecting audio output device: ' + error);
                    }
                })
        }else{
            console.warn('Browser does not support output device selection');
        }
    })
    
}

function gotStream(stream) {
    window.stream = stream; 
    
    var vid = (loginId+'Video').trim();
    var video = document.getElementById(vid);

    video.srcObject = stream;
    
    var speech = hark(stream, {threshold: -55});
    speech.on('speaking', function() {
        socket.emit('SPEAKING', {
            roomId: roomId,
            loginId : loginId
        });
    });

    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    const context = new AudioContext();
    let mediaStreamSource, mediaStreamDestination, gainNode;
    if(stream.getAudioTracks()[0] != undefined){
        mediaStreamSource = context.createMediaStreamSource(stream);
        mediaStreamDestination = context.createMediaStreamDestination();
        gainNode = context.createGain();
        
        gainNode.gain.value = mv === undefined ? 0.5 : mv > 1 ? mv*0.01 : mv;
        gainNode.channelCount = 1;
        mediaStreamSource.connect(gainNode);
        gainNode.connect(mediaStreamDestination);
    }

    try{
        PCs.forEach(function(pc){
            if(pc.getSenders() != null){
                pc.getSenders().find(function(s){
                    if(s.track != null){
                        if(s.track.kind == 'video'){
                            s.replaceTrack(stream.getVideoTracks()[0]);
                        }
                        if(s.track.kind == 'audio'){
                            if(mediaStreamDestination != undefined){
                                s.replaceTrack(mediaStreamDestination.stream.getAudioTracks()[0]);
                            }
                            else if(stream.getAudioTracks()[0] != undefined){
                                s.replaceTrack(stream.getAudioTracks()[0]);
                            }
                        }
                    }
                });
            }
        })
	}catch(e){
		console.log("userStream error : "+e);
	}
    
    showStream = stream;
    return showStream;
}

function setAudioMute(){
    try{
        showStream.getAudioTracks()[0].enabled = !showStream.getAudioTracks()[0].enabled;
        var aud = document.getElementsByClassName('util')[0].childNodes[3];
        aud.removeAttribute('class');
        if(showStream.getAudioTracks()[0].enabled){
            aud.setAttribute('class', 'items mic');
        }else{
            aud.setAttribute('class', 'items mic active');
        }
    }catch(err){
        console.error(err);
    }
}

function setAllAudioMute(){
    try {
        var video = document.getElementsByTagName('video');
        for(var i=0; i<video.length; i++){
            var target_stream = video[i].srcObject;
            var aud = video[i].parentElement.parentElement.querySelector('.label.mic');
            
            if(target_stream != null){
                if(video[i].id != (loginId+'Video')){
                    if(target_stream.getAudioTracks()[0].enabled){
                        target_stream.getAudioTracks()[0].enabled = !target_stream.getAudioTracks()[0].enabled;
                        aud.removeAttribute('class');
                        aud.setAttribute('class', 'label mic active');
                    }else{
                        target_stream.getAudioTracks()[0].enabled = !target_stream.getAudioTracks()[0].enabled;
                        aud.removeAttribute('class');
                        aud.setAttribute('class', 'label mic');
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

function setTargetAudioMute(obj){
    if(obj.parentElement.parentElement.parentElement.querySelector('video').getAttribute('id') == loginId + 'Video'){
        try{
            showStream.getAudioTracks()[0].enabled = !showStream.getAudioTracks()[0].enabled;

            var aud = obj;
            if(showStream.getAudioTracks()[0].enabled)
                aud.setAttribute('class', 'label mic');
            else
                aud.setAttribute('class', 'label mic active');

            socket.emit("audio_mute", {
                senderSocketId: socket.id,
                roomId: roomId,
                userName: loginId,
                audio : showStream.getAudioTracks()[0].enabled
            });    
        }catch(err){
            console.error(err);
        }
    }else{
        try{
            var target_stream = obj.parentElement.parentElement.parentElement.querySelector('video').srcObject;
            if(target_stream != null){
                target_stream.getAudioTracks()[0].enabled = !target_stream.getAudioTracks()[0].enabled;
            }
            var aud = obj;
            aud.removeAttribute('class');
            if(target_stream.getAudioTracks()[0].enabled){
                aud.setAttribute('class', 'label mic');
            }else{
                aud.setAttribute('class', 'label mic active');
            }
        }catch(err){
            console.error(err);
        }
    }
}

function setVideoMute(){
    try{
        showStream.getVideoTracks()[0].enabled = !showStream.getVideoTracks()[0].enabled;
        var cam = document.getElementsByClassName('util')[0].childNodes[1];    
        cam.removeAttribute('class');
        if(showStream.getVideoTracks()[0].enabled){
            cam.setAttribute('class', 'items camera');
        }else{
            cam.setAttribute('class', 'items camera active');
        }
    }catch(err){
        console.error(err);
    }
}

function setTargetVideoMute(obj){
    try{
        var target_stream = obj.parentElement.parentElement.parentElement.querySelector('video').srcObject;
        target_stream.getVideoTracks()[0].enabled = !target_stream.getVideoTracks()[0].enabled;
        var cam = obj;
        cam.removeAttribute('class');
        if(target_stream.getVideoTracks()[0].enabled){
            cam.setAttribute('class', 'label camera');
        }else{
            cam.setAttribute('class', 'label camera active');
        }
    }catch(err){
        console.error(err);
    }
}

function checkDevice(){
    const ua = window.navigator.userAgent;
    const isMobile = detectMobileDevice(ua);
    const mobileOS = detectDevice(ua);
    const chrome = detectWeb(ua);

    if(isMobile && mobileOS != 'ANDROID'){
        document.getElementById('audiooutput').parentNode.setAttribute('style', 'display:none');
    }

    if(!chrome){
        document.getElementById('audiooutput').parentNode.setAttribute('style', 'display:none');
    }
}

function detectMobileDevice(agent){
    const mobileRegex = [
        /Android/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ]

    var flag = mobileRegex.some(mobile => agent.match(mobile));
    return flag;
}

function detectDevice(agent){
    var mobileOS;
    var ua = agent.toLowerCase();
    if(ua.indexOf('android') > -1){
        mobileOS = 'ANDROID';
    }else if(ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('ipod') > -1){
        mobileOS = 'IOS';
    }else{
        mobileOS = 'OTHER';
    }

    return mobileOS;
}

function detectWeb(agent){
    var ua = agent.toLowerCase();
    var chrome = false;
    if(ua.indexOf('chrome') > -1){
        chrome = true;
    }

    return chrome;
}

function setTargetSelfAudioMute(obj){
    if(obj.parentElement.parentElement.parentElement.querySelector('video').getAttribute('id') == loginId + 'Video'){
        try{
            showStream.getAudioTracks()[0].enabled = !showStream.getAudioTracks()[0].enabled;

            if(showStream.getAudioTracks()[0].enabled)
                obj.classList.remove('off');    
            else
                obj.classList.add('off');

            socket.emit("audio_mute", {
                senderSocketId: socket.id,
                roomId: roomId,
                userName: loginId,
                audio : showStream.getAudioTracks()[0].enabled
            });    
        }catch(err){
            console.error(err);
        }
    }else{
        return false;
    }
}

navigator.mediaDevices.addEventListener('devicechange', function(event) {
    changeDevice();
});