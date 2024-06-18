const status = document.getElementById('status');
const imageContainer = document.getElementById('image-container');
const dl_area = document.getElementById('dl-area');
const resetImage = document.getElementById('resetImage');
const inputFile = document.getElementById('inputFile');
const fileSelect = document.getElementById('selectFile');
const imageList = document.getElementById('imageList');
const imageUpload = document.getElementById('imageUpload');
const detectObject = document.getElementById('detectObject');
const textConversion = document.getElementById('textConversion');
const imageDownload = document.getElementById('imageDownload');
const remoteFile = document.getElementById('remoteFile');
const nameChange = document.getElementById('nameChange');
const deleteImage = document.getElementById('deleteImage');

let dl_file_name = '';

resetImage.addEventListener('click', async function (e) {
    let boundingBox = document.getElementsByClassName("bounding-box");
    const boundingBoxArray = Array.from(boundingBox);
    removeBox(boundingBoxArray);
});

function removeBox(boundingBox) {
    while(boundingBox.length)
        imageContainer.removeChild(boundingBox.pop());
}

fileSelect.addEventListener('change', function (e) {
    let imageFile = e.target.files[0];
    console.log(imageFile);
    if (!imageFile) {
        return;
    }
    const reader = new FileReader();
    reader.onload = async function (e2) {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = e2.target.result;
        console.log(`e2.target.result : ${e2.target.result}`);
        imageContainer.appendChild(image);
    };
    reader.readAsDataURL(imageFile);
    inputFile.value = e.target.files[0].name;
});

imageList.addEventListener('click', async function (e) {
    status.textContent = '저장된 파일 리스트 가져오는 중...';

    const response = await fetch(`/dl/images`, {
        method: "GET",
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },    
    });

    const output = await response.json();
    console.log(output);
    dl_area.innerHTML = JSON.stringify(output, null, 2);
    status.textContent = '완료';
});

imageUpload.addEventListener('click', async function (e) {
    status.textContent = '이미지 업로드 하는 중...';
    const formData = new FormData();
    formData.append('uploadFile', fileSelect.files[0]);

    const response = await fetch(`/dl/upload`, {
        method: "POST",
        body: formData
    });

    const output = await response.json();
    dl_area.innerHTML = JSON.stringify(output, null, 2);
    imageContainer.innerHTML = `<img src="/server-only-space/uploads/${fileSelect.files[0].name}" />`;
    dl_file_name = fileSelect.files[0].name;
    status.textContent = '완료';
});

detectObject.addEventListener('click', async function (e) {
    status.textContent = '물체 탐지 중...';
    //await detect(fileSelect.files[0].name);
    let res = await detect(dl_file_name);
    status.textContent = res;
});

textConversion.addEventListener('click', async function (e) {
    status.textContent = '이미지 분석 중...';
    //await captioning(fileSelect.files[0].name);
    await captioning(dl_file_name);
});

// Detect objects in the image
async function detect(name) {
    const response = await fetch(`/dl/detection/${name}`, {
        method: "GET",
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },    
    });

    const output = await response.json();
    dl_area.innerHTML = JSON.stringify(output, null, 2);
    if(output.status) return `파일(${name})이 존재하지 않음`;
    output.forEach(renderBox);
    return '완료';
}

// Captioning objects in the image
async function captioning(name) {
    const response = await fetch(`/dl/caption/${name}`, {
        method: "GET",
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },    
    });

    const output = await response.json();
    console.log(output);
    dl_area.innerHTML = JSON.stringify(output, null, 2);
    status.textContent = (output.status) ? `파일(${name})이 존재하지 않음` : '(결과) ' + output[0].generated_text;
}

imageDownload.addEventListener('click', async function (e) {
    status.textContent = '이미지 다운로드 하는 중...';

    const response = await fetch(`/dl/download/${remoteFile.value}`, {
        method: "GET",
        headers:{
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },    
      });

    const output = await response.json();
    dl_area.innerHTML = JSON.stringify(output, null, 2);
    imageContainer.innerHTML = `<img src="${output.data.urlAddress}" />`;
    dl_file_name = remoteFile.value;
    status.textContent = '완료';
});

nameChange.addEventListener('click', async function (e) {
    status.textContent = '파일 이름 변경 중...';
    const response = await fetch(`/dl/put/${dl_file_name}/${remoteFile.value}`, {
        method: "PUT",
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },    
    });

    const output = await response.json();
    console.log(output);
    dl_area.innerHTML = JSON.stringify(output, null, 2);    
    imageContainer.innerHTML = `<img src="${output.data.urlAddress}" />`;
    dl_file_name = remoteFile.value;
    status.textContent = '변경 완료';
});

deleteImage.addEventListener('click', async function (e) {
    status.textContent = '파일 삭제 중...';
    const response = await fetch(`/dl/delete/${remoteFile.value}`, {
        method: "DELETE",
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },    
    });

    const output = await response.json();
    console.log(output);
    dl_area.innerHTML = JSON.stringify(output, null, 2);    
    status.textContent = '삭제 완료';
});

// Render a bounding box and label on the image
function renderBox({ box, label }) {
    const { xmax, xmin, ymax, ymin } = box;

    // Generate a random color for the box
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);

    // Draw the box
    const boxElement = document.createElement('div');
    boxElement.className = 'bounding-box';
    Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
    })

    // Draw label
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    labelElement.className = 'bounding-box-label';
    labelElement.style.backgroundColor = color;

    boxElement.appendChild(labelElement);
    imageContainer.appendChild(boxElement);
}
