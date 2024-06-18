window.addEventListener('load', function(){
    // 변수를 선언합니다.

    // 소켓을 연결합니다.
    const socket = io.connect();

    // 캔버스를 추출합니다.
    const nick = document.querySelector('#chat #nick');
    const message = document.querySelector('#chat #message');
    const send = document.querySelector('#chat #chatsend');
    const log = document.querySelector('#chat #chat-log');

    // 입력 양식 이벤트를 연결합니다.
    send.addEventListener('click', function(event) {
        socket.emit('chat', {
            message: `(${nick.value}) ${message.value}`,
        });
    });

    // 소켓 이벤트를 연결합니다.
    socket.on('chat', function (data) {
        log.value += `${data.message}\n`;
    });
});
