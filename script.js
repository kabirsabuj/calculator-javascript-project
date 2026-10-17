
const resultDisplay = document.getElementById("result");
const historyDisplay = document.getElementById("history");
const keypad = document.querySelector(".keypad");

let currentValue = "0";
let previousValue = null;
let operator = null;
let waitingForOperand = false;
let justCalculated = false;
let errorState = false;

function updateDisplay() {
    resultDisplay.textContent = currentValue;

    keypad.querySelectorAll(".operator").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.operator === operator &&
            !waitingForOperand
        );
    });
}

function clearAll() {
    currentValue = "0";
    previousValue = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = false;
    errorState = false;

    historyDisplay.textContent = "Ready to calculate";
    updateDisplay();
}

function inputNumber(number) {
    if (errorState) clearAll();

    if (waitingForOperand || justCalculated) {
        currentValue = number;
        waitingForOperand = false;
        justCalculated = false;
    } else if (currentValue === "0") {
        currentValue = number;
    } else if (currentValue === "-0") {
        currentValue = "-" + number;
    } else if (currentValue.replace("-", "").replace(".", "").length < 15) {
        currentValue += number;
    }

    updateDisplay();
}

function inputDecimal() {
    if (errorState) clearAll();

    if (waitingForOperand || justCalculated) {
        currentValue = "0.";
        waitingForOperand = false;
        justCalculated = false;
    } else if (!currentValue.includes(".")) {
        currentValue += ".";
    }

    updateDisplay();
}

function formatNumber(number) {
    if (!Number.isFinite(number)) {
        return "Error";
    }

    // Prevent floating-point display errors.
    const rounded = Number(number.toPrecision(12));

    if (Math.abs(rounded) >= 1e15 ||
        (rounded !== 0 && Math.abs(rounded) < 1e-9)) {
        return rounded.toExponential(6);
    }

    return String(rounded);
}

function calculate(a, b, op) {
    switch (op) {
        case "+":
            return a + b;
        case "−":
            return a - b;
        case "×":
            return a * b;
        case "÷":
            return b === 0 ? NaN : a / b;
        default:
            return b;
    }
}

function showError() {
    currentValue = "Error";
    previousValue = null;
    operator = null;
    waitingForOperand = true;
    justCalculated = false;
    errorState = true;

    historyDisplay.textContent = "Cannot divide by zero";
    updateDisplay();
}

function chooseOperator(nextOperator) {
    if (errorState) return;

    const inputValue = Number(currentValue);

    if (operator && !waitingForOperand) {
        const result = calculate(
            previousValue,
            inputValue,
            operator
        );

        if (!Number.isFinite(result)) {
            showError();
            return;
        }

        currentValue = formatNumber(result);
        previousValue = result;
    } else if (previousValue === null || justCalculated) {
        previousValue = inputValue;
    }

    operator = nextOperator;
    waitingForOperand = true;
    justCalculated = false;

    historyDisplay.textContent =
        `${formatNumber(previousValue)} ${operator}`;

    updateDisplay();
}

function equals() {
    if (errorState || operator === null ||
        waitingForOperand || previousValue === null) {
        return;
    }

    const a = previousValue;
    const b = Number(currentValue);
    const activeOperator = operator;
    const answer = calculate(a, b, activeOperator);

    if (!Number.isFinite(answer)) {
        showError();
        return;
    }

    historyDisplay.textContent =
        `${formatNumber(a)} ${activeOperator} ${formatNumber(b)} =`;

    currentValue = formatNumber(answer);
    previousValue = null;
    operator = null;
    waitingForOperand = false;
    justCalculated = true;

    updateDisplay();
}

function toggleSign() {
    if (errorState) return;

    if (currentValue === "0") return;

    currentValue = currentValue.startsWith("-")
        ? currentValue.slice(1)
        : "-" + currentValue;

    if (justCalculated) {
        historyDisplay.textContent = "Result";
    }

    updateDisplay();
}

function percentage() {
    if (errorState) return;

    const value = Number(currentValue);
    currentValue = formatNumber(value / 100);

    waitingForOperand = false;
    justCalculated = false;
    historyDisplay.textContent = `${formatNumber(value)}%`;

    updateDisplay();
}

function deleteLast() {
    if (errorState) {
        clearAll();
        return;
    }

    if (waitingForOperand || justCalculated) {
        currentValue = "0";
        waitingForOperand = false;
        justCalculated = false;
    } else if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);

        if (currentValue === "-") {
            currentValue = "0";
        }
    } else {
        currentValue = "0";
    }

    updateDisplay();
}

// Handle mouse and touch button clicks.
keypad.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.number !== undefined) {
        inputNumber(button.dataset.number);
        return;
    }

    if (button.dataset.operator) {
        chooseOperator(button.dataset.operator);
        return;
    }

    switch (button.dataset.action) {
        case "clear":
            clearAll();
            break;
        case "delete":
            deleteLast();
            break;
        case "decimal":
            inputDecimal();
            break;
        case "sign":
            toggleSign();
            break;
        case "percent":
            percentage();
            break;
        case "equals":
            equals();
            break;
    }
});

// Keyboard support: numbers, operators, Enter, Backspace, Escape.
document.addEventListener("keydown", event => {
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        inputNumber(key);
        return;
    }

    if (key === ".") {
        inputDecimal();
        return;
    }

    if (key === "+" || key === "-") {
        chooseOperator(key === "+" ? "+" : "−");
        return;
    }

    if (key === "*" || key.toLowerCase() === "x") {
        chooseOperator("×");
        return;
    }

    if (key === "/") {
        event.preventDefault();
        chooseOperator("÷");
        return;
    }

    if (key === "Enter" || key === "=") {
        event.preventDefault();
        equals();
        return;
    }

    if (key === "Backspace") {
        deleteLast();
        return;
    }

    if (key === "Escape") {
        clearAll();
        return;
    }

    if (key === "%") {
        percentage();
        return;
    }
});

// Initial display
updateDisplay();
