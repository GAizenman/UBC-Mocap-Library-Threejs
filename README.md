# UBC-Mocap-Library-Threejs
How to run:
1) download and unzip files
2) open in VS Code
3) open a new terminal and type "npm install"
4) use Live Server extension to run the server

Code Description:


For the HTML: {
    There are 3 parts separated by the split pane. There are sections a, b, and 
    c all separated by the split pane in index.html.

    Section a:
    This section is a canvas on the left side and is used for the animation
    selector code. The animationSelector.js is called on the section's canvas and
    the javascript creates dom element selectors for each animation.

    Section b:
    This section is a canvas in the middle and is used for loading the main model.
    loadCharacter.js is called and uses the middle canvas to generate the scene and
    render the model. 

    Section c:
    This section is used for the controls of the model and the animation flow. It is
    mostly HTML and CSS based, but uses controlHandler.js to connect and edit parts
    in section b.
}

For the JavaScript: {
    Most of the javascript uses Three.js, so it would be best to view the documentation
    before adjusting the code: https://threejs.org/docs/

    animationSelector.js:
    Uses the left side canvas to create a scene. Loads all of the animations for the
    model and creates a selector item for each one. Also renders each animation in
    the selector, and adds on clicks for them.

    loadCharacter.js:
    Uses the middle canvas to render the main model. Has orbit controls so user can
    move in the scene, and changes animations when a selector on the left is clicked.
    Also contains code for performing an animation flow by iterating through each
    animation in the list, and cross fading between them when the animation before
    has completed a full loop.

    controlHandler.js:
    Handles controls and options on the right side and helps connect the HTML with the
    .js files. It also generates the list for the animation flow and controls the
    download popup screen.

    selectCaller.js:
    used to call animationSelector.js in section a.

    characterCaller.js:
    used to call loadCharacter.js in section b.
}

for the CSS: {
    main.css:
    used for stylizing everything on the HTML.
}