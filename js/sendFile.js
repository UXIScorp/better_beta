function send_file() {
    if(document.getElementById('btn_send').text=='파일전송'){ 
        var select = document.getElementsByName('uploadFile')[0];
        if(select.value !== "" ) {
            document.getElementsByName("file_roomid")[0].value=roomId;
            document.getElementsByName("btn_submit")[0].click();
        }
        document.getElementById('btn_send').text='파일';
        $('#btn_sendMsg').text('전송')
    }else{
        select_file();
    }
}

function select_file() { 
    if(document.getElementById('btn_send').text=='파일전송'){
        send_msg();
        send_file();
    }else{
        if(document.getElementsByName('uploadFile')[0].value == ''){
            document.getElementsByName('uploadFile')[0].click(); 
        }else{
            document.getElementsByName('uploadFile')[0].value = '';
            document.getElementsByName('uploadFile')[0].click();
        }
    }
}

function show_file(file) {
    document.getElementById('msg_box').value ='';
    for(var i=0; i<file.files.length; i++) {
        var path = file.files[i].name;
        var each = path.split("\\");
        var eachname = each[each.length-1];
        document.getElementById('msg_box').value += eachname+'\n';
    }

    document.getElementById('btn_send').text='파일전송'; //#11
    $('#btn_sendMsg').text('취소');
}

function updateProgress(percent){
    var pro = document.getElementsByClassName('progress')[0];
    
    var per = percent.percent;
    pro.style.display = 'block';
    pro.style.width = per + '%';
    pro.innerText = per + '%';

    if(per == 100){
        pro.style.display = 'none';
    }
}

function uploadError(){
    alert('업로드 중 에러가 발생하였습니다. 업로드 중에는 파일을 클릭하지 말아주세요.');

    var pro = document.getElementsByClassName('progress')[0];
    pro.style.display = 'none';
    pro.style.width = 0;
}