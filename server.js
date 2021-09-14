const httpserver = require('http');
const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const app = express();
const ejs = require('ejs');
var sd = require('silly-datetime');
var path= require("path");
var find=false;

var fileex=new Array(".webm",".flac",".mp3");

var options = {
    index: "index.html"
}

app.engine('html',ejs.__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views/html');

//app.use('/',express.static('./views/html',options));
app.use('/js',express.static(__dirname + '/views/js'));
app.use('/css',express.static(__dirname + '/views/css'));
app.use('/images',express.static(__dirname + '/views/images'));
app.use('/music',express.static(__dirname + '/views/music'));

var mysqlpool=mysql.createPool({
    connectionLimit : 10,
    host     : 'localhost',
    user     : 'root',
    password : '123456',
    database : 'msDB',
    multipleStatements: true
});

// var sqlconnection = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'root',
//     password : '123456',
//     database : 'msdb',
//     multipleStatements: true
// });

var needjump=false;
var relogintime=432000000;
var htmlinner="";
var nowplay="<a id=\"nowplaytext\" class=\"nowplaytext\" playid=\"\">no play</a>";
var logintext="<a id=\"textforlogin\" class=\"textstyle\" href=\"#\">未登录请登录</a>";
var textcont="";
var playing={
    playingid:"",
    playinglist:[]
};
var loginArr=[];
    // {
    //     loginid:"",
    //     token:""
    //     playingid:"",
    //     playinglist:[]
    // }

// sqlconnection.connect(function(err) {
//     if (err) {
//         console.error('error 连接数据库失败: ' + err.stack);
//         return;
//     }
//     console.log('连接数据库成功，线程ID： ' + sqlconnection.threadId);
// });

function readFile(filename) {
    // 同步读取
    var data = fs.readFileSync(filename, 'utf-8');
    // console.log("同步读取: " + data.toString());
    textcont="";
    textcont=data.toString();
}
function querytimes(userid){
    return new Promise(resolve => {
        var sqlq="SELECT lastlogin FROM logintb WHERE userid=\"" +userid+"\"";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err){
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                var nowdate = Date.parse(new Date());
                var last_loginDate = Date.parse(datare[0].lastlogin);
                console.log(sd.fromNow(datare[0].lastlogin));
                if ((nowdate - last_loginDate) > relogintime) {
                    needjump = true;
                    console.log("needjump true");
                }
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function queryinnerhtml(){
    return new Promise(resolve => {
        var sqlq="SELECT albumname,releasedate,releaseby FROM albumtb";
        htmlinner="";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                var releasedate="";

                htmlinner+="<form  id=\"contentcomit\" action=\"album\" method=\"get\">";
                for(var i=0;i<datare.length;i++){
                    releasedate=sd.format(datare[i].releasedate,'YYYY-MM-DD');
                    htmlinner+="<div class='img'>"
                    htmlinner+="<img  src=\"images/"+i+".jpg\" onClick=\"formSubmitalbum("+(i+1)+")\"/>"
                    htmlinner+="<span class='textline' > 专辑名："+datare[i].albumname+"<br><br>发行日期："+releasedate+"<br><br>发行单位："+datare[i].releaseby+"</span>"
                    htmlinner+="</div>"
                }
                htmlinner+="<input id=\"songidentify\" type=\"text\" name=\"identfy\" value=\"\" style=\"display: none\">";
                htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
                htmlinner+="</form>";
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function queryinnerhtmlsong(albumid) {
    return new Promise(resolve => {
        var sqlq="SELECT musicname,musicid FROM musictb WHERE albumid=\"" +albumid+"\"";
        htmlinner="";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                // console.log(datare);
                playing.playinglist=[];
                htmlinner+="<form  id=\"contentcomit\" action=\"song\" method=\"get\"><hr>";
                for(var i=0;i<datare.length;i++){
                    htmlinner+="<div class='musiclist'onClick=\"formSubmitsong("+datare[i].musicid+")\">"
                    htmlinner+="<a class='textlinem' > "+(i+1)+" :"+datare[i].musicname+"</a>"
                    htmlinner+="</div>"
                    playing.playinglist[i]=datare[i].musicid;
                }
                // console.log(playing.playinglist);
                htmlinner+="<input id=\"songnowplaytime\" type=\"text\" name=\"nowplaytime\" value=\"\" style=\"display: none\">";
                htmlinner+="<input id=\"songidentify\" type=\"text\" name=\"identfy\" value=\"\" style=\"display: none\">";
                htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
                htmlinner+="</form>";
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function querysongname(songid) {
    return new Promise(resolve => {
        var sqlq="SELECT musicname FROM musictb WHERE musicid=\"" +songid+"\"";
        nowplay="";
        playing.playingid=songid;
        // console.log(playing.playingid);
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                // console.log(datare);
                nowplay="<a id=\"nowplaytext\" class=\"nowplaytext\" playid=\""+songid+"\">"+datare[0].musicname+"</a>";
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function qureyre(sql,i) {
    return new Promise(resolve => {
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sql, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                datastring = JSON.stringify(results);
                datare = JSON.parse(datastring);
                // console.log(datare);
                htmlinner += "<a class='textlinem' > " + (i + 1) + " :" + datare[0].musicname + "</a>"
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function querylikesong(userid) {
    return new Promise(resolve => {
        var sqlq="SELECT likesmusicid FROM likes_musicstb WHERE userid=\"" +userid+"\"";
        htmlinner="";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, async function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                // console.log(datare);
                playing.playinglist=[];
                htmlinner+="<form  id=\"contentcomit\" action=\"song\" method=\"get\"><hr>";
                for(var i=0;i<datare.length;i++) {
                    htmlinner+="<div class='musiclist'onClick=\"formSubmitsong("+datare[i].likesmusicid+")\">"
                    var sqlq1="SELECT musicname FROM musictb WHERE musicid=" +datare[i].likesmusicid;
                    // var sqlq1="SELECT musicname FROM musictb WHERE musicid=1";
                    var datastring1="";
                    var datare1="";
                    console.log(sqlq1);
                    let waitstatus=await qureyre(sqlq1,i);
                    playing.playinglist[i]=datare[i].likesmusicid;
                    htmlinner+="</div>"
                }
                htmlinner+="<input id=\"songnowplaytime\" type=\"text\" name=\"nowplaytime\" value=\"\" style=\"display: none\">";
                htmlinner+="<input id=\"songidentify\" type=\"text\" name=\"identfy\" value=\"\" style=\"display: none\">";
                htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
                htmlinner+="</form>";
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function updatecurplay(curid,userid){
    return new Promise(resolve => {
        var sqlq="UPDATE usertb SET currentplayid="+curid+" WHERE userid=" +userid;
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function qureyte(sql,songid){
    return new Promise(resolve => {
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            sqlconnection.query(sql, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                // console.log(datare);
                nowplay = "<a id=\"nowplaytext\" class=\"nowplaytext\" playid=\""+songid+"\">" + datare[0].musicname + "</a>";
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function querycurplay(userid){
    return new Promise(resolve => {
        var sqlq="SELECT currentplayid FROM usertb WHERE userid=\"" +userid+"\"";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, async function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                console.log(datare);
                var sqlq1="SELECT musicname FROM musictb WHERE musicid=\"" +datare[0].currentplayid+"\"";
                let resul=await qureyte(sqlq1,datare[0].currentplayid);
                playing.playingid=datare[0].currentplayid;
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function judgelikesong(curid,userid,nowplaytime,j){
    return new Promise(resolve => {
        var sqlq="SELECT likesmusicid FROM likes_musicstb WHERE userid=\"" +userid+"\"";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, async function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                var flag=false;
                // console.log(datare);
                loginArr[j].temp=null;
                for(var i=0;i<datare.length;i++) {
                    if(datare[i].likesmusicid==curid){
                        loginArr[j].temp="<script>document.getElementById('timenow').innerText=\""+nowplaytime+"\";document.getElementById(\"like\").setAttribute(\"class\",\"iconfont icon-xiai\");</script>";
                        flag=true;
                        break
                    }
                }
                if(!flag){
                    loginArr[j].temp="<script>document.getElementById('timenow').innerText=\""+nowplaytime+"\";document.getElementById(\"like\").setAttribute(\"class\",\"iconfont icon-xiai1\");</script>";
                }
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function insertlikesong(curid,userid){
    return new Promise(resolve => {
        var sqlq="INSERT INTO likes_musicstb VALUES("+userid+"," +curid+")";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function deletlikesong(curid,userid){
    return new Promise(resolve => {
        var sqlq="DELETE FROM likes_musicstb WHERE likesmusicid="+curid+" AND userid=" +userid;
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function changelikesong(curid,userid,j){
    return new Promise(resolve => {
        var sqlq="SELECT likesmusicid FROM likes_musicstb WHERE userid=\"" +userid+"\"";
        console.log(sqlq);
        mysqlpool.getConnection(function(err, connection) {
            if (err) {
                console.error('error 连接数据库失败: ' + err.stack);
                return;
            }
            console.log('连接数据库成功，线程ID： ' + connection.threadId);
            connection.query(sqlq, async function (err, results, fields) {
                if (err) {
                    console.error('error connecting: ' + err.stack);
                    return;
                }
                var datastring = JSON.stringify(results);
                var datare = JSON.parse(datastring);
                var flag=false;
                // console.log(datare);
                loginArr[j].temp=null;
                for(var i=0;i<datare.length;i++) {
                    if(datare[i].likesmusicid==curid){
                        loginArr[j].temp="<script>document.getElementById(\"like\").setAttribute(\"class\",\"iconfont icon-xiai1\");</script>";
                        //removethelikesongformsql
                        let result=await deletlikesong(curid,userid);
                        flag=true;
                        break
                    }
                }
                if(!flag){
                    loginArr[j].temp="<script>document.getElementById(\"like\").setAttribute(\"class\",\"iconfont icon-xiai\");</script>";
                    //addthelikesongtosql
                    let result=await insertlikesong(curid,userid);
                }
                resolve('resolved');
            });
            connection.release();
        });
    });
}
function isFileexit(file) {
    return new Promise(resolve => {
        fs.access(file, fs.constants.F_OK, (err) => {
            //console.log(`${file} ${err ? '不存在' : '存在'}`);
            if(err){
                find=false;
                resolve('resolved');
                return;
            }
            find=true;
            resolve('resolved');
        });
    });
}

app.get("/",(req,res)=>{
    let messagedate="";

    res.render("login",{
        messagedate:messagedate
    });
});

app.get("/foot",async (req,res)=> {
    let query=req.query;
    let audiodata="";
    var nowmusic=1;
    var i=0;
    for( ;i<loginArr.length;i++){
        if(loginArr[i].loginid==query.identfy){
            break;
        }
    }
    if(loginArr.length==0||i==loginArr.length){
        let messagedate="";
        res.render("login",{
            messagedate:messagedate
        });
        return;
    }

    if(query.id==0){
        // console.log("loginArr[i].playingid: "+loginArr[i].playingid);
        if(loginArr[i].playingid==0){
            loginArr[i].playingid=loginArr[i].playinglist.length-1;
        }else{
            loginArr[i].playingid-=1;
        }
    }
    if(query.id==4){
        let restchang=await changelikesong(loginArr[i].playinglist[loginArr[i].playingid],query.identfy,i);
        audiodata+=loginArr[i].temp;
        res.send({status:"OK"});
        return;
    }
    if(query.id==5){
        if(loginArr[i].playingid==(loginArr[i].playinglist.length-1)){
            loginArr[i].playingid=0;
        }else{
            loginArr[i].playingid=parseInt(loginArr[i].playingid)+1;
        }
    }
    if(query.id==6){
        loginArr[i].playingid=loginArr[i].playingid;
        audiodata+="<script>document.getElementById('way').setAttribute(\"class\",\"iconfont icon-xunhuanbofang\");</script>";
    }
    if(query.id==7){
        if(playing.playinglist.length==1){
        }else{
            var numrand = Math.floor(Math.random() * parseInt(playing.playinglist.length)+1);
            loginArr[i].playingid=numrand;
        }
        audiodata+="<script>document.getElementById('way').setAttribute(\"class\",\"iconfont icon-luanxu\");</script>";

    }
    nowmusic=loginArr[i].playinglist[loginArr[i].playingid];
    console.log("nowmusic: " +nowmusic);

    var nu=0
    for(;nu < fileex.length;nu++){
        var retpath=path.join(__dirname+"/views/music/audio/"+nowmusic+fileex[nu]);
        let aa=await isFileexit(retpath);
        if(find){
            find=false;
            break;
        }
    }
    audiodata+="<audio id=\"audio\" src=\"./music/audio/"+nowmusic+fileex[nu]+"\" play=\"true\" autoplay></audio>";
    let lrcstr=__dirname + "/views/music/lrc/"+nowmusic+".lrc";
    readFile(lrcstr);
    let resutlt=await querytimes(query.identfy);
    if(needjump){
        let messagedate="<script>alert(\"超时重新登录\");</script>";
        needjump=false;
        res.render("login",{
            messagedate:messagedate
        });
    }else{
        let resutlt=await querysongname(nowmusic);
        resutlt=await judgelikesong(nowmusic,query.identfy,query.nowplaytime,i);
        audiodata+=loginArr[i].temp;
        audiodata+="<script>document.getElementById('content').style.marginTop=\"500px\";document.getElementById(\"textae\").setAttribute(\"heightvalue\",\"800\");</script>";
    }
    loginArr[i].nowplay=nowplay;
    loginArr[i].textcont=textcont;
    loginArr[i].audiodata=audiodata;
    res.render("index",{
        htmlinner:htmlinner,
        nowplay:nowplay,
        logintext:loginArr[i].logintext,
        textcont:textcont,
        audiodata:audiodata
    });
});

app.get("/operation",async(req,res)=>{
    let query=req.query;
    let audiodata="<audio></audio>";
    let messagedate="";
    // console.log(query.identfy);
    var i=0;

    for( ;i<loginArr.length;i++){
        if(loginArr[i].loginid==query.identfy){
            logintext=loginArr[i].logintext;
            break;
        }
    }

    if(loginArr.length==0||i==loginArr.length){
        res.render("login",{
            messagedate:messagedate
        });
        return;
    }

    if(query.id==1){
        let resutlt=await queryinnerhtml();      
        loginArr[i].htmlinner=htmlinner;
        res.send({innerht:loginArr[i].htmlinner});
    }

    if(query.id==3){
        loginArr[i].uuid="";
        let messagedate="<script>alert(\"注销成功\");</script>";
        res.render("login",{
            messagedate:messagedate
        });
    }
    if(query.id==4){
        let resutltw=await querylikesong(query.identfy);
        loginArr[i].htmlinner=htmlinner;
        res.send({innerht:loginArr[i].htmlinner});
    }
});

app.get("/album",async (req,res)=> {
    let query=req.query;
    var i=0;
    for( ;i<loginArr.length;i++){
        if(loginArr[i].loginid==query.identfy){
            break;
        }
    }
    if(loginArr.length==0||i==loginArr.length){
        let messagedate="";
        res.render("login",{
            messagedate:messagedate
        });
        return;
    }

    let resutlt=await queryinnerhtmlsong(query.id);
    loginArr[i].htmlinner=htmlinner;
    res.send({innerht:loginArr[i].htmlinner});
});

app.get("/song",async (req,res)=>{

    let messagedate="<script>alert(\"超时重新登录\");</script>";
    let query=req.query;
    var nu=0

    for(;nu < fileex.length;nu++){
        var retpath=path.join(__dirname+"/views/music/audio/"+query.id+fileex[nu]);
        console.log(retpath);
        let aa=await isFileexit(retpath);
        if(find){
            find=false;
            break;
        }
    }
    let audiodata="<audio id=\"audio\" src=\"./music/audio/"+query.id+fileex[nu]+"\" play=\"true\" autoplay></audio>";
    let lrcstr=__dirname + "/views/music/lrc/"+query.id+".lrc";
    readFile(lrcstr);
    var i=0;
    for( ;i<loginArr.length;i++){
        if(loginArr[i].loginid==query.identfy){
            break;
        }
    }
    if(loginArr.length==0||i==loginArr.length){
        messagedate="";
        res.render("login",{
            messagedate:messagedate
        });
        return;
    }

    let resutlt=await querytimes(query.identfy);
    if(needjump){
        needjump=false;
        res.render("login",{
            messagedate:messagedate
        });
        loginArr[i].uuid="";
    }else{
        let resutlt=await querysongname(query.id);
        resutlt=await judgelikesong(query.id,query.identfy,query.nowplaytime,i);
        audiodata+=loginArr[i].temp;
        audiodata+="<script>document.getElementById('content').style.marginTop=\"500px\";document.getElementById(\"textae\").setAttribute(\"heightvalue\",\"800\");</script>";
        loginArr[i].audiodata=audiodata;
        loginArr[i].nowplay=nowplay;
        loginArr[i].textcont=textcont;
        let atd=await updatecurplay(query.id,query.identfy);
        for(var k=0;k<loginArr[i].playinglist.length;k++){
            if(loginArr[i].playinglist[k]==query.id){
                loginArr[i].playingid=k;
                break;
            }
        }
        res.render("index",{
            htmlinner:loginArr[i].htmlinner,
            logintext:loginArr[i].logintext,
            nowplay:nowplay,
            textcont:textcont,
            audiodata:audiodata
        });
    }
});

app.get("/login",async(req,res)=>{
    let query=req.query;
    let audiodata="<audio></audio>";
    let messagedate="<script>alert(\"不存在的用户名\");</script>";
    if(query.judge=="1"){
        var i=0;
        if(loginArr.length!=0 ){
            console.log("loginArr.length："+loginArr.length);
            for(;i<loginArr.length;i++){
                console.log("loginArr:"+loginArr);
                if(loginArr[i].uuid==query.uuid){
                    let resutlt=await querytimes(loginArr[i].loginid);
                    if(needjump) {
                        console.log("a");
                        needjump = false;
                        loginArr[i].uuid="";
                        break;
                    }else{
                        console.log("b");
                        console.log(loginArr[i]);
                        res.render("index",{
                            htmlinner:loginArr[i].htmlinner,
                            textcont:loginArr[i].textcont,
                            nowplay:loginArr[i].nowplay,
                            logintext:loginArr[i].logintext,
                            audiodata:loginArr[i].audiodata
                        });
                    }
                    return;
                }
            }
        }
        messagedate="<a id='ret' style='display: none'>timeout</a>";
        res.render("login", {
            messagedate: messagedate
        });
        return;
    }
    var sqlq="SELECT userid FROM usertb WHERE username=\"" +query.username+"\"";
    console.log("uuid:"+query.uuid);
    console.log(sqlq);
    mysqlpool.getConnection(function(err, connection) {
        if (err) {
            console.error('error 连接数据库失败: ' + err.stack);
            return;
        }
        console.log('连接数据库成功，线程ID： ' + connection.threadId);
        connection.query(sqlq,function (err, results, fields) {
            if(err){
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log(results.length);
            if(results.length==0){
                res.render("login",{
                    messagedate:messagedate
                });
                return;
            }

            var datastring=JSON.stringify(results);
            var datare=JSON.parse(datastring);
            var sqlq2="SELECT password FROM logintb WHERE userid=\"" + datare[0].userid+"\"";
            console.log(sqlq2);
            connection.query(sqlq2,async function (error, results, fields){
                if (error){
                    console.log(error);
                    return;
                }
                var datastring1=JSON.stringify(results);
                var datare1=JSON.parse(datastring1);
                var findflag=false;
                console.log(datare1[0].password);
                if(datare1[0].password == query.password) {
                    // console.log("true");
                    var datetime = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
                    // console.log(datetime);
                    var i=0;
                    if(loginArr.length!=0 ){
                        console.log("loginArr.length："+loginArr.length);
                        for(;i<loginArr.length;i++){
                            console.log("loginArr:"+loginArr);
                            if(datare[0].userid==loginArr[i].loginid){
                                if(loginArr[i].uuid!=""){
                                    console.log("loginArr["+i+"].uuid："+loginArr[i].uuid);
                                    if(typeof(query.check)=="undefined"){
                                        console.log("用户已经登录请在其它设备注销 ");
                                        messagedate="<script>alert(\"用户已经登录请在其它设备注销\");</script>";
                                        res.render("login",{
                                            messagedate:messagedate
                                        });
                                        return;
                                    }
                                    if(query.check=="force"){
                                        loginArr[i].uuid="";
                                        break;
                                    }
                                }
                                findflag=true;
                                break;
                            }
                        }
                    }
                    var sqlq3="UPDATE logintb SET lastlogin=\""+datetime+"\" WHERE userid=\"" + datare[0].userid+"\"";
                    console.log(sqlq3);
                    connection.query(sqlq3,function (error){
                        if(error)
                            console.log(error);
                    });

                    var logintext="<a id=\"textforlogin\" class=\"textstyle\" href=\"#\" identify=\""+datare[0].userid+"\">"+query.username+"：已登录</a>"
                    let resutltw=await querylikesong(datare[0].userid);
                    //let resultc=await querycurplay(datare[0].userid);
                    // let audiodata="<audio id=\"audio\" src=\"./music/audio/"+playing.playingid+".mp3\" play=\"true\" autoplay></audio>";
                    // audiodata+="<script>document.getElementById('content').style.marginTop=\"500px\";document.getElementById(\"textae\").setAttribute(\"heightvalue\",\"800\");</script>";
                    // let lrcstr="./views/music/lrc/"+playing.playingid+".lrc";
                    // readFile(lrcstr);
                    textcont="";
                    nowplay="<a id=\"nowplaytext\" class=\"nowplaytext\" playid=\"\">无播放项</a>";
                    if(query.check=="force"||findflag==true){
                        var lent=i;
                    }else{
                        var lent=loginArr.length;
                    }

                    loginArr[lent]={
                        textcont:textcont,
                        loginid:datare[0].userid,
                        htmlinner:htmlinner,
                        nowplay:nowplay,
                        logintext:logintext,
                        audiodata:audiodata,
                        uuid:query.uuid,
                        num:"0",
                        temp:null,
                        playingid:0,
                        playinglist:playing.playinglist
                    };

                    // console.log(loginArr);
                    res.render("index",{
                        htmlinner:loginArr[lent].htmlinner,
                        textcont:loginArr[lent].textcont,
                        nowplay:loginArr[lent].nowplay,
                        logintext:loginArr[lent].logintext,
                        audiodata:loginArr[lent].audiodata
                    });
                    return;
                }
                else
                    messagedate="<script>alert(\"密码错误\");</script>";
                res.render("login",{
                    messagedate:messagedate
                });
            });
        });
        connection.release();
    });
});
var server = httpserver.createServer(app);
server.listen(80);
