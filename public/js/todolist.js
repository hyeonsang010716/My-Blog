function newRegister() {
    var newItem = document.createElement("li");  // 요소 노드 추가
    var subject = document.querySelector("#subject");  // 폼의 텍스트 필드
    const newText = document.createElement('span');
    newText.textContent = subject.value;
    subject.value='';
    const newCheckbox = document.createElement('input');
    newCheckbox.type='checkbox';
    var newImage = document.createElement("img");
    newImage.src = "images/trash.png";
    newItem.appendChild(newCheckbox);
    newItem.appendChild(newText);   // 텍스트 노드를 요소 노드의 자식 노드로 추가
    newItem.appendChild(newImage);

    var itemList = document.querySelector("#itemList");  // 웹 문서에서 부모 노드 가져오기 
    itemList.prepend(newItem);  // 새로 만든 요소 노드를 부모 노드에 추가

    newCheckbox.addEventListener('change', (event) =>{ 
      newText.style.textDecoration = (event.currentTarget.checked) ? 'line-through' : 'none';
    })  

    newImage.addEventListener("click", function() { // 항목 클릭했을 때 실행할 함수
      if(this.parentNode && this.parentNode.parentNode) {  // 부모 노드가 있다면 
        var is = this.parentNode;
        is.parentNode.removeChild(is);  // 부모 노드에서 삭제
      }
    });
}
