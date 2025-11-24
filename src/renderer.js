const editor = document.getElementById('editor');
const statusEl = document.getElementById('status');
const titleEl = document.querySelector('.title');
const footerEl = document.querySelector('footer');

let saveTimeout = null;
let lastSavedText = '';
let currentFilePath = null;

// Sound
let keySound = null;
try {
    keySound = new Audio('sounds/keypress.mp3');
} catch (e) { }

function setStatus(text) {
    statusEl.textContent = text;
}

function updateTitle(filename) {
    titleEl.textContent = `Chromewright No. 12 - ${filename || 'Untitled'}`;
}

async function loadInitial() {
    const data = await window.chromewright.load();
    // data = { text, filePath, filename }
    editor.value = data.text || '';
    lastSavedText = editor.value;
    currentFilePath = data.filePath;
    updateTitle(data.filename);
    setStatus('Loaded');

    // Init auto-launch UI
    initAutoLaunchUI();
}

async function initAutoLaunchUI() {
    const isEnabled = await window.chromewright.getAutoLaunch();

    const label = document.createElement('label');
    label.style.marginLeft = '20px';
    label.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isEnabled;
    checkbox.onchange = async (e) => {
        await window.chromewright.setAutoLaunch(e.target.checked);
    };

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' Auto-launch'));
    footerEl.appendChild(label);
}

function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    setStatus('Saving…');
    saveTimeout = setTimeout(async () => {
        const text = editor.value;
        // Auto-save only works if we have a path
        if (currentFilePath) {
            const res = await window.chromewright.save({ text, filePath: currentFilePath });
            if (res.success) {
                lastSavedText = text;
                setStatus('Saved');
            } else {
                setStatus('Error saving');
            }
        } else {
            setStatus('Unsaved');
        }
    }, 1000); // 1s delay
}

async function performSave() {
    const text = editor.value;
    const res = await window.chromewright.save({ text, filePath: currentFilePath });
    if (res.success) {
        lastSavedText = text;
        currentFilePath = res.filePath;
        updateTitle(res.filename);
        setStatus('Saved');
    } else if (res.canceled) {
        // Do nothing
    } else {
        setStatus('Error saving');
    }
}

async function performSaveAs() {
    const text = editor.value;
    const res = await window.chromewright.saveAs(text);
    if (res.success) {
        lastSavedText = text;
        currentFilePath = res.filePath;
        updateTitle(res.filename);
        setStatus('Saved');
    }
}

async function performOpen() {
    const res = await window.chromewright.open();
    if (res.success) {
        editor.value = res.text;
        lastSavedText = res.text;
        currentFilePath = res.filePath;
        updateTitle(res.filename);
        setStatus('Opened');
    }
}

function playKeySound() {
    if (!keySound) return;
    keySound.currentTime = 0;
    keySound.play().catch(() => { });
}

editor.addEventListener('input', () => {
    scheduleSave();
});

editor.addEventListener('keydown', (e) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        playKeySound();
    }

    // Ctrl+S
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSave();
    }

    // Ctrl+Shift+S (Save As)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSaveAs();
    }

    // Ctrl+O (Open)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        performOpen();
    }

    // Esc
    if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }
});

// Typewriter Scrolling & Return Sound
let returnSound = null;
try {
    returnSound = new Audio('sounds/return.mp3');
} catch (e) { }

function playReturnSound() {
    if (!returnSound) return;
    returnSound.currentTime = 0;
    returnSound.play().catch(() => { });
}

function updateTypewriterScroll() {
    // Calculate cursor line number
    const textBeforeCursor = editor.value.substring(0, editor.selectionStart);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;

    // Get line height (approximate or computed)
    const computedStyle = window.getComputedStyle(editor);
    const lineHeight = parseFloat(computedStyle.lineHeight);

    // Calculate target scroll position to center the line
    // (currentLine * lineHeight) - (editorHeight / 2) + (lineHeight / 2)
    const editorHeight = editor.clientHeight;
    const targetScrollTop = (currentLineIndex * lineHeight) - (editorHeight / 2) + (lineHeight / 2);

    // Smooth scroll or instant? Instant feels more mechanical.
    editor.scrollTop = targetScrollTop;
}

// Hook into input and keydown/click to update scroll
editor.addEventListener('input', (e) => {
    // Check if it was a newline for sound
    if (e.inputType === 'insertLineBreak') {
        playReturnSound();
    }
    updateTypewriterScroll();
});

editor.addEventListener('click', updateTypewriterScroll);
editor.addEventListener('keyup', updateTypewriterScroll);

window.addEventListener('DOMContentLoaded', loadInitial);
