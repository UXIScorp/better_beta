document.onkeydown = function(e){
    key = (e) ? e.keyCode : event.keyCode;
    ctrl = (e) ? e.ctrlKey  : event.ctrlKey;
    
    if( (ctrl == true && (key == 78 || key == 82)) || key==116){
        if(e)
            e.preventDefault();
        else{
                event.keyCode = 0;
                event.returnValue = false;
        }
    }
}

document.oncontextmenu = function(e){
    if(e)e.preventDefault();
    else{
        event.keyCode = 0;
        event.returnValue = false;
    }
    
}

history.pushState(null, null, location.href);
window.onpopstate = function (event) {
    console.log('no back')
    history.go(1);
};

var _html = document.querySelector('html');
var _body = document.body;
var _wrap = document.querySelector('.wrap');
var _header = document.querySelector('.header');

function fullScreen(obj){
    if(obj.tagName == "VIDEO"){
        var video = obj;
    }else{
        var video = obj.parentElement.parentElement.parentElement.querySelector('video');
    }
    
    try{
        if(video.requestFullscreen){                
            video.requestFullscreen({navigationUI: "hide"});
        }else if(video.webkitRequestFullscreen){    
            video.webkitRequestFullscreen();
        }else if(video.msRequestFullscreen){        
            video.msRequestFullscreen();
        }
        
    }catch(error){
        console.log('FullScreen Error:', error);
    }
}

function getBrowserInfo(){
    var agent = navigator.userAgent.toUpperCase();
    if(agent.indexOf('TRIDENT') >= 0){
        return 'IE';
    }else if(agent.indexOf('FIREFOX') >= 0){
        return 'FIREFOX';
    }else if(agent.indexOf('EDG') >= 0){
        return 'EDGE';
    }else if(agent.indexOf('SAFARI') >= 0 && agent.indexOf('CHROME') < 1){
        return 'SAFARI';
    }else if(agent.indexOf('CHROME') >= 0){
        return 'CHROME';
    }else{
        return '';
    }
}