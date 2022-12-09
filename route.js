const router = require('express').Router();
const fs = require('fs');
const logger = require('./config/winston').logger;

const basicController = require('./controllers/basicController.js');

router.get('/', (request, response) =>{
    try {
        logger.info('GET /');
        basicController.saveLog(request, response);
    } catch (error) {
        logger.error('Error message');
        response.sendStatus(500); 
    }
});

router.post('/search_date', (request, response) =>{
    try {
        logger.info('POST /search_date');
        basicController.searchDate(request, response);
    } catch (error) {
        logger.error('Error message');
        response.sendStatus(500);
    }
});

router.get('/make-room', (request, response) => {
    try {
        logger.info('GET /go-login');
        response.render('./basic/select_new_meeting.ejs');
    } catch (error) {
        logger.error('Error message');
        response.sendStatus(500); 
    }
});

router.post('/download',function(request,response) {
    var filepath = __dirname + "/files/"+ request.body.filename;
    var isExists = fs.existsSync(filepath);

    if(isExists){
        try {
            logger.info('POST /download');
            response.download(filepath);
        } catch (error) {
            logger.error('Error message');
            response.sendStatus(500); 
        }
    }else{
        return false;
    }
});

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
router.post('/uploadRecordFile', multipartMiddleware, function (request, response) {

    var body = request.body;
    var files = request.files;

    const isExists = fs.existsSync(__dirname + body.path);
    if( !isExists ) {
        fs.mkdirSync(__dirname + body.path, { recursive: true } );
    }

    fs.readFile(files.file.path, function (err, data) {
        fs.writeFile(__dirname + body.path + body.filename, data, function (err) {
            if(err) {
                console.log("uploadRecordFile ERROR", err);
            }
        });
    });

    response.send('OK');
});

router.post('/uploadScreenShot', multipartMiddleware, function(request, response){

    var body = request.body;
    var files = request.files;

    const isExists = fs.existsSync(__dirname + body.path);
    if( !isExists ) {
        fs.mkdirSync(__dirname + body.path, { recursive: true } );
    }

    fs.readFile(files.file.path, function (err, data) {
        fs.writeFile(__dirname + body.path + body.filename, data, function (err) {
            if(err) {
                console.log("uploadScreenShot ERROR", err);
            }
        });
    });

    response.send('OK');
});

router.get('*', function(request, response){
    let date = new Date();
    date.setHours(date.getHours()+9);
    if(request.url != '/favicon.ico' && request.url != '/download'){
        try {
            logger.info('GET *');
            basicController.saveLog(request, response);
        } catch (error) {
            response.sendStatus(500); 
        }
    }
}) 
module.exports = router;