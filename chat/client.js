(function () {
    var d = document,
        w = window,
        dd = d.documentElement,
        db = d.body,
        dc = d.compatMode == 'CSS1Compat',//CSS1Compat:标准兼容模式开启  BackCompat：标准兼容模式关闭
        dx = dc ? dd : db;

    //当document.compatMode等于BackCompat时，浏览器客户区宽度是document.body.clientWidth；
    //当document.compatMode等于CSS1Compat时，浏览器客户区宽度是document.documentElement.clientWidth。
    w.CHAT = {
        msgObj: d.getElementById("message"),
        screenheight: w.innerHeight ? w.innerHeight : dx.clientHeight,
        username: null,
        userid: null,
        socket: null,
        //让浏览器滚动条保持在最底部
        scrollToBottom: function () {
            w.scrollTo(0, this.msgObj.clientHeight);
        },
        //退出，这里只是一个简单的刷新
        logout: function () {
            //this.socket.disconnect();
            location.reload();
        },
        //提交聊天消息内容
        submit: function () {
            var content = d.getElementById("content").value;
            if (content != "") {
                var obj = {
                    userid: this.userid,
                    username: this.username,
                    content: content
                };
                this.socket.emit('message', obj);
                d.getElementById("content").value = "";
            }
            return false;
        },
        genUid: function () {
            return new Date().getTime() + "" + Math.floor(Math.random() * 899 + 100);
        },
        //更新系统消息，本例中在用户加入、退出时调用
        updateSysMsg: function (o, action) {
            //当前在线用户列表
            var onlineUsers = o.onlineUsers;
            //当前在线人数
            var onlineCount = o.onlineCount;
            //新加入用户消息
            var user = o.user;

            //更新在线人数
            var userhtml = "";
            var separator = "";
            for (var key in onlineUsers) {
                if (onlineUsers.hasOwnProperty(key)) {
                    userhtml += separator + onlineUsers[key];
                    separator = '、';
                }
            }
            d.getElementById("onlinecount").innerHTML = '当前共有 ' + onlineCount + ' 人在线，在线列表：' + userhtml;

            //添加系统消息
            var html = '';
            html += '<div class="msg-system">';
            html += user.username;
            html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
            html += '</div>';
            var section = d.createElement('section');
            section.className = 'system J-mjrlinkWrap J-cutMsg';
            section.innerHTML = html;
            this.msgObj.appendChild(section);
            this.scrollToBottom();
        },
        //第一个界面用户提交用户名
        usernameSubmit: function () {
            var username = d.getElementById("username").value;
            if (username != "") {
                d.getElementById("username").value = '';
                d.getElementById("loginbox").style.display = 'none';
                d.getElementById("chatbox").style.display = 'block';
                this.init(username);
            }
            return false;
        },
        init: function (username) {
            /*
             客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
             实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
             */
            this.userid = this.genUid();
            this.username = username;

            //noinspection JSValidateTypes
            d.getElementById("showusername").innerHTML = this.username;
            //this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
            this.scrollToBottom();

            //连接websocket后端服务器
            this.socket = io.connect('ws://localhost:3000');

            //告诉服务器端有用户登录
            this.socket.emit('login', {userid: this.userid, username: this.username});

            //监听新用户登录
            this.socket.on('login', function (o) {
                CHAT.updateSysMsg(o, 'login');
            });

            //监听用户退出
            this.socket.on('logout', function (o) {
                CHAT.updateSysMsg(o, 'logout');
            });

            //监听消息发送
            this.socket.on('message', function (obj) {
                var isme = (obj.userid == CHAT.userid) ? true : false;
                var contentDiv = '<div>' + obj.content + '</div>';
                var usernameDiv = '<span>' + obj.username + '</span>';

                var section = d.createElement('section');
                if (isme) {
                    section.className = 'user';
                    section.innerHTML = contentDiv + usernameDiv;
                } else {
                    section.className = 'service';
                    section.innerHTML = usernameDiv + contentDiv;
                }
                CHAT.msgObj.appendChild(section);
                CHAT.scrollToBottom();
            });

        }
    };

    //通过“回车”提交用户名
    d.getElementById("username").onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.usernameSubmit();
        }
    };
    //通过“回车”提交信息
    d.getElementById("content").onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.submit();
        }
    };
})();






