const httpserver = require('http');
const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const app = express();
const ejs = require('ejs');
var sd = require('silly-datetime');

var options = {
    index: "index.html"
}

app.engine('html',ejs.__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views/html');

//app.use('/',express.static('./views/html',options));
app.use('/js',express.static('./views/js'));
app.use('/css',express.static('./views/css'));
app.use('/images',express.static('./views/images'));
app.use('/music',express.static('./views/music'));


var sqlconnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '123456',
    database : 'msdb',
    multipleStatements: true
});

var needjump=false;
var relogintime=3600000;
var htmlinner="";
var nowplay="<a class=\"nowplaytext\">no play</a>";
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

sqlconnection.connect(function(err) {
    if (err) {
        console.error('error 连接数据库失败: ' + err.stack);
        return;
    }
    console.log('连接数据库成功，线程ID： ' + sqlconnection.threadId);
});

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
        sqlconnection.query(sqlq, function (err, results, fields) {
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
    });
}

function queryinnerhtml(){
    return new Promise(resolve => {
        var sqlq="SELECT albumname,releasedate,releaseby  FROM albumtb";
        htmlinner="";
        console.log(sqlq);
        sqlconnection.query(sqlq, function (err, results, fields) {
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
                htmlinner+="<a class='textline' > 专辑名："+datare[i].albumname+"<br><br>发行日期："+releasedate+"<br><br>发行单位："+datare[i].releaseby+"</a>"
                htmlinner+="</div>"
            }
            htmlinner+="<input id=\"songidentify\" type=\"text\" name=\"identfy\" value=\"\" style=\"display: none\">";
            htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
            htmlinner+="</form>";
            resolve('resolved');
        });
    });
}

function queryinnerhtmlsong(albumid) {
    return new Promise(resolve => {
        var sqlq="SELECT musicname FROM musictb WHERE albumid=\"" +albumid+"\"";
        htmlinner="";
        console.log(sqlq);
        sqlconnection.query(sqlq, function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            var datastring = JSON.stringify(results);
            var datare = JSON.parse(datastring);
            console.log(datare);
            playing.playinglist=[];
            htmlinner+="<form  id=\"contentcomit\" action=\"song\" method=\"get\"><hr>";
            for(var i=0;i<datare.length;i++){
                htmlinner+="<div class='musiclist'onClick=\"formSubmitsong("+(i+1)+")\">"
                htmlinner+="<a class='textlinem' > "+(i+1)+" :"+datare[i].musicname+"</a>"
                htmlinner+="</div>"
                playing.playinglist[i]=i+1;
            }
            console.log(playing.playinglist);
            htmlinner+="<input id=\"songidentify\" type=\"text\" name=\"identfy\" value=\"\" style=\"display: none\">";
            htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
            htmlinner+="</form>";
            resolve('resolved');
        });
    });
}

function querysongname(songid) {
    return new Promise(resolve => {
        var sqlq="SELECT musicname FROM musictb WHERE musicid=\"" +songid+"\"";
        nowplay="";
        playing.playingid=songid;
        console.log(playing.playingid);
        console.log(sqlq);
        sqlconnection.query(sqlq, function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            var datastring = JSON.stringify(results);
            var datare = JSON.parse(datastring);
            console.log(datare);
            nowplay="<a class=\"nowplaytext\">"+datare[0].musicname+"</a>";
            resolve('resolved');
        });
    });
}
function qureyre(sql,i) {
    return new Promise(resolve => {
        sqlconnection.query(sql, function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            datastring = JSON.stringify(results);
            datare = JSON.parse(datastring);
            console.log(datare);
            htmlinner += "<a class='textlinem' > " + (i + 1) + " :" + datare[0].musicname + "</a>"
            resolve('resolved');
        });
    });
}
function querylikesong(userid) {
    return new Promise(resolve => {
        var sqlq="SELECT likesmusicid FROM likes_musicstb WHERE userid=\"" +userid+"\"";

        htmlinner="";
        console.log(sqlq);
        sqlconnection.query(sqlq, async function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            var datastring = JSON.stringify(results);
            var datare = JSON.parse(datastring);
            console.log(datare);
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
            htmlinner+="<input id=\"songidentify\" type=\"text\" name=\"identfy\" value=\"\" style=\"display: none\">";
            htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
            htmlinner+="</form>";
            resolve('resolved');
        });
    });
}

function updatecurplay(curid,userid){
    return new Promise(resolve => {
        var sqlq="UPDATE usertb SET currentplayid="+curid+" WHERE userid=" +userid;
        console.log(sqlq);
        sqlconnection.query(sqlq, function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            resolve('resolved');
        });
    });
}
function qureyte(sql){
    return new Promise(resolve => {
        sqlconnection.query(sql, function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            var datastring = JSON.stringify(results);
            var datare = JSON.parse(datastring);
            console.log(datare);
            nowplay = "<a class=\"nowplaytext\">" + datare[0].musicname + "</a>";
            resolve('resolved');
        });
    });
}
function querycurplay(userid){
    return new Promise(resolve => {
        var sqlq="SELECT currentplayid FROM usertb WHERE userid=\"" +userid+"\"";
        console.log(sqlq);
        sqlconnection.query(sqlq, async function (err, results, fields) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
            var datastring = JSON.stringify(results);
            var datare = JSON.parse(datastring);
            console.log(datare);
            var sqlq1="SELECT musicname FROM musictb WHERE musicid=\"" +datare[0].currentplayid+"\"";
            let resul=await qureyte(sqlq1);
            playing.playingid=datare[0].currentplayid;
            resolve('resolved');
        });
    });
}
function judgelogin(curid,userid){
    return new Promise(resolve => {

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
        console.log("loginArr[i].playingid: "+loginArr[i].playingid);
        if(loginArr[i].playingid==0){
            loginArr[i].playingid=loginArr[i].playinglist.length-1;
        }else{
            loginArr[i].playingid-=1;
        }
    }
    if(query.id==4){


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
    audiodata+="<audio id=\"audio\" src=\"./music/audio/"+nowmusic+".mp3\" play=\"true\" autoplay></audio>";
    let lrcstr="./views/music/lrc/"+nowmusic+".lrc";
    readFile(lrcstr);
    let resutlt=await querytimes(query.identfy);
    if(needjump){
        needjump=false;
        res.render("login",{
            messagedate:messagedate
        });
    }else{
        let resutlt=await querysongname(nowmusic);
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
    console.log(query.identfy);
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
        res.render("index",{
            audiodata:loginArr[i].audiodata,
            nowplay:loginArr[i].nowplay,
            textcont:loginArr[i].textcont,
            logintext:loginArr[i].logintext,
            htmlinner:loginArr[i].htmlinner
        });
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
        loginArr[i].playinglist=playing.playinglist;
        loginArr[i].playingid=0;
        res.render("index",{
            audiodata:loginArr[i].audiodata,
            nowplay:loginArr[i].nowplay,
            textcont:loginArr[i].textcont,
            logintext:loginArr[i].logintext,
            htmlinner:loginArr[i].htmlinner
        });
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
    loginArr[i].audiodata="<audio></audio>";
    loginArr[i].textcont="";
    loginArr[i].htmlinner=htmlinner;
    loginArr[i].nowplay="<a class=\"nowplaytext\">无播放项</a>";
    loginArr[i].playinglist=playing.playinglist;
    loginArr[i].playingid=0;

    res.render("index",{
        htmlinner:loginArr[i].htmlinner,
        logintext:loginArr[i].logintext,
        nowplay:loginArr[i].nowplay,
        textcont:loginArr[i].textcont,
        audiodata:loginArr[i].audiodata
    });
});

app.get("/song",async (req,res)=>{

    let messagedate="<script>alert(\"超时重新登录\");</script>";
    let query=req.query;
    let audiodata="<audio id=\"audio\" src=\"./music/audio/"+query.id+".mp3\" play=\"true\" autoplay></audio>";
    let lrcstr="./views/music/lrc/"+query.id+".lrc";
    readFile(lrcstr);
    var i=0
    for( ;i<loginArr.length;i++){
        if(loginArr[i].loginid==query.identfy){
            break;
        }
    }
    if(loginArr.length==0||i==loginArr.length){
        messagedate=""
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
    }else{
        // audiodata+="<script>document.getElementById('waveform').click();</script>"
        let resutlt=await querysongname(query.id);
        audiodata+="<script>document.getElementById('content').style.marginTop=\"500px\";document.getElementById(\"textae\").setAttribute(\"heightvalue\",\"800\");</script>";
        loginArr[i].audiodata=audiodata;
        loginArr[i].nowplay=nowplay;
        loginArr[i].textcont=textcont;
        let atd=await updatecurplay(query.id,query.identfy);
        res.render("index",{
            htmlinner:loginArr[i].htmlinner,
            logintext:loginArr[i].logintext,
            nowplay:nowplay,
            textcont:textcont,
            audiodata:audiodata
        });
    }
});

app.get("/login",(req,res)=>{
    let query=req.query;
    let audiodata="<audio></audio>";
    let messagedate="<script>alert(\"不存在的用户名\");</script>";
    var sqlq="SELECT userid FROM usertb WHERE username=\"" +query.username+"\"";
    console.log("uuid:"+query.uuid);
    console.log(sqlq);
    sqlconnection.query(sqlq,function (err, results, fields) {
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
        sqlconnection.query(sqlq2,async function (error, results, fields){
            if (error){
                console.log(error);
                return;
            }
            var datastring1=JSON.stringify(results);
            var datare1=JSON.parse(datastring1);
            console.log(datare1[0].password);
            if(datare1[0].password == query.password) {
                console.log("true");
                var datetime = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
                console.log(datetime);
                var i=0;
                console.log("query.check: "+query.check);
                console.log("loginArr.length: "+loginArr.length);
                if(loginArr.length!=0 ){
                    for(;i<loginArr.length;i++){
                        if(datare[0].userid==loginArr[i].loginid && loginArr[i].uuid!=""){
                            console.log("登录了");
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
                    }
                }
                var sqlq3="UPDATE logintb SET lastlogin=\""+datetime+"\" WHERE userid=\"" + datare[0].userid+"\"";
                console.log(sqlq3);
                sqlconnection.query(sqlq3,function (error){
                    if(error)
                        console.log(error);
                });

                var logintext="<a id=\"textforlogin\" class=\"textstyle\" href=\"#\" identify=\""+datare[0].userid+"\">"+query.username+"：已登录</a>"
                let resutltw=await querylikesong(datare[0].userid);
                let resultc=await querycurplay(datare[0].userid);
                let audiodata="<audio id=\"audio\" src=\"./music/audio/"+playing.playingid+".mp3\" play=\"true\" autoplay></audio>";
                audiodata+="<script>document.getElementById('content').style.marginTop=\"500px\";document.getElementById(\"textae\").setAttribute(\"heightvalue\",\"800\");</script>";
                let lrcstr="./views/music/lrc/"+playing.playingid+".lrc";
                readFile(lrcstr);
                if(query.check=="force"){
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
});
var server = httpserver.createServer(app);
server.listen(80);
