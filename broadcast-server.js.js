import { pipeline, env } from '@xenova/transformers';
import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import _ from 'lodash';
import http from 'http';
import { fileURLToPath } from "url";
import fs from 'fs';
// 웹소켓 서버를 생성하고 실행합니다.
import {Server} from 'socket.io';
console.warn = () => {};
env.logLevel = "fatal";

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;
// Create a new object detection pipeline
console.log('Loading detection model...');
const detector = await pipeline('object-detection', 'Xenova/detr-resnet-50');

console.log('Loading image-to-text conversion model...');
const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
console.log('Ready');

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const __filename = fileURLToPath(import.meta.url);

const app = express();
const server = http.Server(app);
app.use(express.static(`${__dirname}/public`));

const port = 3000;
server.listen(port, () => {
    console.log(`Server is on port ${port}.`);
})

// 파일 업로드 허용
app.use(fileUpload({
    createParentPath: true
}));

// 미들 웨어 추가
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.get('/dl/images', (request, response) => {
    const folder = `${__dirname}/public/server-only-space/uploads/`;
    let files=[];
    fs.readdirSync(folder).forEach(file => {
        console.log(file);
        files.push(file);
    });

    if (files.length > 0)
        response.send(files);
    else
        response.status(404).send({status: '데이터가 존재하지 않습니다.'});
});

app.get('/dl/detection/:name', async (request, response) => {
    // 변수를 선언합니다.
    const name = request.params.name;
    // 예외를 처리합니다.
    if (!name)
        return response.status(400).send({status: '파일 이름을 보내주세요'});

    try {
        fs.statSync(`${__dirname}/public/server-only-space/uploads/${name}`);
      } catch (error) {
          //파일이 없다면 에러 발생
          if (error.code === "ENOENT") {
            response.status(404).send({status: `파일(${name})이 존재하지 않습니다.`});
            return;
        }   
      }

    // 이미지 캡션 문자열을 계산합니다.
    console.log(name);
    const output = await detector(`http://localhost:3000/server-only-space/uploads/${name}`, {
        threshold: 0.5,
        percentage: true,
    });
    //console.log(output);
    // 응답합니다.
    response.send(output);
});

app.get('/dl/caption/:name', async (request, response) => {
    // 변수를 선언합니다.
    const name = request.params.name;
    // 예외를 처리합니다.
    if (!name)
        return response.status(400).send({status: '파일 이름을 보내주세요'});

    try {
        fs.statSync(`${__dirname}/public/server-only-space/uploads/${name}`);
      } catch (error) {
          //파일이 없다면 에러 발생
          if (error.code === "ENOENT") {
            response.status(404).send({status: `파일(${name})이 존재하지 않습니다.`});
            return;
        }   
      }

    // 이미지 캡션 문자열을 계산합니다.
    console.log(name);
    const output = await captioner(`http://localhost:3000/server-only-space/uploads/${name}`);
    //console.log(output);
    // 응답합니다.
    response.send(output);
});

app.post('/dl/upload', async (req, res) => {
    try {
        //console.log(req);
        if (!req.files) {
            res.send({
                status: false,
                message: '파일 업로드 실패'
            });
        } else {
            let f = req.files.uploadFile;
            f.mv( __dirname + '/public/server-only-space/uploads/' + f.name, function(err) {
                    if (err) {
                  return res.status(500).send(err);
                }            
                res.send({
                    status: true,
                    message: '파일이 업로드 되었습니다.',
                    data: {
                        name: f.name,
                        minetype: f.minetype,
                        size: f.size
                    }
                });
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get('/dl/download/:name', (request, response) => {
    // 변수를 선언합니다.
    const name = request.params.name;
// 동기 방식으로 파일 체크
let stats;
try {
    stats = fs.statSync(`${__dirname}/public/server-only-space/uploads/${name}`);
  } catch (error) {
      //파일이 없다면 에러 발생
      if (error.code === "ENOENT") {
        response.status(404).send({status: '파일이 존재하지 않습니다.'});
        return;
    }   
  }
  response.send({
    message: '파일을 다운로드 하였습니다.',
    data: {
        urlAddress: `/server-only-space/uploads/${name}`,
        size: stats.size
    }
});
});

app.put('/dl/put/:oldName/:newName', (request, response) => {
    // 변수를 선언합니다.
    const oldName = request.params.oldName;
    const newName = request.params.newName;
    let stats;
    // 동기 방식으로 파일 체크
try {
    stats = fs.statSync(`${__dirname}/public/server-only-space/uploads/${oldName}`);
  } catch (error) {
      //파일이 없다면 에러 발생
      if (error.code === "ENOENT") {
        response.status(404).send({status: '파일이 존재하지 않습니다.'});
        return;
    }   
  }
    // 파일 이름을 변경합니다.
    try {
        //동기 방식으로 파일 이름변경
        fs.renameSync(`${__dirname}/public/server-only-space/uploads/${oldName}`, `${__dirname}/public/server-only-space/uploads/${newName}`);
    } catch (error) {
            console.log("파일 이름변경 Error 발생");
            response.status(404).send({status: '파일 이름변경 Error 발생'});
            return;
    }
    response.send({
        message: '파일 이름을 변경했습니다.',
        data: {
            urlAddress: `/server-only-space/uploads/${newName}`,
            size: stats.size
        }
    });
});

app.delete('/dl/delete/:name', (request, response) => {
    // 변수를 선언합니다.
    const name = request.params.name;
// 동기 방식으로 파일 체크
try {
    fs.statSync(`${__dirname}/public/server-only-space/uploads/${name}`);
  } catch (error) {
      //파일이 없다면 에러 발생
      if (error.code === "ENOENT") {
        response.status(404).send({status: '파일이 존재하지 않습니다.'});
        return;
    }   
  }
    // 파일을 제거합니다.
    try {
        //동기 방식으로 파일 삭제
        fs.unlinkSync(`${__dirname}/public/server-only-space/uploads/${name}`)
    } catch (error) {
            console.log("파일 삭제 Error 발생");
            response.status(404).send({status: '파일 삭제 Error 발생'});
            return;
    }
    response.send({status: "파일을 삭제했습니다."});
})

// app.use(express.static(`${__dirname}/public`));
// server.listen(52274, () => {
//     console.log('Server Running at http://127.0.0.1:52274');
// });


const io = new Server(server);
let num = 1;
io.on('connection', (socket) => {
    socket.on('line', (data) => {
        io.sockets.emit('line', data);
    });
    socket.on('chat', (data) => {
        data.message = `[#${num++}]${data.message}`;
        io.sockets.emit('chat', data);
    });
    socket.on('clear', (data) => {
        console.log('gogo');
        io.sockets.emit('clear', data);
    });
});