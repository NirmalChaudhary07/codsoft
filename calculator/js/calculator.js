/* ============================================================
   CALCULATOR — JAVASCRIPT
   Sections:
   1. State
   2. DOM References
   3. Display Helpers
   4. Core Calculation Logic
   5. Action Handlers (digit / operator / equals / clear / sign / percent / decimal)
   6. Button Event Listeners
   7. Keyboard Event Listener
   ============================================================ */

'use strict';

// ----------------------------------------------------------
// 1. State
// ----------------------------------------------------------
const state = {
  currentValue:  '0',      // what's shown on screen right now
  previousValue: '',        // stored operand before operator press
  operator:      null,      // current pending operator (+, −, ×, ÷)
  justCalculated: false,    // true right after = was pressed
  waitingForOperand: false  // true after operator press — next digit starts fresh
};

// ----------------------------------------------------------
// 2. DOM References
// ----------------------------------------------------------
const expressionEl  = document.getElementById('expression');
const resultEl      = document.getElementById('result');
const clearBtn      = document.getElementById('clearBtn');
const calculatorEl  = document.getElementById('calculator');
const cursorEl      = document.querySelector('.display-cursor');

// ----------------------------------------------------------
// 3. Display Helpers
// ----------------------------------------------------------

/**
 * Update the main result display and auto-shrink font for long numbers.
 */
function updateDisplay(value) {
  resultEl.textContent = value;
  resultEl.className   = 'display-result';        // reset classes

  const len = value.replace(/[^0-9.]/g, '').length;
  if      (len > 14) { resultEl.classList.add('shrink-xs'); }
  else if (len > 10) { resultEl.classList.add('shrink-sm'); }
  else if (len > 8)  { resultEl.classList.add('shrink-md'); }
}

/**
 * Update the smaller expression line above the main number.
 */
function updateExpression(text) {
  expressionEl.textContent = text;
}

/**
 * Flash the result on calculation.
 */
function flashResult() {
  resultEl.classList.remove('flash');
  void resultEl.offsetWidth; // reflow to restart animation
  resultEl.classList.add('flash');
}

/**
 * Shake the calculator on error (e.g. division by zero).
 */
function shakeError() {
  calculatorEl.classList.remove('error');
  void calculatorEl.offsetWidth;
  calculatorEl.classList.add('error');
}

/**
 * Show/hide the blinking cursor.
 */
function setCursor(active) {
  cursorEl.classList.toggle('active', active);
}

/**
 * Update the "AC" / "C" label on the clear button.
 */
function updateClearLabel() {
  clearBtn.textContent = (state.currentValue === '0' && !state.previousValue) ? 'AC' : 'C';
}

// ----------------------------------------------------------
// 4. Core Calculation Logic
// ----------------------------------------------------------

/**
 * Perform the arithmetic operation between two operands.
 * Returns a string result.
 */
function calculate(a, operator, b) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  let result;

  if      (operator === '+') { result = numA + numB; }
  else if (operator === '−') { result = numA - numB; }
  else if (operator === '×') { result = numA * numB; }
  else if (operator === '÷') {
    if (numB === 0) { return 'Error'; }
    result = numA / numB;
  }
  else { return b; }

  // Round floating-point noise (e.g. 0.1+0.2 = 0.30000000004)
  result = parseFloat(result.toPrecision(12));

  // Format: remove trailing zeros after decimal
  return String(result);
}

/**
 * Format a number string for display (add thousands separators).
 * Keeps the decimal point and trailing zeros while typing.
 */
function formatDisplay(value) {
  if (value === 'Error') { return 'Error'; }

  const isNeg = value.startsWith('-');
  const abs   = isNeg ? value.slice(1) : value;
  const [intPart, decPart] = abs.split('.');

  const formatted = parseInt(intPart, 10).toLocaleString('en-US');
  let display = (isNeg ? '−' : '') + formatted;

  if (decPart !== undefined) { display += '.' + decPart; }
  else if (value.endsWith('.')) { display += '.'; }   // keep trailing dot while typing

  return display;
}

// ----------------------------------------------------------
// 5. Action Handlers
// ----------------------------------------------------------

/**
 * DIGIT pressed (0–9)
 */
function handleDigit(digit) {
  if (state.waitingForOperand) {
    // Start fresh after operator press
    state.currentValue = digit;
    state.waitingForOperand = false;
  } else if (state.justCalculated) {
    // After = : start a fresh number
    state.currentValue  = digit;
    state.previousValue = '';
    state.operator      = null;
    state.justCalculated = false;
  } else {
    // Append digit (cap at 15 characters to avoid overflow)
    if (state.currentValue.replace('-', '').length >= 15) { return; }
    state.currentValue = (state.currentValue === '0') ? digit : state.currentValue + digit;
  }

  updateDisplay(formatDisplay(state.currentValue));
  updateExpression(state.previousValue && state.operator
    ? formatDisplay(state.previousValue) + ' ' + state.operator
    : '');
  setCursor(true);
  updateClearLabel();
}

/**
 * OPERATOR pressed (+, −, ×, ÷)
 */
function handleOperator(op) {
  // If there's already a pending operation and user typed a second operand — calculate first
  if (state.operator && !state.waitingForOperand && !state.justCalculated) {
    const result = calculate(state.previousValue, state.operator, state.currentValue);
    if (result === 'Error') { return handleError(); }
    state.currentValue = result;
    updateDisplay(formatDisplay(result));
    flashResult();
  }

  state.previousValue    = state.currentValue;
  state.operator         = op;
  state.waitingForOperand = true;
  state.justCalculated   = false;

  updateExpression(formatDisplay(state.previousValue) + ' ' + op);
  setCursor(false);
  updateClearLabel();

  // Highlight the active operator button
  highlightOperator(op);
}

/**
 * EQUALS pressed
 */
function handleEquals() {
  if (!state.operator || state.waitingForOperand) { return; }

  const result = calculate(state.previousValue, state.operator, state.currentValue);

  updateExpression(
    formatDisplay(state.previousValue) + ' ' + state.operator + ' ' +
    formatDisplay(state.currentValue)  + ' ='
  );

  if (result === 'Error') {
    return handleError();
  }

  state.currentValue   = result;
  state.previousValue  = '';
  state.operator       = null;
  state.justCalculated = true;
  state.waitingForOperand = false;

  updateDisplay(formatDisplay(result));
  flashResult();
  clearOperatorHighlight();
  setCursor(false);
  updateClearLabel();
}

/**
 * CLEAR pressed
 * "C"  → clear only current entry
 * "AC" → full reset
 */
function handleClear() {
  if (clearBtn.textContent === 'C' && state.currentValue !== '0') {
    // Just clear current input
    state.currentValue      = '0';
    state.waitingForOperand = false;
    updateDisplay('0');
    updateClearLabel();
    setCursor(false);
  } else {
    // All clear
    state.currentValue       = '0';
    state.previousValue      = '';
    state.operator           = null;
    state.waitingForOperand  = false;
    state.justCalculated     = false;
    updateDisplay('0');
    updateExpression('');
    clearOperatorHighlight();
    setCursor(false);
    clearBtn.textContent = 'AC';
  }
}

/**
 * SIGN toggle (+/−)
 */
function handleSign() {
  if (state.currentValue === '0' || state.currentValue === 'Error') { return; }
  state.currentValue = state.currentValue.startsWith('-')
    ? state.currentValue.slice(1)
    : '-' + state.currentValue;
  updateDisplay(formatDisplay(state.currentValue));
}

/**
 * PERCENT
 * Divides current value by 100.
 * If there's a pending + or −, treats it as a percentage of previousValue.
 */
function handlePercent() {
  const current = parseFloat(state.currentValue);
  if (isNaN(current)) { return; }

  let result;
  if (state.operator && state.previousValue && (state.operator === '+' || state.operator === '−')) {
    result = (parseFloat(state.previousValue) * current) / 100;
  } else {
    result = current / 100;
  }

  state.currentValue = String(parseFloat(result.toPrecision(12)));
  updateDisplay(formatDisplay(state.currentValue));
}

/**
 * DECIMAL point
 */
function handleDecimal() {
  if (state.waitingForOperand) {
    state.currentValue      = '0.';
    state.waitingForOperand = false;
    updateDisplay('0.');
    setCursor(true);
    return;
  }
  if (state.currentValue.includes('.')) { return; }  // already has a decimal
  state.currentValue += '.';
  updateDisplay(formatDisplay(state.currentValue));
  setCursor(true);
  updateClearLabel();
}

/**
 * Error state
 */
function handleError() {
  state.currentValue       = '0';
  state.previousValue      = '';
  state.operator           = null;
  state.waitingForOperand  = false;
  state.justCalculated     = false;
  updateDisplay('Error');
  updateExpression('Division by zero');
  shakeError();
  clearOperatorHighlight();

  // Auto-recover after a moment
  setTimeout(() => {
    updateDisplay('0');
    updateExpression('');
    updateClearLabel();
  }, 1800);
}

// ----------------------------------------------------------
// Operator button highlighting
// ----------------------------------------------------------
function highlightOperator(op) {
  clearOperatorHighlight();
  document.querySelectorAll('.btn-operator').forEach((btn) => {
    if (btn.dataset.value === op) {
      btn.classList.add('is-active');
    }
  });
}

function clearOperatorHighlight() {
  document.querySelectorAll('.btn-operator').forEach((btn) => {
    btn.classList.remove('is-active');
  });
}

// ----------------------------------------------------------
// 6. Button Event Listeners
// ----------------------------------------------------------
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    if      (action === 'digit')    { handleDigit(value); }
    else if (action === 'operator') { handleOperator(value); }
    else if (action === 'equals')   { handleEquals(); }
    else if (action === 'clear')    { handleClear(); }
    else if (action === 'sign')     { handleSign(); }
    else if (action === 'percent')  { handlePercent(); }
    else if (action === 'decimal')  { handleDecimal(); }
  });
});

// ----------------------------------------------------------
// 7. Keyboard Event Listener
// ----------------------------------------------------------
const keyMap = {
  '0': () => handleDigit('0'),
  '1': () => handleDigit('1'),
  '2': () => handleDigit('2'),
  '3': () => handleDigit('3'),
  '4': () => handleDigit('4'),
  '5': () => handleDigit('5'),
  '6': () => handleDigit('6'),
  '7': () => handleDigit('7'),
  '8': () => handleDigit('8'),
  '9': () => handleDigit('9'),
  '.': () => handleDecimal(),
  ',': () => handleDecimal(),
  '+': () => handleOperator('+'),
  '-': () => handleOperator('−'),
  '*': () => handleOperator('×'),
  '/': () => handleOperator('÷'),
  'Enter': () => handleEquals(),
  '=':     () => handleEquals(),
  'Escape':    () => handleClear(),
  'Backspace': () => {
    // Delete last character from current input
    if (state.waitingForOperand || state.justCalculated) { return; }
    if (state.currentValue.length === 1 || (state.currentValue.length === 2 && state.currentValue.startsWith('-'))) {
      state.currentValue = '0';
    } else {
      state.currentValue = state.currentValue.slice(0, -1);
    }
    updateDisplay(formatDisplay(state.currentValue));
    updateClearLabel();
  },
  '%': () => handlePercent(),
};

document.addEventListener('keydown', (e) => {
  // Don't fire if user is typing in an input elsewhere
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') { return; }

  // Prevent "/" from opening browser quick-find
  if (e.key === '/') { e.preventDefault(); }

  const handler = keyMap[e.key];
  if (handler) {
    handler();

    // Visually "press" the matching button
    const btnSelector = getBtnSelector(e.key);
    if (btnSelector) {
      const el = document.querySelector(btnSelector);
      if (el) {
        el.classList.add('key-pressed');
        setTimeout(() => el.classList.remove('key-pressed'), 120);
      }
    }
  }
});

/**
 * Map a keyboard key to a CSS selector for visual feedback.
 */
function getBtnSelector(key) {
  const digitKeys = ['0','1','2','3','4','5','6','7','8','9'];
  if (digitKeys.includes(key)) {
    return `.btn-digit[data-value="${key}"]`;
  }
  const opMap = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  if (opMap[key]) {
    return `.btn-operator[data-value="${opMap[key]}"]`;
  }
  if (key === 'Enter' || key === '=')    { return '.btn-equals'; }
  if (key === 'Escape')                  { return '#clearBtn'; }
  if (key === '.' || key === ',')        { return '.btn[data-action="decimal"]'; }
  return null;
}
