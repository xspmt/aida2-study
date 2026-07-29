const STORAGE_KEY = "aida2-study-state-v1";

const defaultState = {
  completedChapters: [],
  miniQuizScores: {},
  examAnswers: {},
  examStarted: false,
  examSubmitted: false,
  examResult: null,
  bestScore: 0,
  lastChapter: 1
};

let state = loadState();
let currentView = "dashboard";
let currentChapter = state.lastChapter || 1;
let toastTimer;

const els = {
  dashboard: document.getElementById("dashboardView"),
  learn: document.getElementById("learnView"),
  exam: document.getElementById("examView"),
  search: document.getElementById("searchView"),
  chapterNav: document.getElementById("chapterNav"),
  overallPercent: document.getElementById("overallPercent"),
  overallBar: document.getElementById("overallBar"),
  title: document.getElementById("viewTitle"),
  eyebrow: document.getElementById("viewEyebrow"),
  searchInput: document.getElementById("searchInput"),
  resetButton: document.getElementById("resetButton"),
  menuButton: document.getElementById("menuButton"),
  sidebar: document.getElementById("sidebar"),
  scrim: document.getElementById("mobileScrim"),
  toast: document.getElementById("toast")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {...defaultState, ...saved};
  } catch {
    return {...defaultState};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateProgressUI();
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function overallProgress() {
  const chapterPart = state.completedChapters.length / courseData.length * 70;
  const examPart = state.examSubmitted ? 30 : 0;
  return Math.round(chapterPart + examPart);
}

function updateProgressUI() {
  const percent = overallProgress();
  els.overallPercent.textContent = `${percent}%`;
  els.overallBar.style.width = `${percent}%`;
  renderChapterNav();
}

function renderChapterNav() {
  els.chapterNav.innerHTML = courseData.map(chapter => {
    const done = state.completedChapters.includes(chapter.id);
    return `
      <button class="chapter-link ${currentView === "learn" && currentChapter === chapter.id ? "active" : ""}" data-chapter="${chapter.id}">
        <span class="num">${String(chapter.id).padStart(2,"0")}</span>
        <span>${chapter.title}</span>
        <span class="done">${done ? "✓" : ""}</span>
      </button>`;
  }).join("");
}

function setView(view, options = {}) {
  currentView = view;
  document.querySelectorAll(".view").forEach(node => node.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(node => node.classList.toggle("active", node.dataset.view === view));

  if (view === "dashboard") {
    els.dashboard.classList.add("active");
    els.eyebrow.textContent = "AIDA2 · 自由潜水员";
    els.title.textContent = "考前学习总览";
    renderDashboard();
  } else if (view === "learn") {
    if (options.chapter) currentChapter = Number(options.chapter);
    state.lastChapter = currentChapter;
    saveState();
    els.learn.classList.add("active");
    const chapter = courseData.find(item => item.id === currentChapter);
    els.eyebrow.textContent = `章节 ${String(chapter.id).padStart(2,"0")} · ${chapter.duration}`;
    els.title.textContent = chapter.title;
    renderLearn(chapter);
  } else if (view === "exam") {
    els.exam.classList.add("active");
    els.eyebrow.textContent = "A 卷 · 33 题 · 100 分";
    els.title.textContent = "AIDA2 模拟考试";
    renderExam();
  } else if (view === "search") {
    els.search.classList.add("active");
    els.eyebrow.textContent = "课程知识检索";
    els.title.textContent = "搜索结果";
  }

  renderChapterNav();
  closeMobileMenu();
  if (!options.keepScroll) window.scrollTo({top: 0, behavior: "smooth"});
}

function renderDashboard() {
  const completed = state.completedChapters.length;
  const nextChapter = courseData.find(c => !state.completedChapters.includes(c.id)) || courseData[9];
  const best = state.bestScore || 0;
  const readiness = Math.min(100, Math.round(completed / 10 * 65 + (best / 100) * 35));

  els.dashboard.innerHTML = `
    <div class="dashboard-intro">
      <div class="intro-copy">
        <p class="kicker">下周考试 · 先安全，再成绩</p>
        <h2>把 111 页手册，变成一条清楚的复习路线。</h2>
        <p>按章节学习完整理论，完成每章随堂检查，最后用原始 33 题 A 卷检验。进度会自动保存在当前浏览器。</p>
        <div class="intro-actions">
          <button class="primary-button" data-action="continue" data-chapter="${nextChapter.id}">继续学习：第 ${nextChapter.id} 章</button>
          <button class="secondary-button" data-action="open-exam">${state.examStarted ? "继续模拟考试" : "查看模拟考试"}</button>
        </div>
      </div>
      <div class="exam-meter">
        <div>
          <span class="meter-label">当前备考完成度</span>
          <div class="score">${readiness}<small>%</small></div>
          <p>${readiness >= 80 ? "基础已经扎实，重点复盘错题与救援顺序。" : "优先完成第 7、3、4、5 章，再进入整卷考试。"}</p>
        </div>
        <div class="tiny">考试目标线：75 分 · 安全流程必须熟练</div>
      </div>
    </div>

    <div class="metric-row">
      <div class="metric"><span>已完成章节</span><strong>${completed}/10</strong></div>
      <div class="metric"><span>课程知识点</span><strong>10 章</strong></div>
      <div class="metric"><span>模拟卷题目</span><strong>33 题</strong></div>
      <div class="metric"><span>历史最好成绩</span><strong>${best}/100</strong></div>
    </div>

    <div class="section-heading"><div><h2>考前优先级</h2><p>按试卷分值和安全重要性排序</p></div></div>
    <div class="priority-grid">
      <article class="priority-item"><span class="rank">PRIORITY 01</span><h3>安全机制与救援</h3><p>LMC、BO、SAFE、BTT、潜伴危险信号和降低风险，是整张卷最密集的部分。</p></article>
      <article class="priority-item"><span class="rank">PRIORITY 02</span><h3>呼吸生理与超呼吸</h3><p>弄清 O2、CO2、横膈膜抽动、超呼吸风险和恢复呼吸，避免概念题丢分。</p></article>
      <article class="priority-item"><span class="rank">PRIORITY 03</span><h3>压力平衡与装备</h3><p>背熟波义耳定律、三个主动平衡空腔、法兰佐和装备选择原则。</p></article>
    </div>

    <div class="section-heading"><div><h2>全部章节</h2><p>建议按顺序学习，时间紧时先做第 3-8 章</p></div></div>
    <div class="chapter-grid">
      ${courseData.map(chapter => chapterCard(chapter)).join("")}
    </div>`;
}

function chapterCard(chapter) {
  const done = state.completedChapters.includes(chapter.id);
  return `
    <button class="chapter-card" data-action="chapter" data-chapter="${chapter.id}">
      <span class="chapter-number">${String(chapter.id).padStart(2,"0")}</span>
      <span><h3>${chapter.title}</h3><p>${chapter.subtitle} · ${chapter.duration}</p></span>
      <span class="status-pill ${done ? "done" : ""}">${done ? "已完成" : "未完成"}</span>
    </button>`;
}

function renderLearn(chapter) {
  const done = state.completedChapters.includes(chapter.id);
  els.learn.innerHTML = `
    <div class="chapter-header">
      <div>
        <span class="chapter-kicker">CHAPTER ${String(chapter.id).padStart(2,"0")}</span>
        <h2>${chapter.title}</h2>
        <p>${chapter.summary}</p>
      </div>
      <button class="${done ? "secondary-button" : "primary-button"} chapter-complete" data-action="complete-chapter" data-chapter="${chapter.id}">${done ? "✓ 已完成本章" : "标记本章完成"}</button>
    </div>

    <div class="fact-strip">
      ${chapter.keyFacts.map(([value,label]) => `<div class="fact"><strong>${value}</strong><span>${label}</span></div>`).join("")}
    </div>

    <div class="study-layout">
      <div class="lesson-content">
        ${chapter.sections.map((section, index) => `
          <article class="lesson-section" id="lesson-${chapter.id}-${index}">
            <h3>${index + 1}. ${section.title}</h3>
            ${section.body ? `<p>${section.body}</p>` : ""}
            ${section.bullets ? `<ul>${section.bullets.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}
            ${section.callout ? `<div class="callout ${section.calloutType || ""}">${section.callout}</div>` : ""}
          </article>`).join("")}

        <div class="mini-quiz" id="miniQuiz">
          <h3>本章随堂检查</h3>
          <p>全部答完后检查结果。它不计入最终模拟卷。</p>
          ${chapter.check.map((item, qIndex) => `
            <fieldset class="mini-question">
              <legend>${qIndex + 1}. ${item.q}</legend>
              ${item.options.map((option, optionIndex) => `<label><input type="radio" name="mini-${chapter.id}-${qIndex}" value="${optionIndex}"> ${option}</label>`).join("")}
            </fieldset>`).join("")}
          <button class="secondary-button" data-action="check-mini" data-chapter="${chapter.id}">检查本章答案</button>
          <div class="quiz-feedback" id="miniFeedback"></div>
        </div>

        <div class="exam-submit-row">
          ${chapter.id > 1 ? `<button class="secondary-button" data-action="chapter" data-chapter="${chapter.id - 1}">上一章</button>` : ""}
          ${chapter.id < 10 ? `<button class="primary-button" data-action="next-chapter" data-chapter="${chapter.id}">完成并进入下一章</button>` : `<button class="primary-button" data-action="finish-course">完成课程并进入考试</button>`}
        </div>
      </div>

      <aside class="study-aside">
        <div class="aside-panel">
          <h3>本章目录</h3>
          <ol>${chapter.sections.map((section, index) => `<li><a href="#lesson-${chapter.id}-${index}">${section.title}</a></li>`).join("")}</ol>
        </div>
        <div class="aside-panel">
          <h3>复习提醒</h3>
          <ul>
            <li>先理解因果，再记术语。</li>
            <li>安全流程要能按顺序口述。</li>
            <li>所有水中闭气必须有合格潜伴。</li>
          </ul>
        </div>
      </aside>
    </div>`;
}

function markChapterComplete(chapterId, complete = true) {
  const set = new Set(state.completedChapters);
  if (complete) set.add(chapterId); else set.delete(chapterId);
  state.completedChapters = [...set].sort((a,b) => a-b);
  saveState();
}

function checkMiniQuiz(chapterId) {
  const chapter = courseData.find(c => c.id === chapterId);
  let correct = 0;
  chapter.check.forEach((item, qIndex) => {
    const selected = document.querySelector(`input[name="mini-${chapterId}-${qIndex}"]:checked`);
    if (selected && Number(selected.value) === item.answer) correct++;
  });
  state.miniQuizScores[chapterId] = correct;
  saveState();
  const feedback = document.getElementById("miniFeedback");
  feedback.textContent = `答对 ${correct}/${chapter.check.length} 题。${correct === chapter.check.length ? "本章关键概念已掌握。" : "回到上方复习后再试一次。"}`;
  feedback.classList.add("show");
  if (correct === chapter.check.length) {
    markChapterComplete(chapterId, true);
    const completeButton = document.querySelector(".chapter-complete");
    if (completeButton) {
      completeButton.textContent = "✓ 已完成本章";
      completeButton.classList.remove("primary-button");
      completeButton.classList.add("secondary-button");
    }
  }
}

function renderExam() {
  if (!state.examStarted) {
    renderExamStart();
  } else if (state.examSubmitted && state.examResult) {
    renderExamResults();
  } else {
    renderExamSheet();
  }
}

function renderExamStart() {
  els.exam.innerHTML = `
    <div class="exam-start">
      <p class="eyebrow">FINAL CHECK</p>
      <h2>AIDA2 自由潜水员考核 A</h2>
      <p>试题来自你提供的原始 A 卷。客观题精确判分，列举题按教材关键词给分；教练在正式考试中可能根据答案完整度人工调整。</p>
      <div class="exam-rules">
        <div class="exam-rule"><strong>33</strong><span>题目数量</span></div>
        <div class="exam-rule"><strong>100</strong><span>试卷总分</span></div>
        <div class="exam-rule"><strong>75</strong><span>建议目标线</span></div>
      </div>
      <div class="callout">考试不会替代教练的现场教学。救援动作、耳压和潜伴机制必须在合格教练监督下练习。</div>
      <button class="primary-button" data-action="start-exam">开始模拟考试</button>
    </div>`;
}

function answeredCount() {
  return examQuestions.filter(q => {
    const value = state.examAnswers[q.id];
    if (Array.isArray(value)) return value.some(item => String(item).trim() !== "");
    if (value && typeof value === "object") return Object.values(value).some(Boolean);
    return value !== undefined && value !== null && String(value).trim() !== "";
  }).length;
}

function renderExamSheet() {
  const answered = answeredCount();
  els.exam.innerHTML = `
    <div class="exam-toolbar">
      <span id="answeredLabel">已答 ${answered}/33</span>
      <div class="progress-track"><i id="examProgressBar" style="width:${answered / 33 * 100}%"></i></div>
      <button class="quiet-button" data-action="save-exam">保存</button>
    </div>
    <form class="question-sheet" id="examForm">
      ${examQuestions.map(renderQuestion).join("")}
      <div class="exam-submit-row">
        <button type="button" class="secondary-button" data-action="save-exam">保存稍后继续</button>
        <button type="button" class="primary-button" data-action="submit-exam">提交并判分</button>
      </div>
    </form>`;
}

function renderQuestion(question) {
  const saved = state.examAnswers[question.id];
  let control = "";
  if (question.type === "single" || question.type === "multi") {
    const savedArray = Array.isArray(saved) ? saved.map(Number) : [];
    control = question.options.map((option, index) => `
      <label class="option">
        <input type="${question.type === "single" ? "radio" : "checkbox"}" name="q-${question.id}" value="${index}" ${savedArray.includes(index) ? "checked" : ""}>
        <span>${String.fromCharCode(65 + index)}. ${option}</span>
      </label>`).join("");
  } else if (question.type === "keywords") {
    control = `<textarea class="text-answer" name="q-${question.id}" placeholder="${question.placeholder || "输入答案"}">${escapeHtml(saved || "")}</textarea>`;
  } else if (question.type === "blanks") {
    const values = Array.isArray(saved) ? saved : [];
    control = `<div class="blank-row">${question.labels.map((label,index) => `<input class="blank-input" name="q-${question.id}-${index}" placeholder="${label}" value="${escapeAttribute(values[index] || "")}">`).join("")}</div>`;
  } else if (question.type === "order") {
    control = `<div class="callout note">${question.options.join("；")}</div><input class="blank-input" name="q-${question.id}" placeholder="${question.placeholder}" value="${escapeAttribute(saved || "")}">`;
  } else if (question.type === "matching") {
    const values = Array.isArray(saved) ? saved.map(Number) : [];
    control = `<div class="matching-grid">${question.pairs.map((pair,index) => `
      <div class="matching-row">
        <label for="q-${question.id}-${index}">${pair}</label>
        <select class="match-select" id="q-${question.id}-${index}" name="q-${question.id}-${index}">
          <option value="">请选择</option>
          ${question.choices.map((choice,choiceIndex) => `<option value="${choiceIndex}" ${values[index] === choiceIndex ? "selected" : ""}>${choice}</option>`).join("")}
        </select>
      </div>`).join("")}</div>`;
  }

  return `
    <section class="question-block" id="question-${question.id}">
      <div class="question-meta"><span>问题 ${question.id}</span><span>${question.points} 分 · ${questionTypeLabel(question.type)}</span></div>
      <h3>${question.q}</h3>
      ${control}
    </section>`;
}

function questionTypeLabel(type) {
  return ({single:"单选", multi:"多选", keywords:"列举", blanks:"填空", order:"排序", matching:"匹配"})[type];
}

function collectExamAnswers() {
  examQuestions.forEach(question => {
    if (question.type === "single" || question.type === "multi") {
      state.examAnswers[question.id] = [...document.querySelectorAll(`[name="q-${question.id}"]:checked`)].map(input => Number(input.value));
    } else if (question.type === "keywords" || question.type === "order") {
      state.examAnswers[question.id] = document.querySelector(`[name="q-${question.id}"]`)?.value.trim() || "";
    } else if (question.type === "blanks" || question.type === "matching") {
      state.examAnswers[question.id] = question.type === "blanks"
        ? question.labels.map((_,i) => document.querySelector(`[name="q-${question.id}-${i}"]`)?.value.trim() || "")
        : question.pairs.map((_,i) => {
            const value = document.querySelector(`[name="q-${question.id}-${i}"]`)?.value;
            return value === "" || value === undefined ? "" : Number(value);
          });
    }
  });
  saveState();
  updateExamAnswerProgress();
}

function updateExamAnswerProgress() {
  const answered = answeredCount();
  const label = document.getElementById("answeredLabel");
  const bar = document.getElementById("examProgressBar");
  if (label) label.textContent = `已答 ${answered}/33`;
  if (bar) bar.style.width = `${answered / 33 * 100}%`;
}

function arraysEqual(a, b) {
  const aa = [...a].map(Number).sort((x,y) => x-y);
  const bb = [...b].map(Number).sort((x,y) => x-y);
  return aa.length === bb.length && aa.every((value,index) => value === bb[index]);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").replace(/[，。；、,;：:\-—_]/g, "");
}

function gradeQuestion(question, answer) {
  if (question.type === "single" || question.type === "multi") {
    const correct = arraysEqual(Array.isArray(answer) ? answer : [], question.answer);
    return {earned: correct ? question.points : 0, correct};
  }

  if (question.type === "blanks") {
    const values = Array.isArray(answer) ? answer.map(normalizeText) : [];
    let matched = 0;
    if (question.unordered) {
      const used = new Set();
      question.accepted.forEach(group => {
        const index = values.findIndex((value,i) => !used.has(i) && group.some(term => value.includes(normalizeText(term))));
        if (index >= 0) { matched++; used.add(index); }
      });
    } else {
      question.accepted.forEach((group,index) => {
        if (group.some(term => values[index]?.includes(normalizeText(term)))) matched++;
      });
    }
    const earned = Math.round(question.points * matched / question.accepted.length * 10) / 10;
    return {earned, correct: matched === question.accepted.length};
  }

  if (question.type === "keywords") {
    const text = normalizeText(answer);
    const matched = question.groups.filter(group => group.some(term => text.includes(normalizeText(term)))).length;
    const count = Math.min(matched, question.need);
    const earned = Math.round(question.points * count / question.need * 10) / 10;
    return {earned, correct: count >= question.need};
  }

  if (question.type === "order") {
    const normalized = String(answer || "").toUpperCase().replace(/[^A-Z]/g, "");
    const target = question.answer.replace(/[^A-Z]/g, "");
    const correct = normalized === target;
    return {earned: correct ? question.points : 0, correct};
  }

  if (question.type === "matching") {
    const values = Array.isArray(answer) ? answer.map(value => value === "" || value === null || value === undefined ? NaN : Number(value)) : [];
    const matched = question.answer.filter((value,index) => values[index] === value).length;
    const earned = Math.round(question.points * matched / question.answer.length * 10) / 10;
    return {earned, correct: matched === question.answer.length};
  }

  return {earned: 0, correct: false};
}

function submitExam() {
  collectExamAnswers();
  const unanswered = 33 - answeredCount();
  if (unanswered > 0 && !window.confirm(`还有 ${unanswered} 题未作答，确定提交吗？`)) return;

  const details = examQuestions.map(question => ({
    id: question.id,
    ...gradeQuestion(question, state.examAnswers[question.id])
  }));
  const score = Math.round(details.reduce((sum,item) => sum + item.earned, 0) * 10) / 10;
  state.examResult = {score, details, submittedAt: new Date().toISOString()};
  state.examSubmitted = true;
  state.bestScore = Math.max(Number(state.bestScore || 0), score);
  saveState();
  renderExamResults();
  window.scrollTo({top: 0, behavior: "smooth"});
}

function renderExamResults() {
  const {score, details} = state.examResult;
  const passed = score >= 75;
  const incorrect = details.filter(item => !item.correct).length;
  els.exam.innerHTML = `
    <div class="result-banner">
      <div class="result-score">${score}</div>
      <div class="result-copy"><h2>${passed ? "达到建议目标线" : "还需要一轮复习"}</h2><p>${incorrect === 0 ? "全部题目答对。" : `有 ${incorrect} 题未得满分，下面已标出并给出教材要点。`}</p></div>
      <button class="secondary-button" data-action="retry-exam">重新考试</button>
    </div>
    <div class="question-sheet">
      ${examQuestions.map(question => renderReviewedQuestion(question, details.find(item => item.id === question.id))).join("")}
    </div>`;
}

function renderReviewedQuestion(question, result) {
  return `
    <section class="question-block ${result.correct ? "correct" : "incorrect"}" id="review-${question.id}">
      <div class="question-meta"><span>问题 ${question.id}</span><span>${result.earned}/${question.points} 分</span></div>
      <h3>${question.q}</h3>
      <div class="answer-review show"><strong>${result.correct ? "回答正确" : "需要复习"}</strong><br>${question.explain}</div>
    </section>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;"})[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function renderSearch(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    setView("dashboard");
    return;
  }
  const results = [];
  courseData.forEach(chapter => {
    chapter.sections.forEach((section,index) => {
      const haystack = [chapter.title, chapter.subtitle, section.title, section.body, ...(section.bullets || [])].join(" ").toLowerCase();
      if (haystack.includes(normalized)) {
        const excerpt = section.body || section.bullets?.slice(0,2).join("；") || chapter.summary;
        results.push({chapter, section, sectionIndex:index, excerpt});
      }
    });
  });
  currentView = "search";
  document.querySelectorAll(".view").forEach(node => node.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(node => node.classList.remove("active"));
  els.search.classList.add("active");
  els.eyebrow.textContent = "课程知识检索";
  els.title.textContent = `搜索：${query}`;
  els.search.innerHTML = `<div class="search-results"><h2>找到 ${results.length} 个相关知识点</h2>${results.length ? results.map(result => `
    <button class="search-result" data-action="search-result" data-chapter="${result.chapter.id}" data-anchor="lesson-${result.chapter.id}-${result.sectionIndex}">
      <small>第 ${result.chapter.id} 章 · ${result.chapter.title}</small>
      <h3>${result.section.title}</h3>
      <p>${result.excerpt}</p>
    </button>`).join("") : `<div class="callout note">没有找到完全匹配。试试“耳压”“恢复呼吸”“超呼吸”“BO”或“配重”。</div>`}</div>`;
  window.scrollTo({top:0, behavior:"smooth"});
}

function startExam() {
  state.examStarted = true;
  state.examSubmitted = false;
  state.examResult = null;
  saveState();
  renderExamSheet();
}

function retryExam() {
  state.examStarted = true;
  state.examSubmitted = false;
  state.examResult = null;
  state.examAnswers = {};
  saveState();
  renderExamSheet();
  window.scrollTo({top:0, behavior:"smooth"});
}

function openMobileMenu() {
  els.sidebar.classList.add("open");
  els.scrim.classList.add("show");
}

function closeMobileMenu() {
  els.sidebar.classList.remove("open");
  els.scrim.classList.remove("show");
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view]");
  if (nav) {
    setView(nav.dataset.view);
    return;
  }
  const chapterLink = event.target.closest("[data-chapter].chapter-link");
  if (chapterLink) {
    setView("learn", {chapter: chapterLink.dataset.chapter});
    return;
  }
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;
  const action = actionNode.dataset.action;
  const chapterId = Number(actionNode.dataset.chapter);

  if (action === "continue" || action === "chapter") setView("learn", {chapter:chapterId});
  if (action === "open-exam") setView("exam");
  if (action === "complete-chapter") {
    const done = state.completedChapters.includes(chapterId);
    markChapterComplete(chapterId, !done);
    renderLearn(courseData.find(c => c.id === chapterId));
    showToast(done ? "已取消完成标记" : "本章已完成");
  }
  if (action === "check-mini") checkMiniQuiz(chapterId);
  if (action === "next-chapter") {
    markChapterComplete(chapterId, true);
    setView("learn", {chapter:chapterId + 1});
  }
  if (action === "finish-course") {
    markChapterComplete(10, true);
    setView("exam");
  }
  if (action === "start-exam") startExam();
  if (action === "save-exam") { collectExamAnswers(); showToast("答题进度已保存"); }
  if (action === "submit-exam") submitExam();
  if (action === "retry-exam") retryExam();
  if (action === "search-result") {
    const anchor = actionNode.dataset.anchor;
    setView("learn", {chapter:chapterId});
    setTimeout(() => document.getElementById(anchor)?.scrollIntoView({behavior:"smooth"}), 80);
  }
});

document.addEventListener("input", event => {
  if (event.target.closest("#examForm")) {
    clearTimeout(document.examSaveTimer);
    document.examSaveTimer = setTimeout(collectExamAnswers, 300);
  }
});

els.searchInput.addEventListener("input", event => {
  clearTimeout(els.searchInput.searchTimer);
  els.searchInput.searchTimer = setTimeout(() => renderSearch(event.target.value), 220);
});

els.resetButton.addEventListener("click", () => {
  if (!window.confirm("确定清空章节进度、随堂测验和考试记录吗？")) return;
  state = {...defaultState, completedChapters:[], miniQuizScores:{}, examAnswers:{}};
  saveState();
  setView("dashboard");
  showToast("学习进度已重置");
});

els.menuButton.addEventListener("click", openMobileMenu);
els.scrim.addEventListener("click", closeMobileMenu);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileMenu();
});

renderChapterNav();
updateProgressUI();
setView("dashboard", {keepScroll:true});
