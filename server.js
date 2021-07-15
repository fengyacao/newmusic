const httpserver = require('http');
const mysql = require('mysql');
const express = require('express');
const app = express();

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '123456',
    database : 'msdb',
    multipleStatements: true,
});
var options = {
    index: "login.html"
}
connection.connect(function(err) {
    if (err) {
        console.error('error 连接数据库失败: ' + err.stack);
        return;
    }
    console.log('连接数据库成功，线程ID： ' + connection.threadId);
});

app.use('/',express.static('./views/html',options));
app.use('/js',express.static('./views/js'));
app.use('/css',express.static('./views/css'));
app.use('/images',express.static('./views/images'));

app.get("/song",(req,res)=>{
    let query=req.query;
    console.log(query);
    res.send(query);
});

app.get("/login",(req,res)=>{
    let query=req.query;
    console.log(query);
    res.send(query);
});
var server = httpserver.createServer(app);
server.listen(80);



