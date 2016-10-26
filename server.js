/**
 * Created by jiajiangyi on 2016/10/19.
 */


var express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io').listen(http);

var users = {};
var count = 0;

app.use('/', express.static(__dirname + '/www'));

app.get('/', function (req, res) {
    //res.sendFile(__dirname + '/www/index.html');
    res.render('index');
});

var port = process.env.PORT || 3000;
http.listen(port,function () {
    console.log("Server started listen port:"+port);
});

io.sockets.on('connection', function (socket) {
    console.log('一位新用户连接')
    socket.on('login', function (obj) {
        //将新用户的唯一标识作为socket的名字
        socket.name = obj.userid;

        if (!users.hasOwnProperty(obj.userid)) {
            users[obj.userid] = obj.nickname;
            count++;
        }
        //像所有用户广播新用户的加入
        io.sockets.emit('login', {users: users, count: count, user: obj});
        console.log(obj.nickname+"加入聊天室");
    });

    socket.on('message',function (obj) {
        //像所有客户端广播消息
        io.sockets.emit('message',obj);
        console.log(obj.nickname+"说："+obj.content);
    });

    socket.on('img',function (obj,imgData) {
        io.sockets.emit('img',obj,imgData);
    });

    socket.on('disconnect',function () {
        //将退出用户清除
        if(users.hasOwnProperty(socket.name)){

            //该用户信息
            var obj = {userid:socket.name,nickname:users[socket.name]};

            delete users[socket.name];
            count--;

            //向所有用户广播该用户退出
            io.sockets.emit('logout',{users:users,count:count,user:obj});
            console.log(obj.nickname + " 退出聊天室");
        }
    });
});

//
// http.listen(3000, function () {
//     console.log("Server started");
// });




