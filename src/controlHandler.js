import { 
    showModel, showSkeleton, modifyTimeScale, executeAnimationFlow, 
    unPauseAllActions, pauseAllActions, toSingleStepMode, download
} from "./loadCharacter.js";



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
    changeButtonToPause();
    let flowList = document.getElementsByClassName("flow-list-text");
    let actionList = [];
    for (let i = 0; i < flowList.length; i++) {
        actionList.push(flowList[i].innerText);
    }
    
    executeAnimationFlow(actionList, 0.6);
};

// function when download button is clicked
window.downloader = () => {
    // Initialize Variables
    var closePopup = document.getElementById("popupclose");
    var overlay = document.getElementById("overlay");
    var popup = document.getElementById("popup");
    var cancelButton = document.getElementById("cancel-button");
    var downloadButton = document.getElementById("download-button");


    //make popup window visible
    overlay.style.display = 'inline-block';
    popup.style.display = 'inline-block';
 
    // Close Popup Event
    closePopup.onclick = function() {
        overlay.style.display = 'none';
        popup.style.display = 'none';
    };
    
    // Cancel button event
    cancelButton.onclick = function() {
        overlay.style.display = 'none';
        popup.style.display = 'none';
    };

    // Download button event
    downloadButton.onclick = function() {
        download();
        overlay.style.display = 'none';
        popup.style.display = 'none';
    };
};

// function to pause actions
window.pause = () => {
    pauseAllActions();
};

// function to play actions
window.pausePlayButtonClicked = () => {
    let imgSrc = document.getElementById("playButton");
    if (imgSrc.src.includes("/images/playIcon.png")) {
        imgSrc.src = "./images/pauseIcon.png";
        unPauseAllActions();
    }
    else {
        imgSrc.src = "./images/playIcon.png";
        pauseAllActions();
    }
};

// helper functionto change the button to play
export function changeButtonToPlay() {
    let imgSrc = document.getElementById("playButton");
    if (imgSrc.src.includes("/images/pauseIcon.png")) {
        imgSrc.src = "./images/playIcon.png";
    }
}

// helper function to change the button to paused
export function changeButtonToPause() {
    let imgSrc = document.getElementById("playButton");
    if (imgSrc.src.includes("/images/playIcon.png")) {
        imgSrc.src = "./images/pauseIcon.png";
    }
}

// if step amount is changed, change the text
window.stepAmountChanged = () => {
    let stepAmount = document.getElementById("stepRange").value;
    document.getElementById("stepCount").innerText = stepAmount;
};

// function to play single step
window.doSingleStep = () => {
    changeButtonToPlay();
    toSingleStepMode(document.getElementById("stepRange").value);
};

// function to keep track of the list of animations in the flow
export function addAnimation(animationName) {

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

