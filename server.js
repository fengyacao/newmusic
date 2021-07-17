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

sqlconnection.connect(function(err) {
    if (err) {
        console.error('error 连接数据库失败: ' + err.stack);
        return;
    }
    console.log('连接数据库成功，线程ID： ' + sqlconnection.threadId);
});


function querytimes(){
    return new Promise(resolve => {
        // var sqlq="SELECT lastlogin FROM logintb WHERE userid=\"" +query.userid+"\"";
        var sqlq = "SELECT lastlogin FROM logintb WHERE userid=\"1\"";
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

app.get("/",(req,res)=>{
    let audiodata="<audio></audio>";
    res.render("index",{
         audiodata:audiodata
    });
});

app.get("/operation",(req,res)=>{
    //to do operation
});

app.get("/song",async (req,res)=>{

    let query=req.query;
    let audiodata="<audio src=\"./music/audio/"+query.id+".flac\" autoplay loop></audio>";

    let resutlt=await querytimes();
    if(needjump){
        console.log("--1");
        needjump=false;
        res.redirect("login.html");
    }else{
        console.log("--2");
        res.render("index",{
            audiodata:audiodata
        });
    }
});


app.get("/login",(req,res)=>{
    let query=req.query;
    var sqlq="SELECT userid FROM usertb WHERE username=\"" +query.username+"\"";
    console.log(sqlq);
    sqlconnection.query(sqlq,function (err, results, fields) {
        if(err){
            console.error('error connecting: ' + err.stack);
            return;
        }

        console.log(results.length);
        if(results.length==0){
            res.send(`<script>alert("不存在的用户名");location.href="login.html"</script>`);
            return;
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
                res.redirect("index.html");
            }
            else
                res.send(`<script>alert("密码错误");location.href="login.html"</script>`);
        });
    });
});
var server = httpserver.createServer(app);
server.listen(80);



