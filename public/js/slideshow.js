var slides = document.querySelectorAll("#slides > img");
var prev = document.getElementById("prev");
var next = document.getElementById("next");
var slides2 = document.querySelector("#slides");
var current = 0;

showSlides(current);
prev.onclick = prevSlide;
next.onclick = nextSlide;

var buttons = document.querySelectorAll(".buttons");
for (let i = 0; i < buttons.length; i++) {
  buttons[i].onclick = animateSlide;
}

function showSlides(n) {
  slides2.style.left = -current*1300 + "px";
}

function prevSlide() {
  if (current > 0) current -= 1;
  else
    current = slides.length - 1;
    showSlides(current);
}

function nextSlide() {
  if (current < slides.length - 1) current += 1;
  else
    current = 0;
    showSlides(current);  
}

function animateSlide() {
  var loc = parseInt(this.getAttribute("loc"))-1;
  if(loc>=0 && loc<buttons.length) current=loc;
  showSlides(current);  
}
