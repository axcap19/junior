/**
 * Learning Engine for aminsgames.com
 *
 * CSS Classes Required:
 * - learning-app, learning-container
 * - year-picker, year-card, year-card--selected
 * - subject-grid, subject-card, subject-card--locked
 * - lesson-list, lesson-item, lesson-item--locked, lesson-item--completed
 * - quiz-container, question-card, question-type-*
 * - progress-bar, progress-text
 * - multiple-choice-option, option--selected, option--correct, option--wrong
 * - true-false-buttons, tf-button, tf-button--selected
 * - fill-blank-input, fill-blank-input--error
 * - order-items, order-item, order-item--dragging
 * - match-container, match-column, match-pair, match-pair--selected
 * - quiz-results, results-header, results-item, results-item--correct, results-item--wrong
 * - admin-overlay, admin-dashboard, admin-summary, admin-breakdown
 * - btn-primary, btn-secondary, btn-back, btn-retry
 * - flex, flex-col, flex-between, gap, p, text-center, text-sm, text-lg
 * - header-bar, header-title, header-right, icon-btn
 * - streak-display, xp-display
 */

(function() {
  'use strict';

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const state = {
    visitorId: null,
    screen: 'yearPicker', // 'yearPicker', 'subjectGrid', 'lessonList', 'quiz', 'results', 'admin'
    selectedYear: null,
    selectedSubject: null,
    selectedLesson: null,
    currentQuestionIndex: 0,
    currentQuestions: [],
    userAnswers: [],
    progress: {
      xp: 0,
      streak: 0,
      completedLessons: {},
      scores: {},
      wrongAnswers: {}
    }
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function initVisitorId() {
    let vid = localStorage.getItem('learningAppVisitorId');
    if (!vid) {
      vid = generateUUID();
      localStorage.setItem('learningAppVisitorId', vid);
    }
    state.visitorId = vid;
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function loadProgress() {
    try {
      const response = await fetch(`/api/progress?visitorId=${state.visitorId}`);
      if (response.ok) {
        const data = await response.json();
        Object.assign(state.progress, data);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }

  async function saveProgress(year, subject, lessonId, score, wrongAnswers, passed) {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: state.visitorId,
          year,
          subject,
          lessonId,
          score,
          wrongAnswers,
          timestamp: new Date().toISOString(),
          passed
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // ============================================================================
  // DATA ACCESS
  // ============================================================================

  function getYearData(year) {
    const key = `YEAR_${year}_DATA`;
    return window[key] || null;
  }

  // Normalize question format across different data files
  function normalizeQuestion(q) {
    const nq = { ...q };
    // Handle opts/ans (year3/4 format) → options/answer
    if (nq.opts && !nq.options) { nq.options = nq.opts; delete nq.opts; }
    if (nq.ans !== undefined && nq.answer === undefined) { nq.answer = nq.ans; delete nq.ans; }
    // For multiple choice: if answer is a string, convert to index
    if (nq.type === 'multiple' && typeof nq.answer === 'string' && nq.options) {
      const idx = nq.options.indexOf(nq.answer);
      nq.answer = idx >= 0 ? idx : 0;
    }
    // For trueFalse: ensure answer is boolean
    if (nq.type === 'trueFalse' && typeof nq.answer === 'string') {
      nq.answer = nq.answer.toLowerCase() === 'true';
    }
    return nq;
  }

  // Normalize lesson format (name vs title)
  function getLessonTitle(lesson) {
    return lesson.title || lesson.name || 'Untitled';
  }

  function getAllYears() {
    const years = [];
    for (let y = 2; y <= 6; y++) {
      if (getYearData(y)) {
        years.push(y);
      }
    }
    return years;
  }

  function getYearProgress(year) {
    const data = getYearData(year);
    if (!data) return { completed: 0, total: 0 };

    let total = 0;
    let completed = 0;

    Object.values(data).forEach(subject => {
      if (subject.lessons) {
        subject.lessons.forEach(lesson => {
          total++;
          const key = `y${year}-${lesson.id}`;
          if (state.progress.completedLessons[key]) {
            completed++;
          }
        });
      }
    });

    return { completed, total };
  }

  function getSubjectProgress(year, subject) {
    const data = getYearData(year);
    if (!data || !data[subject] || !data[subject].lessons) {
      return { completed: 0, total: 0 };
    }

    let total = data[subject].lessons.length;
    let completed = 0;

    data[subject].lessons.forEach(lesson => {
      const key = `y${year}-${lesson.id}`;
      if (state.progress.completedLessons[key]) {
        completed++;
      }
    });

    return { completed, total };
  }

  function isLessonLocked(year, subject, lessonIndex) {
    if (lessonIndex === 0) return false;

    const data = getYearData(year);
    if (!data || !data[subject] || !data[subject].lessons) return true;

    const prevLesson = data[subject].lessons[lessonIndex - 1];
    const key = `y${year}-${prevLesson.id}`;
    return !state.progress.completedLessons[key];
  }

  function getLessonQuestion(year, subject, lessonId, questionPool) {
    if (!questionPool || questionPool.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * questionPool.length);
    return { ...questionPool[randomIndex], originalIndex: randomIndex };
  }

  // ============================================================================
  // SCREEN RENDERING
  // ============================================================================

  function renderYearPicker() {
    const years = getAllYears();
    if (years.length === 0) {
      return '<div class="text-center p"><p>No curriculum data loaded yet.</p></div>';
    }

    const cards = years.map(year => {
      const prog = getYearProgress(year);
      const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
      return `
        <div class="year-card" onclick="LearningApp.selectYear(${year})">
          <div class="year-card__number">Year ${year}</div>
          <div class="year-card__progress">
            <div class="progress-bar">
              <div class="progress-bar__fill" style="width: ${percent}%"></div>
            </div>
            <div class="progress-text">${prog.completed}/${prog.total} lessons</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="learning-container">
        <div class="learning-header-bar">
          <button class="btn-back" onclick="showScreen('menu-screen')">← Menu</button>
          <h1>📚 Amin's Practice</h1>
          <button class="btn-admin" onclick="LearningApp.openAdmin()">🔒 Admin</button>
        </div>
        <p class="text-center subtitle">Choose Your Year</p>
        <div class="year-picker">
          ${cards}
        </div>
      </div>
    `;
  }

  function renderSubjectGrid() {
    const year = state.selectedYear;
    const data = getYearData(year);
    if (!data) return '<div class="text-center p"><p>No data for Year ${year}</p></div>';

    const subjects = Object.keys(data).map(key => {
      const subject = data[key];
      const prog = getSubjectProgress(year, key);
      const percent = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
      return `
        <div class="subject-card" onclick="LearningApp.selectSubject('${key}')">
          <div class="subject-card__icon">${subject.icon}</div>
          <div class="subject-card__name">${subject.name}</div>
          <div class="subject-card__progress">
            <div class="progress-bar">
              <div class="progress-bar__fill" style="width: ${percent}%"></div>
            </div>
            <div class="progress-text">${prog.completed}/${prog.total}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="learning-container">
        <button class="btn-back" onclick="LearningApp.goBack()">← Back</button>
        <h1 class="text-center">Year ${year} Subjects</h1>
        <div class="subject-grid">
          ${subjects}
        </div>
      </div>
    `;
  }

  function renderLessonList() {
    const year = state.selectedYear;
    const subject = state.selectedSubject;
    const data = getYearData(year);
    if (!data || !data[subject]) return '<div class="text-center p"><p>No lessons found</p></div>';

    const lessons = data[subject].lessons.map((lesson, index) => {
      const locked = isLessonLocked(year, subject, index);
      const key = `y${year}-${lesson.id}`;
      const completed = state.progress.completedLessons[key];
      const score = state.progress.scores[key];

      let statusClass = '';
      let statusText = '';
      if (locked) {
        statusClass = 'lesson-item--locked';
        statusText = '🔒 Locked';
      } else if (completed) {
        statusClass = 'lesson-item--completed';
        statusText = '✓ Completed';
      } else {
        statusText = '';
      }

      const clickHandler = locked ? '' : `onclick="LearningApp.startLesson(${index})"`;
      const cursorClass = locked ? 'cursor-not-allowed' : 'cursor-pointer';

      return `
        <div class="lesson-item ${statusClass} ${cursorClass}" ${clickHandler}>
          <div>
            <div class="lesson-item__title">${getLessonTitle(lesson)}</div>
            <div class="lesson-item__description">${lesson.description || ''}</div>
            ${score ? `<div class="lesson-item__score">Best: ${score.correct}/10</div>` : ''}
          </div>
          <div class="lesson-item__status">${statusText}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="learning-container">
        <button class="btn-back" onclick="LearningApp.goBack()">← Back</button>
        <h1 class="text-center">${data[subject].name}</h1>
        <div class="lesson-list">
          ${lessons}
        </div>
      </div>
    `;
  }

  function renderQuiz() {
    const question = state.currentQuestions[state.currentQuestionIndex];
    if (!question) {
      return renderResults();
    }

    const progressPercent = Math.round(((state.currentQuestionIndex + 1) / 10) * 100);
    let questionHtml = '';

    switch (question.type) {
      case 'multiple':
        questionHtml = renderMultipleChoice(question);
        break;
      case 'trueFalse':
        questionHtml = renderTrueFalse(question);
        break;
      case 'fillBlank':
        questionHtml = renderFillBlank(question);
        break;
      case 'order':
        questionHtml = renderOrder(question);
        break;
      case 'match':
        questionHtml = renderMatch(question);
        break;
      default:
        questionHtml = '<p>Unknown question type</p>';
    }

    return `
      <div class="learning-container">
        <div class="quiz-header">
          <button class="btn-back" onclick="LearningApp.abandonQuiz()">← Back</button>
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="progress-text">Question ${state.currentQuestionIndex + 1}/10</div>
        </div>
        <div class="quiz-container">
          <div class="question-card">
            <h2>${question.q}</h2>
            <div class="question-type-${question.type}">
              ${questionHtml}
            </div>
          </div>
          <button class="btn-primary" id="next-btn" onclick="LearningApp.nextQuestion()" style="display: none;">
            ${state.currentQuestionIndex === 9 ? 'See Results' : 'Next'}
          </button>
        </div>
      </div>
    `;
  }

  function renderMultipleChoice(question) {
    const userAnswer = state.userAnswers[state.currentQuestionIndex];
    return `
      <div class="multiple-choice">
        ${question.options.map((option, idx) => {
          const selected = userAnswer === idx;
          const classList = ['multiple-choice-option'];
          if (selected) classList.push('option--selected');
          return `
            <button class="${classList.join(' ')}" onclick="LearningApp.selectMultipleChoice(${idx})">
              ${option}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderTrueFalse(question) {
    const userAnswer = state.userAnswers[state.currentQuestionIndex];
    return `
      <div class="true-false-buttons">
        <button class="tf-button ${userAnswer === true ? 'tf-button--selected' : ''}"
                onclick="LearningApp.selectTrueFalse(true)">
          True
        </button>
        <button class="tf-button ${userAnswer === false ? 'tf-button--selected' : ''}"
                onclick="LearningApp.selectTrueFalse(false)">
          False
        </button>
      </div>
    `;
  }

  function renderFillBlank(question) {
    const userAnswer = state.userAnswers[state.currentQuestionIndex] || '';
    return `
      <input type="text" class="fill-blank-input" id="fill-blank-input"
             value="${userAnswer}" placeholder="Type your answer"
             onkeyup="LearningApp.updateFillBlank(this.value)">
    `;
  }

  function renderOrder(question) {
    const currentOrder = state.userAnswers[state.currentQuestionIndex] || [...question.items];
    return `
      <div class="order-items" id="order-items">
        ${currentOrder.map((item, idx) => `
          <div class="order-item" draggable="true" data-index="${idx}"
               ondragstart="LearningApp.dragStart(event)" ondrop="LearningApp.dragDrop(event)"
               ondragover="event.preventDefault()">
            ${item}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMatch(question) {
    const currentMatches = state.userAnswers[state.currentQuestionIndex] || {};
    const leftItems = question.pairs.map(p => p[0]);
    const rightItems = question.pairs.map(p => p[1]);

    return `
      <div class="match-container">
        <div class="match-column">
          ${leftItems.map((item, idx) => `
            <div class="match-pair ${currentMatches[idx] !== undefined ? 'match-pair--selected' : ''}"
                 onclick="LearningApp.toggleMatch(${idx})">
              ${item}
            </div>
          `).join('')}
        </div>
        <div class="match-column">
          ${rightItems.map((item, idx) => `
            <div class="match-pair" onclick="LearningApp.selectMatchRight(${idx})">
              ${item}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderResults() {
    const correct = state.userAnswers.filter((ans, idx) => {
      return checkAnswer(state.currentQuestions[idx], ans);
    }).length;

    const passed = correct === 10;
    const year = state.selectedYear;
    const subject = state.selectedSubject;
    const lesson = getYearData(year)[subject].lessons.find(
      l => l.id === state.selectedLesson
    );

    const wrongQuestionsHtml = state.currentQuestions
      .map((q, idx) => {
        const userAns = state.userAnswers[idx];
        const isCorrect = checkAnswer(q, userAns);
        if (isCorrect) return '';

        const correctAnsText = getCorrectAnswerText(q);
        const userAnsText = getUserAnswerText(q, userAns);

        return `
          <div class="results-item results-item--wrong">
            <div class="results-question">${q.q}</div>
            <div class="results-your-answer">Your answer: ${userAnsText}</div>
            <div class="results-correct-answer">Correct: ${correctAnsText}</div>
          </div>
        `;
      })
      .filter(h => h)
      .join('');

    return `
      <div class="learning-container">
        <div class="quiz-results">
          <div class="results-header">
            <h2>${passed ? '🎉 You Passed!' : '❌ Not Quite'}</h2>
            <div class="results-score">${correct}/10 Correct</div>
          </div>
          ${!passed ? `<div class="results-message">You need 10/10 to pass. Keep trying!</div>` : ''}
          ${wrongQuestionsHtml ? `
            <div class="results-wrong-section">
              <h3>Questions to Review</h3>
              ${wrongQuestionsHtml}
            </div>
          ` : ''}
          <div class="results-actions">
            ${passed ? `
              <button class="btn-primary" onclick="LearningApp.lessonComplete()">Continue</button>
            ` : `
              <button class="btn-primary" onclick="LearningApp.retryLesson()">Try Again</button>
            `}
            <button class="btn-secondary" onclick="LearningApp.goBack()">Back to Lessons</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminDashboard(adminData) {
    // Summary section
    const totalLessons = adminData.completedLessons ? Object.keys(adminData.completedLessons).length : 0;
    const totalXp = adminData.xp || 0;
    const accuracy = adminData.accuracy || 0;

    let yearBreakdownHtml = '';
    for (let year = 2; year <= 6; year++) {
      const yearData = adminData[`year${year}`];
      if (!yearData) continue;

      const lessons = yearData.lessons || {};
      const lessonDetails = Object.entries(lessons).map(([lessonId, data]) => {
        const wrongAnswersHtml = (data.wrongAnswers || []).map(w => `
          <div class="admin-wrong-answer">
            <div class="admin-wrong-q">${w.q}</div>
            <div class="admin-wrong-given">Given: ${w.userAnswer}</div>
            <div class="admin-wrong-correct">Correct: ${w.correctAnswer}</div>
          </div>
        `).join('');

        return `
          <div class="admin-lesson-detail">
            <div class="admin-lesson-header">${lessonId}</div>
            <div class="admin-lesson-meta">
              Best Score: ${data.score ? data.score.correct : 'N/A'}/10
              | Attempts: ${data.attempts || 1}
            </div>
            ${wrongAnswersHtml}
          </div>
        `;
      }).join('');

      yearBreakdownHtml += `
        <div class="admin-year-section">
          <h4>Year ${year}</h4>
          <div class="admin-lessons">
            ${lessonDetails}
          </div>
        </div>
      `;
    }

    const wrongAnswersTabHtml = adminData.allWrongAnswers ? `
      <div class="admin-wrong-answers-tab">
        <h3>All Wrong Answers</h3>
        ${Object.entries(adminData.allWrongAnswers).map(([subject, questions]) => `
          <div class="admin-subject-wrong">
            <h4>${subject}</h4>
            ${questions.map(w => `
              <div class="admin-wrong-answer">
                <div class="admin-wrong-q">${w.q}</div>
                <div class="admin-wrong-given">Given: ${w.userAnswer}</div>
                <div class="admin-wrong-correct">Correct: ${w.correctAnswer}</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="admin-dashboard">
        <button class="btn-back" onclick="LearningApp.closeAdmin()">← Close</button>

        <div class="admin-summary">
          <h2>Admin Dashboard</h2>
          <div class="admin-stats">
            <div class="admin-stat">
              <div class="admin-stat-label">Total Lessons Completed</div>
              <div class="admin-stat-value">${totalLessons}</div>
            </div>
            <div class="admin-stat">
              <div class="admin-stat-label">Total XP</div>
              <div class="admin-stat-value">${totalXp}</div>
            </div>
            <div class="admin-stat">
              <div class="admin-stat-label">Accuracy Rate</div>
              <div class="admin-stat-value">${accuracy.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div class="admin-breakdown">
          ${yearBreakdownHtml}
        </div>

        ${wrongAnswersTabHtml}
      </div>
    `;
  }

  // ============================================================================
  // ANSWER CHECKING
  // ============================================================================

  function checkAnswer(question, userAnswer) {
    if (userAnswer === null || userAnswer === undefined) return false;

    switch (question.type) {
      case 'multiple':
        return userAnswer === question.answer;
      case 'trueFalse':
        return userAnswer === question.answer;
      case 'fillBlank':
        const normalized = (userAnswer || '').trim().toLowerCase();
        const acceptAnswers = (question.accept || [question.answer]).map(a =>
          (a || '').trim().toLowerCase()
        );
        return acceptAnswers.includes(normalized);
      case 'order':
        return JSON.stringify(userAnswer) === JSON.stringify(question.answer);
      case 'match':
        return JSON.stringify(userAnswer) === JSON.stringify(
          Object.fromEntries(question.pairs.map((p, i) => [i, p[1]]))
        );
      default:
        return false;
    }
  }

  function getCorrectAnswerText(question) {
    switch (question.type) {
      case 'multiple':
        return question.options[question.answer];
      case 'trueFalse':
        return question.answer ? 'True' : 'False';
      case 'fillBlank':
        return question.answer;
      case 'order':
        return question.answer.join(' → ');
      case 'match':
        return question.pairs.map(p => `${p[0]} = ${p[1]}`).join(', ');
      default:
        return 'N/A';
    }
  }

  function getUserAnswerText(question, userAnswer) {
    switch (question.type) {
      case 'multiple':
        return userAnswer !== null ? question.options[userAnswer] : 'Not answered';
      case 'trueFalse':
        return userAnswer !== null ? (userAnswer ? 'True' : 'False') : 'Not answered';
      case 'fillBlank':
        return userAnswer || 'Not answered';
      case 'order':
        return userAnswer ? userAnswer.join(' → ') : 'Not answered';
      case 'match':
        return userAnswer ? Object.values(userAnswer).join(', ') : 'Not answered';
      default:
        return 'N/A';
    }
  }

  // ============================================================================
  // USER ACTIONS
  // ============================================================================

  function selectYear(year) {
    state.selectedYear = year;
    state.screen = 'subjectGrid';
    render();
  }

  function selectSubject(subject) {
    state.selectedSubject = subject;
    state.screen = 'lessonList';
    render();
  }

  function startLesson(lessonIndex) {
    if (isLessonLocked(state.selectedYear, state.selectedSubject, lessonIndex)) {
      return;
    }

    const year = state.selectedYear;
    const subject = state.selectedSubject;
    const lessons = getYearData(year)[subject].lessons;
    const lesson = lessons[lessonIndex];

    state.selectedLesson = lesson.id;
    state.currentQuestionIndex = 0;
    state.userAnswers = [];

    const questionPool = (lesson.questions || []).map(normalizeQuestion);
    // Shuffle and pick 10 unique questions
    const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
    state.currentQuestions = shuffled.slice(0, Math.min(10, shuffled.length));

    if (state.currentQuestions.length < 10) {
      alert('Not enough questions in this lesson.');
      return;
    }

    state.screen = 'quiz';
    render();
  }

  function selectMultipleChoice(index) {
    state.userAnswers[state.currentQuestionIndex] = index;
    document.getElementById('next-btn').style.display = 'block';
  }

  function selectTrueFalse(value) {
    state.userAnswers[state.currentQuestionIndex] = value;
    document.getElementById('next-btn').style.display = 'block';
  }

  function updateFillBlank(value) {
    state.userAnswers[state.currentQuestionIndex] = value;
    document.getElementById('next-btn').style.display = 'block';
  }

  function nextQuestion() {
    if (state.currentQuestionIndex < 9) {
      state.currentQuestionIndex++;
      render();
    } else {
      state.screen = 'results';
      render();
    }
  }

  function dragStart(event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', event.target.dataset.index);
  }

  function dragDrop(event) {
    event.preventDefault();
    const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'));
    const targetIndex = parseInt(event.target.dataset.index);
    const items = state.userAnswers[state.currentQuestionIndex] || [];
    [items[draggedIndex], items[targetIndex]] = [items[targetIndex], items[draggedIndex]];
    state.userAnswers[state.currentQuestionIndex] = items;
    render();
  }

  function toggleMatch(index) {
    const matches = state.userAnswers[state.currentQuestionIndex] || {};
    if (matches[index]) {
      delete matches[index];
    } else {
      // Simplified match logic - in real implementation would need column selection
    }
    state.userAnswers[state.currentQuestionIndex] = matches;
    render();
  }

  function selectMatchRight(index) {
    // Placeholder for match right selection
  }

  async function lessonComplete() {
    const year = state.selectedYear;
    const subject = state.selectedSubject;
    const lessonId = state.selectedLesson;
    const key = `y${year}-${lessonId}`;

    const correct = state.userAnswers.filter((ans, idx) => {
      return checkAnswer(state.currentQuestions[idx], ans);
    }).length;

    state.progress.completedLessons[key] = true;
    state.progress.scores[key] = { correct, total: 10 };
    state.progress.xp += 10;

    const wrongAnswers = state.currentQuestions
      .map((q, idx) => {
        const isCorrect = checkAnswer(q, state.userAnswers[idx]);
        return isCorrect ? null : {
          q: q.q,
          userAnswer: getUserAnswerText(q, state.userAnswers[idx]),
          correctAnswer: getCorrectAnswerText(q)
        };
      })
      .filter(w => w);

    await saveProgress(year, subject, lessonId, { correct, total: 10 }, wrongAnswers, true);

    state.screen = 'lessonList';
    state.currentQuestionIndex = 0;
    state.userAnswers = [];
    render();
  }

  function retryLesson() {
    const lesson = getYearData(state.selectedYear)[state.selectedSubject].lessons.find(
      l => l.id === state.selectedLesson
    );

    state.currentQuestionIndex = 0;
    state.userAnswers = [];

    // Normalize all questions and shuffle for a fresh set
    const questionPool = (lesson.questions || []).map(normalizeQuestion);
    const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
    state.currentQuestions = shuffled.slice(0, Math.min(10, shuffled.length));

    state.screen = 'quiz';
    render();
  }

  function abandonQuiz() {
    state.screen = 'lessonList';
    state.currentQuestionIndex = 0;
    state.userAnswers = [];
    render();
  }

  function goBack() {
    if (state.screen === 'subjectGrid') {
      state.screen = 'yearPicker';
      state.selectedYear = null;
    } else if (state.screen === 'lessonList') {
      state.screen = 'subjectGrid';
      state.selectedSubject = null;
    } else if (state.screen === 'quiz' || state.screen === 'results') {
      state.screen = 'lessonList';
      state.currentQuestionIndex = 0;
      state.userAnswers = [];
    }
    render();
  }

  async function openAdmin() {
    const pin = prompt('Enter admin PIN:');
    if (pin !== '1401') {
      alert('Incorrect PIN');
      return;
    }

    try {
      const response = await fetch('/api/admin');
      const adminData = await response.json();
      state.screen = 'admin';
      state.adminData = adminData;
      render();
    } catch (error) {
      console.error('Failed to load admin data:', error);
      alert('Failed to load admin data');
    }
  }

  function closeAdmin() {
    state.screen = 'yearPicker';
    state.selectedYear = null;
    state.selectedSubject = null;
    render();
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  function render() {
    let html = '';

    switch (state.screen) {
      case 'yearPicker':
        html = renderYearPicker();
        break;
      case 'subjectGrid':
        html = renderSubjectGrid();
        break;
      case 'lessonList':
        html = renderLessonList();
        break;
      case 'quiz':
        html = renderQuiz();
        break;
      case 'results':
        html = renderResults();
        break;
      case 'admin':
        html = renderAdminDashboard(state.adminData || {});
        break;
      default:
        html = '<p>Unknown screen</p>';
    }

    const container = document.getElementById('learning-app-root');
    if (container) {
      container.innerHTML = html;
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  window.LearningApp = {
    init: async function(rootElement) {
      initVisitorId();
      await loadProgress();
      if (typeof rootElement === 'string') {
        const el = document.getElementById(rootElement);
        if (!el) {
          console.error(`Element with id "${rootElement}" not found`);
          return;
        }
        el.id = 'learning-app-root';
      } else if (rootElement instanceof HTMLElement) {
        rootElement.id = 'learning-app-root';
      } else {
        const el = document.getElementById('learning-app-root');
        if (!el) {
          console.error('No root element provided or found');
          return;
        }
      }
      render();
    },
    selectYear,
    selectSubject,
    startLesson,
    selectMultipleChoice,
    selectTrueFalse,
    updateFillBlank,
    dragStart,
    dragDrop,
    toggleMatch,
    selectMatchRight,
    nextQuestion,
    lessonComplete,
    retryLesson,
    abandonQuiz,
    goBack,
    openAdmin,
    closeAdmin,
    getState: function() { return JSON.parse(JSON.stringify(state)); }
  };

})();
