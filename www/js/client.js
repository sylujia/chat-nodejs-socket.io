/**
 * Created by jiajiangyi on 2016/10/19.
 */

(function () {
    var d = document;
    window.CHAT = {
        msgobj: d.getElementById("message"),
        nickname: null,
        userid: null,
        socket: null,

        //用于生成用户id
        getUid: function () {
            return new Date().getTime() + "" + Math.floor(Math.random() * 899 + 100);
        },
        //显示系统消息
        displaySysMsg: function (msg) {
            var section = d.createElement('section');
            section.className = 'msg-system';
            section.innerHTML = msg;
            var msgobj = d.getElementById('message');
            msgobj.appendChild(section);

        },
        //更新系统消息，主要用于登录登出
        updateSysMsg: function (o, action) {
            var users = o.users;//在线用户列表
            var count = o.count;
            var user = o.user;//登录用户

            var userhtml = "";
            var separator = "";
            for (var key in users) {
                if (users.hasOwnProperty(key)) {
                    userhtml += separator + users[key];
                    separator = "、";
                }
            }

            d.getElementById('status').innerHTML = "当前在线" + count + "人：" + userhtml;
            //系统消息
            var html = '';
            html += user.nickname;
            html += (action == 'login') ? ' 加入聊天室' : ' 退出聊天室';

            var section = d.createElement('section');
            section.className = 'msg-system';
            section.innerHTML = html;
            var msgobj = d.getElementById('message');
            msgobj.appendChild(section);

        },
        //显示图片
        displayImage: function (user, imgData) {
            var msgobj = d.getElementById('message'),
                section = d.createElement('section');
            var isMe = (user.userid == CHAT.userid) ? true : false;
            var html = "";
            if (isMe) {
                section.className = 'user';
                html = '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>' + '<span>' + user.nickname + '</span>';
            } else {
                section.className = 'service';
                html = '<span>' + user.nickname + '</span>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
            }
            section.innerHTML = html;
            msgobj.appendChild(section);
            msgobj.scrollTop = msgobj.scrollHeight;
        },

        //初始化表情显示
        initialEmoji: function() {
            var emojiContainer = d.getElementById('emojiWrapper'),
                docFragment = d.createDocumentFragment();
            for (var i = 69; i > 0; i--) {
                var emojiItem = document.createElement('img');
                emojiItem.src = './emoji/' + i + '.gif';
                emojiItem.title = i;
                docFragment.appendChild(emojiItem);
            };
            emojiContainer.appendChild(docFragment);
        },
        //显示表情
        _showEmoji: function(msg) {
            var match, result = msg,
                reg = /\[emoji:\d+\]/g,
                emojiIndex,
                totalEmojiNum = d.getElementById('emojiWrapper').children.length;
            while (match = reg.exec(msg)) {
                emojiIndex = match[0].slice(7, -1);
                if (emojiIndex > totalEmojiNum) {
                    result = result.replace(match[0], '[X]');
                } else {
                    result = result.replace(match[0], '<img class="emoji" src="./emoji/' + emojiIndex + '.gif" />');
                };
            };
            return result;
        },

        //登录后进行初始化操作
        init: function (nickname) {
            this.nickname = nickname;
            this.userid = CHAT.getUid();
            d.getElementById('showusername').innerHTML = this.nickname + "";

            d.getElementById('messageInput').focus();//输入框获取焦点

            //连接websocket后端服务器
            this.socket = io.connect('ws://localhost:3000');

            //告诉服务器有用户登录
            this.socket.emit('login', {userid: this.userid, nickname: nickname});

            this.socket.on('login', function (o) {
                CHAT.updateSysMsg(o, 'login');
            });

            this.socket.on('logout', function (o) {
                CHAT.updateSysMsg(o, "logout");
            });

            this.socket.on('message', function (obj) {
                var isMe = (obj.userid == CHAT.userid) ? true : false;
                var msg = obj.content;
                 msg = CHAT._showEmoji(msg);
                var contentDiv = '<div>' + msg + '</div>';
                var userSpan = '<span>' + obj.nickname + '</span>';

                var section = d.createElement('section');
                if (isMe) {
                    section.className = 'user';
                    section.innerHTML = contentDiv + userSpan;
                } else {
                    section.className = 'service';
                    section.innerHTML = userSpan + contentDiv;
                }
                var msgobj = d.getElementById('message');
                msgobj.appendChild(section);
            });

            this.socket.on('img',function (user , imgData) {
                CHAT.displayImage(user,imgData);
            });

            CHAT.initialEmoji();//初始化表情

            //选择表情
            d.getElementById('emojiWrapper').addEventListener('click', function(e) {
                var target = e.target;
                if (target.nodeName.toLowerCase() == 'img') {
                    var messageInput = document.getElementById('messageInput');
                    messageInput.focus();
                    messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
                };
            }, false);

            //点击表情后消失
            d.body.addEventListener('click', function(e) {
                var emojiwrapper = document.getElementById('emojiWrapper');
                if (e.target != emojiwrapper) {
                    emojiwrapper.style.display = 'none';
                };
            });

        },

        //登录提交用户昵称
        nicknameSubmit: function () {
            var nickname = d.getElementById('nickname').value;
            if (nickname != "" && nickname.length < 5) {
                d.getElementById('nickname').value = "";
                d.getElementById('loginbox').style.display = 'none';
                d.getElementById('chatbox').style.display = 'block';
                this.init(nickname);
            }
            d.getElementById('nickname').value = "";
            d.getElementById('nickname').setAttribute("placeholder", "请输入不多于四个字符的昵称");
            return false;
        },

        //发送消息
        submitMsg: function () {
            var msg = d.getElementById('messageInput').value;
            if (msg != "") {
                d.getElementById('messageInput').value = "";

                this.socket.emit('message', {userid: this.userid, nickname: this.nickname, content: msg});
            }
            return false;
        },

        //发送图片
        sendImage: function () {

            var sendImage = d.getElementById('sendImage');
            var obj = {userid: this.userid, nickname: this.nickname};//用户信息
            if (sendImage.files.length != 0) {
                var file = sendImage.files[0],
                    reader = new FileReader();
                if (!reader) {
                    CHAT.displaySysMsg('你的浏览器不支持发送图片');
                    sendImage.value = '';
                    return;
                }

                reader.onload = function (e) {
                    sendImage.value = '';
                    CHAT.socket.emit('img', obj, e.target.result);
                };
                reader.readAsDataURL(file);
            }

        },
        //列出表情框
        showEmoji:function () {
            var emojiwrapper = d.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            window.event.stopPropagation();
        },


//==============================================
  /*      emojiWrapperClick:function () {
            var emojiWrapper = d.getElementById('emojiWrapper');
            var target = emojiWrapper.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = d.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        },
*/
        //清空聊天记录
        clearMsg: function () {
            d.getElementById('message').innerHTML = "";
        },

    };

    //回车键发送消息
    d.getElementById('messageInput').onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.submitMsg();
        }
    };

    //回车键登录
    d.getElementById('nickname').onkeydown = function (e) {
        e = e || event;
        if (e.keyCode === 13) {
            CHAT.nicknameSubmit();
        }
    };

})();

