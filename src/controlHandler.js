import { showModel, showSkeleton, modifyTimeScale, executeAnimationFlow } from "./loadCharacter.js";

const animationList = [];
window.showModelClicked = () => {
    let visibility = document.getElementById("showModel").checked;
    showModel(visibility);
};

window.showSkeletonClicked = () => {
    let visibility = document.getElementById("showSkeleton").checked;
    showSkeleton(visibility);
};

window.speedTextChanged = () => {
    let speed = document.getElementById("speedText").value;
    if (isNaN(speed)){
        speed = 1;
        document.getElementById("speedText").value = 1;
    }
    else if (speed < 0) {
        speed = 0;
        document.getElementById("speedText").value = 0;
    }
    else if (speed > 2) {
        speed = 2;
        document.getElementById("speedText").value = 2;
    }
    document.getElementById("speedRange").value = speed;
    modifyTimeScale(speed);
};

window.speedRangeChanged = () => {
    let speed = document.getElementById("speedRange").value;
    document.getElementById("speedText").value = speed;
    modifyTimeScale(speed);
};

window.startFlow = () => {
    let actionList = [];
    for (let i = 0; i < animationList.length; i++) {
        actionList.push(animationList[i][1]);
    }
    console.log(actionList);
    executeAnimationFlow(actionList, 1);
};

export function addAnimation(animationName) {
    const listInput = [animationList.length, animationName];
    animationList.push(listInput);

    const content = document.getElementById("animation-list");
    // make a list item
    const element = document.createElement("div");
    element.className = "gui-section";

    // make a remove button and remove from list and DOM
    const removeButton = document.createElement("button");
    removeButton.className = "button-remove";
    removeButton.innerText = "-";
    removeButton.addEventListener("click", () => {
        removeAnimation(listInput);
        element.remove();
    });

    const descriptionElement = document.createElement("div");
    descriptionElement.className = "flow-list-text";
    descriptionElement.innerText = animationName;

    element.appendChild(removeButton);
    element.appendChild(descriptionElement);

    content.appendChild(element);
};

// helper function to remove an animation from the flow list
function removeAnimation(animationRem) {

    //if it is the last animation, just pop
    if (animationRem[0] == animationList.length-1) {
        animationList.pop();
    }

    else{
        let ind = animationRem[0];
        while (ind < animationList.length-1) {
            animationList[ind][1] = animationList[ind+1][1];
            ind++;
        }
        
        animationList.pop();
    }
}
