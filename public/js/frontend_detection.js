import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.9.0';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Reference the elements that we will need
const status = document.getElementById('dl-status');
const fileUpload = document.getElementById('dl-file-upload');
const imageContainer = document.getElementById('dl-image-container');


// Create a new object detection pipeline
status.textContent = 'Loading <object detection model>...';
const detector = await pipeline('object-detection', 'Xenova/detr-resnet-50');


status.textContent = 'Loading <image-to-text translation model>...';
const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
status.textContent = 'Ready';


fileUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();

    // Set up a callback when the file is loaded
    reader.onload = function (e2) {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = e2.target.result;
        imageContainer.appendChild(image);
        detect(image);
    };
    reader.readAsDataURL(file);
});


// Detect objects in the image
async function detect(img) {
    status.textContent = 'Detecting object(s) in the image...';
    const output = await detector(img.src, {
        threshold: 0.5,
        percentage: true,
    }); 

    output.forEach(renderBox);
    
    status.textContent = 'Trying to figure out the image ...';
    const output2 = await captioner(img.src);
    console.log(output2);
    status.textContent = '(Result)  ' + output2[0].generated_text;
    
}

// Render a bounding box and label on the image
function renderBox({ box, label }) {
    const { xmax, xmin, ymax, ymin } = box;

    // Generate a random color for the box
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);

    // Draw the box
    const boxElement = document.createElement('div');
    boxElement.className = 'dl-bounding-box';
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
    labelElement.className = 'dl-bounding-box-label';
    labelElement.style.backgroundColor = color;

    boxElement.appendChild(labelElement);
    imageContainer.appendChild(boxElement);
}
