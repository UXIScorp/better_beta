
let streamId2Id = {}  
let id2StreamId={}  
let mediaRecorder={}  
let recordersName={};

function recordThis(obj){
    var videoSrc = obj.parentElement.parentElement.childNodes[5].srcObject;
    var sid = obj.parentElement.parentElement.childNodes[1].value;
    var lid = obj.parentElement.parentElement.childNodes[11].childNodes[1].innerText;
    
    recordStart(videoSrc, sid, lid);
}

var rec_btn = document.getElementById('record_set');
let stream;
let voiceStream;
let desktopStream;

mergeAudioStreams = (desktopStream, voiceStream) => {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    let hasDesktop = false;
    let hasVoice = false;
    if (desktopStream && desktopStream.getAudioTracks().length > 0) {

    const source1 = context.createMediaStreamSource(desktopStream);
    const desktopGain = context.createGain();
    desktopGain.gain.value = 0.7;
    source1.connect(desktopGain).connect(destination);
    hasDesktop = true;
    }
    
    if (voiceStream && voiceStream.getAudioTracks().length > 0) {
    const source2 = context.createMediaStreamSource(voiceStream);
    const voiceGain = context.createGain();
    voiceGain.gain.value = 0.7;
    source2.connect(voiceGain).connect(destination);
    hasVoice = true;
    }
    
    return (hasDesktop || hasVoice) ? destination.stream.getAudioTracks() : [];
};

async function recordWhole(obj) {

    mergeAudioStreams();

    alert('팝업창에 보이는 화면 클릭 후, 공유 버튼을 눌러주시면 녹화가 시작됩니다.');
    
    desktopStream = await navigator.mediaDevices.getDisplayMedia({ video:true, audio: true });
    voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    
    const tracks = [
        ...desktopStream.getVideoTracks(), 
        ...mergeAudioStreams(desktopStream, voiceStream)
    ];
    
    stream = new MediaStream(tracks);

    var video = document.getElementById(loginId+'Video');
    var sid = video.parentElement.parentElement.querySelector('.s_id').value;
    var lid = document.getElementById('loginId').innerText;
    
    try{
        recordStart(stream,sid,lid,obj);
    }catch(e){
        console.log("Whole Recording Error : "+e);
    }
        
}

function recordStart(stream,id,loginId,obj){
    recordersName[stream.id]=loginId;
    mediaRecorder[id] = new MediaRecorder(stream);
    streamId2Id[stream.id] = id;
    id2StreamId[id]=[stream.id]
    mediaRecorder[id].ondataavailable = handleDataAvailable;
    mediaRecorder[id].start();

    obj.innerHTML ='<i class="ri-stop-fill"></i>';
    obj.removeAttribute('onclick');
    obj.setAttribute('onclick', 'dis_record();');

    var clock = document.getElementsByClassName('clock')[0];
    startRecordingTimer(clock);
    clock.style.margin = '0 15px 0 0';
}

let recordedChunks = {};

function handleDataAvailable(event) { 

    recordedChunks[event.currentTarget.stream.id]=[]

    if (event.data.size > 0) {
        recordedChunks[event.currentTarget.stream.id].push(event.data);
            var nua = detectMobileDevice(window.navigator.userAgent);
            if(nua == false){
                download(event.currentTarget.stream.id); 
            }
    } else {}
}

function uploadRecordFile(streamId){
    var blob = new Blob(recordedChunks[streamId], {
		type: "video/mp4"
    });

    var today = new Date();
    var hours = ('0' + today.getHours()).slice(-2); 
    var minutes = ('0' + today.getMinutes()).slice(-2);
    var seconds = ('0' + today.getSeconds()).slice(-2); 
    var timeString = hours + minutes + seconds;
    
    var year = today.getFullYear();
    var month = ("0" + (1 + today.getMonth())).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);
    var today_dir = year + "-" + month + "-" + day;

    var formData = new FormData();
    formData.append("file", blob);
    formData.append("filename", `${recordersName[streamId]}_video_${timeString}.mp4`);
    formData.append("path", "/record/" + today_dir + "/" + roomId + "/");

    $.ajax({
        url: "/uploadRecordFile",
        method: "POST",
        dataType: "json",
        data: formData,
        enctype: 'multipart/form-data',
        processData: false,
        contentType: false,
        complete: function(){
            if(flag === true){
                window.open("about:blank","_self").close();
            }
        }
    });
}

function download(streamId) {
    var blob = new Blob(recordedChunks[streamId], {
		type: "video/mp4"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;

    var nowdate = new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString() + new Date().getDate().toString() + "_" + new Date().getHours().toString() + new Date().getMinutes().toString() + new Date().getSeconds().toString();
    var download_title = `${recordersName[streamId]}_`+nowdate+`.mp4`;
    download_title = download_title.trim();

	a.download = download_title;
    a.click();
    window.URL.revokeObjectURL(url);

    try{delete recordersName[streamId];}catch(e){;}
    try{delete recordedChunks[streamId];}catch(e){;}
    try{delete mediaRecorder[streamId2Id[streamId]];}catch(e){;}
}