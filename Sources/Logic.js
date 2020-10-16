let wordList = [];
let wordListReady = false;
let wordListSuccess = false;
let currentWordNode = document.createElement('span');

const initialLength = 120;
const expantionLength = 50;
const distanceBeforeExpansionLength = 20;

let isTyping = false;

let timer = 0;
let beginTimePoint = 0;
let intervalId = 0;

let indexCounter = 0;
let correctCharCounter = 0;
let wrongCharCounter = 0;
let charCounter = 0;
let correctWordCounter = 0;
let wordCounter = 0;

let previousTheme = setting.theme.selected;
let previousMode = setting.mode.selected;
let previousLanguage = setting.language.selected;


function Initialize()
{
    Setting.hidden = true;

    document.body.addEventListener('resize', ev => {
        MoveHighlighter(currentWordNode);
    });

    const observer = new ResizeObserver(entries => {
        for (entry of entries)
        {
            MoveHighlighter(currentWordNode);
        }
    });
    observer.observe(document.body);

    Input.addEventListener('input', InputHandler);

    RestartButton.addEventListener('click', () => {
        if (wordListReady)
        {
            RestartHandler();
        }
    });

    SettingButton.addEventListener('click', SettingHandler);
    SaveSettingButton.addEventListener('click', SaveSettingHandler);

    LoadSetting();
    UpdateMode();
    CheckSelectedSettingCategory();
    FetchWordList();
}

function StartTyping()
{
    timer = GetSetting('time').value;
    beginTimePoint = performance.now();
    intervalId = setInterval(Tinker, 1000);
    UpdateInfo();
}

function StopTyping()
{
    isTyping = false;
    clearInterval(intervalId);

    Input.disabled = true;
    Score.innerHTML = `
        <div>${GetWpm().toFixed(1)} WPM ${GetAccuracy().toFixed(1)}% Accuracy</div>
        <div>${GetSetting('level').text} ${GetSetting('time').text}</div>
        <div>${correctWordCounter}/${wordCounter} ${wordCounter > 1 ? 'words' : 'word'}</div>
        <div>${correctCharCounter}/${charCounter} ${charCounter > 1 ? 'keystrokes' : 'keystroke'}</div>
    `;
}


// -- INTERNAL FUNCTIONS --

function Tinker()
{
    if (timer <= 0)
    {
        StopTyping();
    }
    UpdateInfo();
    --timer;
}

function UpdateInfo()
{
    let message = '';
    const minute = Math.floor(timer / 60);
    if (minute > 0)
    {
        message += `${minute}m ${timer % 60}s`;
    }
    else
    {
        message += `${timer}s`;
    }
    message += ` — ${GetWpm().toFixed(1)}w/m`;
    Info.textContent = message;
}

function GetWpm()
{
    if (correctCharCounter > 0)
    {
        const normalizedWord = correctCharCounter / 5;
        const elapsedTime = (performance.now() - beginTimePoint) / 60e3;

        return normalizedWord / elapsedTime;
    }
    return 0;
}

function GetAccuracy()
{
    if (charCounter > 0 && correctCharCounter > wrongCharCounter) 
    {
        return (correctCharCounter - wrongCharCounter) / charCounter * 100;
    }
    return 0;
}

function GetSetting(key)
{
    return setting[key].options[setting[key].selected];
}

async function FetchWordList()
{
    const response = await fetch(`Data/${GetSetting('language').value}`);
    wordList = [];
    wordListReady = false;
    wordListSuccess = false;

    WordList.hidden = true;
    WaitScreen.hidden = false;
    WaitScreen.textContent = 'Wait...';

    if (response.ok) 
    {
        const data = await response.text();
        wordList = data.split('\n').slice(0, 10000);
        wordListReady = true;
        wordListSuccess = true;
        WordList.hidden = false;
        WaitScreen.hidden = true;

        RestartHandler();
    }

    WaitScreen.textContent = 'Failed to fetch data';
}

function PushWordList(n)
{
    for (let i = 0; i < n; ++i)
    {
        const commonWord = GetSetting('level').value;
        const word = wordList[Math.floor(Math.random() * commonWord)];
        WordList.appendChild(CreateNode('span', { className: 'word', textContent: word }));
    }
}


// -- HANDLERS --

function InputHandler(input)
{
    if (wordListReady) 
    {
        if (!isTyping) 
        {
            isTyping = true;
            StartTyping();
        }


        if (input.data === ' ')
        {
            if (indexCounter + distanceBeforeExpansionLength > WordList.children.length)
            {
                PushWordList(expantionLength);
            }
            MoveToNextWord(input);
        }
        else 
        {
            CheckCurrentWord(input);
        }
    }
}

function CheckCurrentWord(input) 
{
    currentWordNode = WordList.children[indexCounter];

    const currentWord = currentWordNode.textContent;
    const currentTypedWord = Input.value;

    let matched = true;
    let index = 0;

    for (; index < currentWord.length && 
        index < currentTypedWord.length; ++index)
    {
        if (currentWord[index] !== currentTypedWord[index])
        {
            matched = false;
            break;
        }
    }

    if (matched && currentTypedWord.length <= index)
    {
        RemoveClassNode(currentWordNode, 'wrong');
    }
    else
    {
        AddClassNode(currentWordNode, 'wrong');
        if (input.data) 
        {
            ++wrongCharCounter;
        }
    }
}

function MoveToNextWord(input) 
{
    currentWordNode = WordList.children[indexCounter];

    const currentWord = currentWordNode.textContent;
    const currentTypedWord = Input.value.slice(0, -1);

    if (currentWord === currentTypedWord)
    {
        correctCharCounter += Input.value.length;
        ++correctWordCounter;
    }
    else 
    {
        AddClassNode(currentWordNode, 'wrong');
    }

    RemoveClassNode(currentWordNode, 'active');
    currentWordNode.classList.add('typed');

    charCounter += Input.value.length;
    ++wordCounter;
    ++indexCounter;
    currentWordNode = WordList.children[indexCounter];
    currentWordNode.classList.add('active');
    ScrollToNode(WordList, currentWordNode, 0.3);
    MoveHighlighter(currentWordNode, 0.4);
    Input.value = '';
}


function RestartHandler()
{
    Input.value = '';
    Input.disabled = false;
    isTyping = false;

    timer = GetSetting('time').value;
    timePoint = 0;
    intervalId = 0;
    UpdateInfo();

    indexCounter = 0;
    correctCharCounter = 0;
    wrongCharCounter = 0;
    charCounter = 0;
    correctWordCounter;
    wordCounter = 0;
    WordList.textContent = '';

    PushWordList(initialLength);
    currentWordNode = WordList.children[0];
    ScrollTo(WordList, { x: 0, y: 0 });
    AddClassNode(currentWordNode, 'active');
    MoveHighlighter(currentWordNode);
}

function SettingHandler()
{
    Setting.hidden = !Setting.hidden;

    previousTheme = setting.theme.selected;
    previousMode = setting.mode.selected;
    previousLanguage = setting.language.selected;
}

function SaveSettingHandler()
{
    if (isTyping) {
        RestartHandler();
    }

    if (previousMode !== setting.mode.selected)
    {
        UpdateMode();
        if (setting.mode.selected === 1)
        {
            AddClassNode(Highlighter, 'float');
        }
        else 
        {
            RemoveClassNode(Highlighter, 'float');
        }
    }

    if (previousLanguage !== setting.mode.selected)
    {
        FetchWordList();
    }

    previousTheme = setting.theme.selected;
    previousMode = setting.mode.selected;
    previousLanguage = setting.language.selected;

    SaveSetting();
}


// -- LOCAL STORAGE --

function LoadSetting()
{
    for (const key in setting)
    {
        if (localStorage.hasOwnProperty(key))
        {
            setting[key].selected = parseInt(localStorage.getItem(key));
        }
    }
}

function SaveSetting()
{
    for (const key in setting)
    {
        localStorage.setItem(key, setting[key].selected);
    }
}

function CheckSelectedSettingCategory()
{
    let index = 0;
    for (const key in setting)
    {
        for (const Option of Setting.children[index].children)
        {
            if (setting[key].selected == Option.dataset.index) {
                Option.classList.add('active');
            } else {
                if (Option.classList.contains('active')) {
                    Option.classList.remove('active');
                }
            }
        }
        ++index;
    }
}

// -- TRANSFORMATIONS --

function UpdateMode()
{
    for (className of WordList.classList)
    {
        if (className === 'word-list' || className === GetSetting('mode').value)
        {
            continue;
        }
        else 
        {
            RemoveClassNode(WordList, className);
        }
    }
    AddClassNode(WordList, GetSetting('mode').value);

    if (setting.mode.selected === 1)
    {
        AddClassNode(Input, 'float');
    }
    else 
    {
        RemoveClassNode(Input, 'float');
    }
}

Initialize();