const httpserver = require('http');
const mysql = require('mysql');
const express = require('express');
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
var relogintime=86400000;
var htmlinner="";

sqlconnection.connect(function(err) {
    if (err) {
        console.error('error 连接数据库失败: ' + err.stack);
        return;
    }
    console.log('连接数据库成功，线程ID： ' + sqlconnection.threadId);
});


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
            htmlinner+="<form  id=\"contentcomit\" action=\"song\" method=\"get\">";
            for(var i=0;i<datare.length;i++){
                htmlinner+="<div class='musiclist'onClick=\"formSubmitsong("+(i+1)+")\">"
                htmlinner+="<a class='textlinem' > "+(i+1)+" :"+datare[i].musicname+"</a>"
                htmlinner+="</div>"
            }
            htmlinner+="<input id=\"socomit\" type=\"text\" name=\"id\" value=\"0\" style=\"display: none\"> ";
            htmlinner+="</form>";
            resolve('resolved');
        });
    });
}

app.get("/",(req,res)=>{
    let audiodata="<audio></audio>";
    res.render("index",{
        audiodata:audiodata,
        htmlinner:htmlinner
    });
});

app.get("/operation",async(req,res)=>{
    let query=req.query;
    let audiodata="<audio></audio>";

    if(query.id==1){
        let resutlt=await queryinnerhtml();
        res.render("index",{
            audiodata:audiodata,
            htmlinner:htmlinner
        });
    }

    if(query.id==3){
        res.render("login",{
            messagedate:messagedate
        });
    }

});

app.get("/album",async (req,res)=> {
    let query=req.query;
    let audiodata="<audio></audio>";
    let resutlt=await queryinnerhtmlsong(query.id);

    res.render("index",{
        htmlinner:htmlinner,
        audiodata:audiodata
    });
});

app.get("/song",async (req,res)=>{
    let messagedate="<script>alert(\"超时重新登录\");</script>";
    let query=req.query;
    let audiodata="<audio id=\"audio\" src=\"./music/audio/"+query.id+".flac\"></audio>";

    let resutlt=await querytimes(1);
    if(needjump){
        console.log("--1");
        needjump=false;
        res.render("login",{
            messagedate:messagedate
        });
    }else{
        audiodata+="<script>document.getElementById('waveform').click();</script>"
        console.log("--2");
        res.render("index",{
            htmlinner:htmlinner,
            audiodata:audiodata
        });
    }
});


app.get("/login",(req,res)=>{
    let query=req.query;
    let audiodata="<audio></audio>";
    let messagedate="<script>alert(\"不存在的用户名\");</script>";
    var sqlq="SELECT userid FROM usertb WHERE username=\"" +query.username+"\"";
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
            return;login
        }

        var datastring=JSON.stringify(results);
        var datare=JSON.parse(datastring);
        var sqlq2="SELECT password FROM logintb WHERE userid=\"" + datare[0].userid+"\"";
        console.log(sqlq2);
        sqlconnection.query(sqlq2,function (error, results, fields){
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
                var sqlq3="UPDATE logintb SET lastlogin=\""+datetime+"\" WHERE userid=\"" + datare[0].userid+"\"";
                console.log(sqlq3);
                sqlconnection.query(sqlq3,function (error){
                    if(error)
                        console.log(error);
                });

                res.render("index",{
                    htmlinner:htmlinner,
                    audiodata:audiodata
                });
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



