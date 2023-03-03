import { showModel, showSkeleton, modifyTimeScale } from "./loadCharacter.js"

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

