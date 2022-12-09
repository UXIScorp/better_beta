function send_msg() {
    var message = document.getElementById('msg_box').value;
    var selected = 'All';

    document.getElementById('msg_box').value = '';

    const chat_inner = document.getElementById('chat_inners');
    
    if(message !='' & message!='\n'){
        if(document.getElementById('btn_send').text==='파일전송') { 
            var href_message='';
            var each = message.split('\n');
            for(var i=0; i<each.length-1; i++) {
                var value = roomId+'/'+each[i];
                
                href_message += `<div class="file"><img src="/share/img/icon_file.png"><a href="#" onclick='
                                             document.all.filename.value="${value}";
                                             document.all.fileform.submit();
                                             document.all.filename.value="";
                                             '>${each[i]}</a></div><br>`;
            }
            message=href_message;
        }

        var sendTo = '';
        if(selected != 'All'){
            role === 'student' ? sendTo = '(선생님에게)' : sendTo = '('+selected+')';
        }
        chat_inner.innerHTML += `<li style="text-align: right; padding-right: 2px;"><h1>${loginId}${sendTo}</h1><p>${message}</p></li>`
        
        var today = new Date();
        roomTime = today.getTime();

        socket.emit('message', {type: 'message', message: message, roomId : roomId, loginId : loginId, roomTime:roomTime, selected: selected})
        chatScrollDown();
    }
}

function chatScrollDown(){
    var chat_scroll = $('#chatPop_scroll').parents('.p_info');
    chat_scroll.scrollTop(chat_scroll[0].scrollHeight);
}

function enterkey() { 
    if (window.event.keyCode == 13) {
         send_msg();
         if(document.getElementById('btn_send').text=='파일전송')
            send_file();
    }
}

function checkType(){
    if($('#btn_sendMsg').text()=='전송' || $('#btn_sendMsg').text()=='채팅전송'){
        send_msg();
    }else{
        document.getElementById('msg_box').value = '';
        $('#btn_send').text('파일');
        $('#btn_sendMsg').text('전송');
    }
}

function update(data) { 
    var selected = '';
    
    const chat_inner = document.getElementById('chat_inners');
    chat_inner.innerHTML += `<li><h1>${data.loginId}${selected}</h1><p>${data.message}</p></li>`;
    
    show_chat();
    chatScrollDown();
}
function show_chat(){
    if(!$('.header .chat.right_btn').hasClass("active")){
        $('.header .chat.right_btn').addClass("active");
        $('.chat_box.right_pop').addClass('on');
    }
    if(!$('.cont .inner').hasClass("on")){
        $('.cont .inner').addClass('on');
    }
}

function getChat(data) {
    const chat_inner = document.getElementById('chat_inners');
    for(var i=0; i<data.length; i++){
        chat_inner.innerHTML += `<li><h1>${data[i].user_name}</h1><p>${data[i].msg}</p></li>`
    }
}
