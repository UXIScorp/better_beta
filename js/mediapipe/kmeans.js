let dataset;
let resultCenter = [];
let kLength;
let usersData;
let resultScore;

exports.kMeans = async function(data, userInfo, score){
    var result;
    resultCenter = [];
    usersData = userInfo;
    resultScore = score;

    for(var i in data){
        dataset = data[i];
        kLength = dataset.length;
        result = 
        await findCenteroid(dataset, kLength)
        .then(expectation)
        .then(maximazation)
        .then(iter)
        .then(function(data){
            resultCenter.push(data);
        })
        .catch(error => console.log('error in kMeans', error));
    }
    var final = await setGroup();
    return final;
}

let center;
let preRand;
let r;
let preJ;

async function findCenteroid(data, length){
    const k = length > 3 ? 4 : length > 2 ? 2 : 1;
    center = [];
    preRand = {};
    var zeros = Object.values(data);
    var flag = false;

    for(var i in zeros){
        if(zeros[i] != 0)flag = true;
    }

    if(flag){
        var count = 0;
        while(count < 15) { 
            let rand = Math.floor(Math.random() * data.length);

            if(preRand[rand]) continue;
            if(JSON.stringify(data[rand]) == JSON.stringify(center[center.length-1])){
                preRand[rand] = false;
                continue;
            }
            if(data[rand]) {
                center.push(data[rand]);
                preRand[rand] = true;
            }
            if(center.length == k) break;
            count++;
        }
    }else{
        for(var i=0; i < k; i++)
            center.push([0]);
    }
}

function expectation(){
    r = [];
    for(let n = 0 ; n < dataset.length ; n++) {
        let x = dataset[n];
        let minDist = -1, rn = 0;
        for(let k = 0 ; k < center.length ; k++) {
            let dist = getDistance(x, center[k]);
            if(minDist === -1 || minDist > dist) {
                minDist = dist;
                rn = k;
            }
        }
        r[n] = rn;
    }
}

function maximazation(){
    center = Array.apply(null, Array(center.length));
    let centerSum = Array.apply(null, Array(center.length)).map(Number.prototype.valueOf, 0);
    
    for(let n = 0 ; n < dataset.length ; n++) {
        let k = r[n] * 1;
        let x = dataset[n];

        if(!center[k]) center[k] = {};

        for(let key in x) {
            if(!center[k][key]) center[k][key] = 0;
            center[k][key] += x[key] * 1;
        }

        centerSum[k]++;
    }

    for(let k = 0 ; k < center.length ; k++) {
        for(let _key in center[k]) {
            center[k][_key] = center[k][_key] / centerSum[k * 1];
        }
    }
    
    for(let i = 0; i < center.length; i++){
        if(center[i] == undefined && center[0]['0'] != 0){
            findCenteroid(dataset, kLength)
            .then(expectation)
            .then(maximazation)
            .catch(error=>console.log('error in undefined', error))
        }
    }
}

function iter(){
    preJ = 0;
    var count = 0;
    while(count < 15) {
        let r = [];
        for(let n = 0 ; n < dataset.length ; n++) {
            let x = dataset[n];
            let minDist = -1, rn = 0;
            for(let k = 0 ; k < center.length ; k++) {
                let dist = getDistance(x, center[k]);
                if(minDist === -1 || minDist > dist) {
                    minDist = dist;
                    rn = k;
                }
            }
            r[n] = rn;
        }

        center = Array.apply(null, Array(center.length));
        let centerSum = Array.apply(null, Array(center.length)).map(Number.prototype.valueOf, 0);
        for(let n = 0 ; n < dataset.length ; n++) {
            let k = r[n] * 1;
            let x = dataset[n];

            if(!center[k]) center[k] = {};

            for(let key in x) {
                if(!center[k][key]) center[k][key] = 0;
                center[k][key] += x[key] * 1;
            }

            centerSum[k]++;
        }

        for(let k = 0 ; k < center.length ; k++) {
            for(let _key in center[k]) {
                center[k][_key] = center[k][_key] / centerSum[k * 1];
            }
        }

        let J = 0;
        for(let n = 0 ; n < dataset.length ; n++) {
            let x = dataset[n];
            let minDist = -1;
            for(let k = 0 ; k < center.length ; k++) {
                let dist = getDistance(x, center[k]);
                if(minDist === -1 || minDist > dist) {
                    minDist = dist;
                }
            }
            J += minDist;
        }

        let diff = Math.abs(preJ - J);
        if(diff <= 0) break;
        preJ = J;
        count++;
    };

    return center;
}

function getDistance(x, y){
    let sum = 0;
    let keys = {};
    try{
        if(typeof y == 'number')y = [y];
        for(let key in x) keys[key] = true;
        for(let key in y) keys[key] = true;
        for(let key in keys) {
            let xd = x[key] ? x[key] * 1 : 0;
            let yd = y[key] ? y[key] * 1 : 0;
            sum += (xd - yd) * (xd - yd);
        }
    }catch(error){
    }
    return Math.sqrt(sum);
}

async function setGroup(){
    var totalScore = 0;

    for(var i in usersData){
        var length = Object.keys(usersData[i]).length;
        var loginIds = Object.keys(usersData[i]);

        if(i == 'data' || length == 1)continue;
        if(length == 2){
            if(usersData[i][loginIds[0]] == 0 && usersData[i][loginIds[1]] == 0 ){
                resultScore['totalScore'] = 0;
                resultScore[loginIds[0]] = parseInt((resultScore[loginIds[0]] + 0) / 2);
                resultScore[loginIds[1]] = parseInt((resultScore[loginIds[1]] + 0) / 2);
            }else if(usersData[i][loginIds[0]] != 0 && usersData[i][loginIds[1]] != 0){

            }else{
                resultScore['totalScore'] = 50;
                if(usersData[i][loginIds[0]] == 0){
                    resultScore[loginIds[0]] = parseInt((resultScore[loginIds[0]] + 0) / 2);
                    resultScore[loginIds[1]] = parseInt((resultScore[loginIds[1]] + 100) / 2);
                }else{
                    resultScore[loginIds[0]] = parseInt((resultScore[loginIds[0]] + 100) / 2 );
                    resultScore[loginIds[1]] = parseInt((resultScore[loginIds[1]] + 0) / 2);
                }
            }
        }else{}
    }
    return 0;
}

exports.countScore = async function(resultScore){
    var total_user = 0;
    var totalScore = 0;
    for(var user in resultScore){
        totalScore += resultScore[user];
        total_user++;
    }
    totalScore = parseInt(totalScore / total_user);
    resultScore['totalScore'] = totalScore;

    return 0;
}
