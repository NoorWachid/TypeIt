const typeBoxLm = document.getElementById("TypeBox");
const boardLm = document.getElementById("Board");
const inputLm = document.getElementById("Input");
const infoLm = document.getElementById("Info");
const timerLm = document.getElementById("Timer");
const currentWpmLm = document.getElementById("CurrentWpm");

const scoreBoxLm = document.getElementById("ScoreBox");
const wpmLm = document.getElementById("Wpm");
const accuracyLm = document.getElementById("Accuracy");
const wordDetailLm = document.getElementById("WordDetail");
const keystrokeDetailLm = document.getElementById("KeystrokeDetail");

const restartBtnLm = document.getElementById("RestartBtn");
const settingsBtnLm = document.getElementById("SettingsBtn");
const settingsBoxLm = document.getElementById("SettingsBox");
const saveBtnLm = document.getElementById("SaveBtn");

const themeLm = document.getElementById("Theme");
const themeLms = document.getElementsByName("Theme");
const modeLms = document.getElementsByName("Mode");
const timeLms = document.getElementsByName("Time");


let indexCounter = 0;
let charCounter = 0;
let correctCharCounter = 0;
let wrongCharCounter = 0;
let wordCounter = 0;
let corretWordCounter = 0;
let wordMin = 110;
let wordAboutGen = 20;
let wordScaleGen = 50;
let running = false;
let timeoutMax = 60;
let timeout = 0;
let intervalId = 0;
let beginPoint = 0;
let elements = [];
let prevTypedWord = "";
let mode = "Scroll";

function Initialize()
{
    inputLm.addEventListener("blur", ev => inputLm.placeholder = "Type here...");
    inputLm.addEventListener("focus", ev => inputLm.placeholder = "");
    inputLm.addEventListener("input", OnInput);
    
    restartBtnLm.addEventListener("click", ev => {
        Reset();
    });

    settingsBtnLm.addEventListener("click", ev => {
        settingsBoxLm.hidden = !settingsBoxLm.hidden;
    });

    saveBtnLm.addEventListener("click", OnSaveSettings);

    infoLm.hidden = true;
    scoreBoxLm.hidden = true;
    settingsBoxLm.hidden = true;

    if (localStorage.hasOwnProperty("Theme"))
    {
        const value = localStorage.getItem("Theme");
        Array.from(themeLms).find(el => el.value === value).checked = true;
        themeLm.href = value + ".css";
    }
    if (localStorage.hasOwnProperty("Mode"))
    {
        const value = localStorage.getItem("Mode");
        Array.from(modeLms).find(el => el.value === value).checked = true;
        mode = value;
    }
    if (localStorage.hasOwnProperty("Time"))
    {
        const value = localStorage.getItem("Time");
        Array.from(timeLms).find(el => el.value === value).checked = true;
        timeoutMax = parseInt(value);
    }

    if (mode === "Float")
    {
        MakeInputFloat();
    }
    if (mode === "Train")
    {
        MakeBoardOneline();
    }
}

function Reset()
{
    boardLm.textContent = "";
    elements = [];

    indexCounter = 0;
    charCounter = 0;
    correctCharCounter = 0;
    wrongCharCounter = 0;
    wordCounter = 0;
    correntWordCounter = 0;
    beginPoint = 0;
    inputLm.value = "";
    running = false;

    Generate(wordMin);
    clearInterval(intervalId);
    infoLm.hidden = true;
    scoreBoxLm.hidden = true;
    typeBoxLm.hidden = false;

    ScrollToLm(boardLm, elements[indexCounter], 0);

    inputLm.focus();
    elements[indexCounter].classList.add("Active");

    if (mode == "Float")
    {
        MoveInput();
    }
}

function Start()
{
    timeout = timeoutMax;
    OnTick();
    intervalId = setInterval(OnTick, 1000);
    beginPoint = Date.now();
    infoLm.hidden = false;
}

function Finish()
{
    let accr = 0;

    if (charCounter > 0 && wrongCharCounter <= correctCharCounter)
    {
        accr = (correctCharCounter - wrongCharCounter) / charCounter * 100;
    }

    wpmLm.textContent = CalculateWpm().toFixed(1);
    accuracyLm.textContent = accr.toFixed(1);

    wordDetailLm.textContent = correntWordCounter + "/" + wordCounter;
    wordDetailLm.textContent += wordCounter > 1 ? " words" : " word";

    keystrokeDetailLm.textContent = correctCharCounter + "/" + charCounter;
    keystrokeDetailLm.textContent += charCounter > 1 ? " keystrokes" : " keystroke";

    clearInterval(intervalId);
    typeBoxLm.hidden = true;
    scoreBoxLm.hidden = false;
    running = false;
}

function OnTick()
{
    if (timeout <= 0)
    {
        Finish();
    }
    
    let formated = "";
    const min = Math.floor(timeout / 60);
    if (min > 0)
    {
        formated += min + "m ";
        formated += (timeout % 60) + "s";
    }
    else
    {
        formated += timeout + "s";
    }

    timerLm.textContent = formated;
    currentWpmLm.textContent = CalculateWpm().toFixed(1) + "w/m";
    timeout--;
}

function OnInput(ev)
{
    if (!running) 
    {
        running = true;
        Start();
    }

    elements[indexCounter].className = "Word";


    if (ev.data !== " ")
    {
        const tx = elements[indexCounter].textContent;
        const rx = inputLm.value;
        let matched = true;
        let i = 0;
        for (; i < tx.length && i < rx.length; ++i)
        {
            if (tx[i] !== rx[i])
            {
                matched = false;
                break;
            }
        }
        if (matched && rx.length <= i)
        {
            elements[indexCounter].classList.add("Active");
            if (mode == "Float") 
            {
                inputLm.classList = "Active";
            }
        } 
        else 
        {
            elements[indexCounter].classList.add("ActiveWrong");
            if (mode == "Float") 
            {
                inputLm.classList = "ActiveWrong";
            }

            ++wrongCharCounter;
        }
        prevTypedWord = inputLm.value;
    }
    else
    {
        if (indexCounter + wordAboutGen > elements.length)
        { 
            Generate(wordScaleGen);
        }

        if (prevTypedWord === elements[indexCounter].textContent)
        {
            elements[indexCounter].classList.add("Typed");
            correctCharCounter += inputLm.value.length;
            ++correntWordCounter;
        }
        else
        {
            elements[indexCounter].classList.add("TypedWrong");
        }

        charCounter += inputLm.value.length;
        ++wordCounter;
        ++indexCounter;
        inputLm.value = "";
        elements[indexCounter].classList.add("Active");
        if (mode == "Float") 
        {
            inputLm.classList = "Active";
        }

        ScrollToLm(boardLm, elements[indexCounter], 0.3);
    }
}

function Generate(n)
{
    for (let i = 0; i < n; ++i)
    {
        const value = words[Math.floor(Math.random() * words.length)];
        const word = document.createElement("span");
        word.textContent = value;
        word.classList.add("Word");
        boardLm.appendChild(word);

        elements.push(word);
    };
}

function CalculateWpm()
{
    const timeSpent = Date.now() - beginPoint;
    return (correctCharCounter / 5) / (timeSpent / 60e3);
}

function OnSaveSettings()
{
    const formTheme = Array.from(themeLms).find(el => el.checked).value;
    const formTime = Array.from(timeLms).find(el => el.checked).value;
    mode = Array.from(modeLms).find(el => el.checked).value;
    timeoutMax = parseInt(formTime);
    themeLm.href = formTheme + ".css";

    if (mode == "Float")
    {
        MakeInputFloat();
        MoveInput();
    }
    else
    {
        MakeInputDrown();
    }

    if (mode == "Train")
    {
        MakeBoardOneline();
    }
    else
    {
        MakeBoardMultiline();
    }

    localStorage.setItem("Theme", formTheme);
    localStorage.setItem("Mode", mode);
    localStorage.setItem("Time", formTime);

    ScrollToLm(boardLm, elements[indexCounter], 0);

    if (running)
    {
        Reset();
    }
}

function MakeInputFloat()
{
    inputLm.style.position = "absolute";
    inputLm.style.width = "160px";
    inputLm.className = "Active";
}
function MakeInputDrown()
{
    inputLm.style.position = "";
    inputLm.style.width = "100%";
    inputLm.className = '';
}
function MoveInput()
{
    const inputRect = inputLm.getBoundingClientRect();
    const boardRect = boardLm.getBoundingClientRect();
    const elementRect = elements[indexCounter].getBoundingClientRect();

    if (elementRect.x + inputRect.width > boardRect.x + boardRect.width)
    {
        inputLm.style.left = (boardRect.x + boardRect.width - inputRect.width) + "px";
    }
    else
    {
        inputLm.style.left = elementRect.x + "px";
    }
    inputLm.style.top = (elementRect.y + elementRect.height + 2) + "px";
}
function MakeBoardOneline()
{
    boardLm.style.whiteSpace = "nowrap";
    boardLm.style.height = "auto";
    boardLm.style.fontSize = "34px";
}
function MakeBoardMultiline()
{
    boardLm.style.whiteSpace = "";
    boardLm.style.height = "130px";
    boardLm.style.fontSize = "28px";
}

function ScrollToLm(container, element, duration)
{
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const position = {
        x: elementRect.left - containerRect.left + container.scrollLeft,
        y: elementRect.top - containerRect.top + container.scrollTop,
    };

    ScrollTo(container, position, duration);
}

    
function ScrollTo(element, to, duration) 
{
    let start = {
        x: element.scrollLeft,
        y: element.scrollTop
    };
    let change = {
        x: to.x - start.x,
        y: to.y - start.y
    };
    let then = performance.now();
    let now, elapsed, dx;

    if (duration == 0)
    {
        element.scrollLeft = start.x + change.x;
        element.scrollTop = start.y + change.y;
        return;
    }

    const EaseInOut = dx => dx < 0.5 ? 2 * dx * dx : -1 + (4 - 2 * dx) * dx;

    const Animate = () => {
        now = performance.now();
        elapsed = (now - then) / 1000;
        dx = (elapsed/duration);

        const scale = EaseInOut(dx);

        element.scrollLeft = start.x + change.x * scale;
        element.scrollTop = start.y + change.y * scale;

        if (mode == "Float")
        {
            MoveInput();
        }

        if (dx < 1)
            requestAnimationFrame(Animate);
    };

    Animate();
}

Initialize();
Reset();