import { 
    showModel, showSkeleton, modifyTimeScale, executeAnimationFlow, 
    unPauseAllActions, pauseAllActions, toSingleStepMode, getWeight
} from "./loadCharacter.js";

const animationList = [];

// if the show model is toggled
window.showModelClicked = () => {
    let visibility = document.getElementById("showModel").checked;
    showModel(visibility);
};

// if the show skeleton is toggled
window.showSkeletonClicked = () => {
    let visibility = document.getElementById("showSkeleton").checked;
    showSkeleton(visibility);
};

// if the speed is changed, change the text and modify the time scale
window.speedRangeChanged = () => {
    let speed = document.getElementById("speedRange").value;
    document.getElementById("speedText").innerText = speed + "x";
    modifyTimeScale(speed);
};

// function to start playing animations through the list
window.startFlow = () => {
    let flowList = document.getElementsByClassName("flow-list-text");
    let actionList = [];
    for (let i = 0; i < flowList.length; i++) {
        actionList.push(flowList[i].innerText);
    }
    
    executeAnimationFlow(actionList, 0.6);
};

window.printWeights = () => {
    let actionList = [];
    for (let i = 0; i < animationList.length; i++) {
        actionList.push(animationList[i][1]);
    }
    
    getWeight(actionList);
}

// function to pause actions
window.pause = () => {
    pauseAllActions();
};

// function to play actions
window.play = () => {
    unPauseAllActions();
};

// if step amount is changed, change the text
window.stepAmountChanged = () => {
    let stepAmount = document.getElementById("stepRange").value;
    document.getElementById("stepCount").innerText = stepAmount;
};

// function to play single step
window.doSingleStep = () => {
    toSingleStepMode(document.getElementById("stepRange").value);
};

// function to keep track of the list of animations in the flow
export function addAnimation(animationName) {
    const listInput = [animationList.length, animationName];
    animationList.push(listInput);

    const content = document.getElementById("animation-list");
    // make a list item
    const element = document.createElement("div");
    element.className = "gui-section";

    // make a remove button and remove from list and DOM
    const removeButton = document.createElement("IMG");
    removeButton.setAttribute("src", "./images/trash.png");
    removeButton.setAttribute("width", "15");
    removeButton.setAttribute("height", "15");
    removeButton.addEventListener("click", () => {
        removeAnimation(listInput);
        element.remove();
    });

    // add the name for the animation in the list
    const descriptionElement = document.createElement("div");
    descriptionElement.className = "flow-list-text";
    descriptionElement.innerText = animationName;

    element.appendChild(descriptionElement);
    element.appendChild(removeButton);

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
