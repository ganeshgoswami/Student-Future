// ==========================================================================
// FutureStudent Frontend Application Logic
// ==========================================================================

class FutureStudentApp {
  constructor() {
    this.students = [];
    this.activeStudentId = "";
    this.tests = [];
    this.currentAttempt = null;
    this.questions = [];
    this.testTemplate = null;
    
    // Exam state
    this.currentSectionId = "";
    this.currentQuestionIndex = 0; // index within active section
    this.timerInterval = null;
    this.timeRemaining = 0; // seconds
    this.totalDurationSeconds = 0;
    
    // Admin state
    this.currentAdminTab = "add-question-tab";
  }

  async init() {
    this.setupTheme();
    await this.loadStudents();
    await this.loadTests();
    await this.loadDashboardStats();
    this.showView("dashboard-view");
  }

  // ================= THEME MANAGEMENT =================
  setupTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    this.updateThemeIcon(newTheme);
  }

  updateThemeIcon(theme) {
    const icon = document.querySelector("#theme-toggle .theme-icon");
    if (icon) {
      icon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  // ================= NOTIFICATION TOASTS =================
  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.className = `toast ${type}-toast`;
    toast.innerHTML = `
      <span class="toast-symbol">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
      <span>${message}</span>
    `;
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 4000);
  }

  // ================= VIEW NAVIGATION =================
  showView(viewId) {
    // Stop exam timer if exiting exam-view
    if (viewId !== "exam-view" && this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Hide all sections, show target
    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.add("active");

    // Manage navbar state
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
    if (viewId === "dashboard-view") {
      document.getElementById("nav-dashboard")?.classList.add("active");
      this.loadDashboardStats();
    } else if (viewId === "admin-view") {
      document.getElementById("nav-admin")?.classList.add("active");
      this.showAdminTab(this.currentAdminTab);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= DATA LOADING =================
  async loadStudents() {
    try {
      const res = await fetch("/api/students");
      this.students = await res.json();
      
      const select = document.getElementById("profile-select");
      if (select) {
        select.innerHTML = this.students.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join("");
        
        // Load default active student from storage
        const savedStudent = localStorage.getItem("activeStudentId");
        if (savedStudent && this.students.some(s => s.id === savedStudent)) {
          select.value = savedStudent;
          this.activeStudentId = savedStudent;
        } else if (this.students.length > 0) {
          this.activeStudentId = this.students[0].id;
          select.value = this.activeStudentId;
        }
      }
    } catch (err) {
      console.error("Error loading students:", err);
      this.showToast("Failed to connect to backend api server.", "error");
    }
  }

  changeStudent() {
    const select = document.getElementById("profile-select");
    if (select) {
      this.activeStudentId = select.value;
      localStorage.setItem("activeStudentId", this.activeStudentId);
      this.showToast(`Switched active student to ${this.students.find(s => s.id === this.activeStudentId)?.name}`);
      this.loadDashboardStats();
    }
  }

  async loadTests() {
    try {
      const res = await fetch("/api/tests");
      this.tests = await res.json();

      // Render on dashboard
      const container = document.getElementById("tests-list");
      if (container) {
        container.innerHTML = this.tests.map(test => {
          const totalQ = test.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
          const reqQ = test.sections.reduce((sum, s) => sum + s.answerRequired, 0);
          return `
            <div class="test-item-card glass">
              <h3>${test.title}</h3>
              <p class="test-desc">${test.description}</p>
              <div class="test-metadata-row">
                <span>⏱️ ${test.durationMinutes} Minutes</span>
                <span>📋 ${test.sections.length} Sections</span>
                <span>❓ ${totalQ} Questions Offered</span>
                <span>🎯 Answer ${reqQ} Required</span>
              </div>
              <button class="btn btn-primary" onclick="app.startExam('${test.id}')">Start Test Attempt</button>
            </div>
          `;
        }).join("");
      }

      // Populate leaderboard test dropdown
      const leadSelect = document.getElementById("leaderboard-test-select");
      if (leadSelect) {
        leadSelect.innerHTML = this.tests.map(t => `<option value="${t.id}">${t.title}</option>`).join("");
      }
    } catch (err) {
      console.error("Error loading tests:", err);
    }
  }

  async loadDashboardStats() {
    try {
      const res = await fetch("/api/dashboard/stats");
      const stats = await res.json();

      // Populate dashboard statistics counters
      document.getElementById("stat-questions").textContent = stats.totalQuestions;
      document.getElementById("stat-tests").textContent = stats.totalTests;
      document.getElementById("stat-attempts").textContent = stats.totalAttempts;

      // Populate default leaderboard
      this.currentStats = stats;
      this.loadLeaderboard();
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    }
  }

  loadLeaderboard() {
    const select = document.getElementById("leaderboard-test-select");
    const tbody = document.getElementById("leaderboard-body");
    if (!select || !tbody || !this.currentStats) return;

    const testId = select.value;
    const records = this.currentStats.leaderboards[testId] || [];

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No attempts logged yet for this test. Be the first to try!</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(rec => {
      const min = Math.floor(rec.timeTaken / 60);
      const sec = rec.timeTaken % 60;
      const timeStr = `${min}m ${sec}s`;
      
      const rankClass = rec.rank <= 3 ? `rank-pill rank-${rec.rank}` : "";

      return `
        <tr>
          <td><span class="${rankClass}">${rec.rank}</span></td>
          <td><strong>${rec.studentName}</strong></td>
          <td>${rec.netMarks} / ${rec.totalPossibleMarks}</td>
          <td><strong>${rec.percentage}%</strong></td>
          <td>${timeStr}</td>
          <td><span class="status-pill status-${rec.passFail.toLowerCase()}">${rec.passFail}</span></td>
        </tr>
      `;
    }).join("");
  }

  // ================= EXAM PORTAL CORE =================
  async startExam(testId) {
    try {
      const res = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: this.activeStudentId,
          testId
        })
      });
      const attempt = await res.json();
      if (attempt.error) {
        this.showToast(attempt.error, "error");
        return;
      }
      this.showToast("Test paper generated using Random Question Engine!", "success");
      await this.loadExam(attempt.id);
    } catch (err) {
      console.error("Error starting exam:", err);
      this.showToast("Server error during test generation.", "error");
    }
  }

  async loadExam(attemptId) {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const data = await res.json();
      
      if (data.error) {
        this.showToast(data.error, "error");
        return;
      }

      this.currentAttempt = data.attempt;
      this.questions = data.questions;
      this.testTemplate = data.test;

      // Setup UI details
      document.getElementById("exam-title").textContent = this.testTemplate.title;
      document.getElementById("exam-student-name").textContent = this.currentAttempt.studentName;

      // Handle Timer setup (resilient to refreshes)
      const secondsSinceStart = Math.floor((Date.now() - new Date(this.currentAttempt.createdAt).getTime()) / 1000);
      this.totalDurationSeconds = this.testTemplate.durationMinutes * 60;
      this.timeRemaining = this.totalDurationSeconds - secondsSinceStart;

      if (this.timeRemaining <= 0) {
        this.showToast("This attempt has timed out.", "warning");
        await this.autoSubmitExam();
        return;
      }

      this.startTimer();

      // Render sidebar sections list
      this.renderSectionsList();

      // Show view
      this.showView("exam-view");

      // Select first section
      if (this.testTemplate.sections.length > 0) {
        this.selectSection(this.testTemplate.sections[0].id);
      }
    } catch (err) {
      console.error("Error loading exam:", err);
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const updateTimerUI = () => {
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.autoSubmitExam();
        return;
      }

      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      
      const clock = document.getElementById("exam-timer");
      if (clock) {
        clock.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        // Color warning as timer gets low
        if (this.timeRemaining < 120) {
          clock.style.color = "var(--danger)";
        } else {
          clock.style.color = "var(--warning)";
        }
      }

      // Update progress bar
      const fill = document.getElementById("timer-progress-bar");
      if (fill) {
        const pct = (this.timeRemaining / this.totalDurationSeconds) * 100;
        fill.style.width = `${pct}%`;
        if (pct < 15) {
          fill.style.background = "var(--danger)";
        } else {
          fill.style.background = "var(--warning)";
        }
      }

      this.timeRemaining--;
    };

    updateTimerUI();
    this.timerInterval = setInterval(updateTimerUI, 1000);
  }

  renderSectionsList() {
    const container = document.getElementById("exam-sections-list");
    if (!container || !this.testTemplate) return;

    container.innerHTML = this.testTemplate.sections.map(sec => {
      // Calculate active answers count in this section
      const sectionQuestions = this.questions.filter(q => q.sectionId === sec.id);
      let answeredCount = 0;
      sectionQuestions.forEach(sq => {
        const ans = this.currentAttempt.answers[sq.id];
        if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
          answeredCount++;
        }
      });

      const isActive = sec.id === this.currentSectionId ? "active" : "";

      return `
        <button class="section-tab ${isActive}" id="sec-tab-${sec.id}" onclick="app.selectSection('${sec.id}')">
          <span class="tab-name">${sec.name}</span>
          <span class="tab-progress">${answeredCount} of ${sec.answerRequired} answered</span>
        </button>
      `;
    }).join("");
  }

  selectSection(sectionId) {
    this.currentSectionId = sectionId;
    this.currentQuestionIndex = 0;

    // Highlight tab
    document.querySelectorAll(".section-tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById(`sec-tab-${sectionId}`)?.classList.add("active");

    this.renderQuestion();
    this.renderPalette();
  }

  getCurrentSectionQuestions() {
    return this.questions.filter(q => q.sectionId === this.currentSectionId);
  }

  renderQuestion() {
    const sectionQuestions = this.getCurrentSectionQuestions();
    const sectionConfig = this.testTemplate.sections.find(s => s.id === this.currentSectionId);

    if (sectionQuestions.length === 0) {
      document.querySelector(".exam-question-arena").innerHTML = `<p>No questions selected for this section.</p>`;
      return;
    }

    const q = sectionQuestions[this.currentQuestionIndex];
    const ansState = this.currentAttempt.answers[q.id] || { selectedOptionIds: [], visited: false };

    // Update metadata row
    document.getElementById("q-category-badge").textContent = q.category;
    document.getElementById("q-sub-badge").textContent = q.subCategory;
    
    const diffBadge = document.getElementById("q-difficulty-badge");
    diffBadge.textContent = q.difficulty;
    diffBadge.className = `badge badge-${q.difficulty.toLowerCase()}`;

    document.getElementById("q-marks-val").textContent = `+${q.marks}`;
    document.getElementById("q-neg-val").textContent = `-${q.negativeMarks || 0}`;

    // Index numbering
    document.getElementById("q-index-num").textContent = this.currentQuestionIndex + 1;
    document.getElementById("q-section-total-num").textContent = sectionQuestions.length;

    // Text & Image
    document.getElementById("question-text").textContent = q.text;
    const imgContainer = document.getElementById("question-image-container");
    const imgElement = document.getElementById("question-image");
    if (q.image) {
      imgElement.src = q.image;
      imgContainer.classList.remove("hidden");
    } else {
      imgContainer.classList.add("hidden");
    }

    // Single vs Multiple Correct labels
    const isMulti = q.type === "Multiple Correct";
    document.getElementById("q-multi-select-note").style.display = isMulti ? "inline" : "none";

    // Mark for review button state
    const btnReview = document.getElementById("btn-mark-review");
    if (btnReview) {
      if (ansState.markedForReview) {
        btnReview.classList.add("active");
        btnReview.textContent = "Marked for Review";
      } else {
        btnReview.classList.remove("active");
        btnReview.textContent = "Mark for Review";
      }
    }

    // Render Options
    const optionsGrid = document.getElementById("options-container");
    optionsGrid.innerHTML = q.options.map(opt => {
      const isSelected = ansState.selectedOptionIds.includes(opt.id);
      const selClass = isSelected ? "selected" : "";
      const multiClass = isMulti ? "multi" : "";

      return `
        <div class="option-row ${multiClass} ${selClass}" onclick="app.selectOption('${q.id}', ${opt.id})">
          <div class="option-marker"></div>
          <div class="option-text">${opt.text}</div>
        </div>
      `;
    }).join("");

    // Hide optional limits warning by default
    document.getElementById("optional-limit-warning").classList.add("hidden");

    // Track visit state in backend database immediately
    if (!ansState.visited) {
      this.saveAnswerState(q.id, { visited: true });
    }
  }

  renderPalette() {
    const sectionQuestions = this.getCurrentSectionQuestions();
    const sectionConfig = this.testTemplate.sections.find(s => s.id === this.currentSectionId);
    if (!sectionConfig) return;

    // Set answered progress text
    let answeredCount = 0;
    sectionQuestions.forEach(sq => {
      const ans = this.currentAttempt.answers[sq.id];
      if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        answeredCount++;
      }
    });
    document.getElementById("sec-answered-counter").textContent = `${answeredCount} / ${sectionConfig.answerRequired} max`;

    // Render numbers grid
    const grid = document.getElementById("palette-grid");
    grid.innerHTML = sectionQuestions.map((sq, idx) => {
      const ans = this.currentAttempt.answers[sq.id] || {};
      
      let statusClass = "not-visited";
      if (ans.visited) {
        statusClass = "skipped"; // visited but not answered
      }
      
      const hasAns = ans.selectedOptionIds && ans.selectedOptionIds.length > 0;
      if (hasAns) statusClass = "answered";
      
      if (ans.markedForReview) {
        statusClass = hasAns ? "answered-marked" : "marked";
      }

      if (!ans.visited) statusClass = "not-visited";

      const isActive = idx === this.currentQuestionIndex ? "active" : "";

      return `
        <button class="palette-btn ${statusClass} ${isActive}" onclick="app.jumpToQuestion(${idx})">
          ${idx + 1}
        </button>
      `;
    }).join("");
  }

  jumpToQuestion(index) {
    this.currentQuestionIndex = index;
    this.renderQuestion();
    this.renderPalette();
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.renderQuestion();
      this.renderPalette();
    } else {
      // Jump to previous section's last question if possible
      const sections = this.testTemplate.sections;
      const curSecIdx = sections.findIndex(s => s.id === this.currentSectionId);
      if (curSecIdx > 0) {
        const prevSec = sections[curSecIdx - 1];
        this.currentSectionId = prevSec.id;
        // Highlight tab
        document.querySelectorAll(".section-tab").forEach(tab => tab.classList.remove("active"));
        document.getElementById(`sec-tab-${prevSec.id}`)?.classList.add("active");
        
        const qCount = this.questions.filter(q => q.sectionId === prevSec.id).length;
        this.currentQuestionIndex = qCount > 0 ? qCount - 1 : 0;
        this.renderQuestion();
        this.renderPalette();
        this.renderSectionsList();
      }
    }
  }

  nextQuestion() {
    const sectionQuestions = this.getCurrentSectionQuestions();
    if (this.currentQuestionIndex < sectionQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.renderQuestion();
      this.renderPalette();
    } else {
      // Jump to next section's first question if possible
      const sections = this.testTemplate.sections;
      const curSecIdx = sections.findIndex(s => s.id === this.currentSectionId);
      if (curSecIdx < sections.length - 1) {
        const nextSec = sections[curSecIdx + 1];
        this.currentSectionId = nextSec.id;
        // Highlight tab
        document.querySelectorAll(".section-tab").forEach(tab => tab.classList.remove("active"));
        document.getElementById(`sec-tab-${nextSec.id}`)?.classList.add("active");
        
        this.currentQuestionIndex = 0;
        this.renderQuestion();
        this.renderPalette();
        this.renderSectionsList();
      } else {
        this.showToast("You are on the last question of the final section.", "info");
      }
    }
  }

  async selectOption(questionId, optionId) {
    const q = this.questions.find(item => item.id === String(questionId) || item.id === Number(questionId));
    if (!q) return;

    const ansState = this.currentAttempt.answers[q.id] || { selectedOptionIds: [] };
    const sectionConfig = this.testTemplate.sections.find(s => s.id === q.sectionId);
    
    let nextOptionIds = [...ansState.selectedOptionIds];
    const isMulti = q.type === "Multiple Correct";

    const isOptionAlreadySelected = nextOptionIds.includes(optionId);

    // Calculate current section answered count (excluding current question if currently selected)
    const sectionQuestions = this.questions.filter(item => item.sectionId === q.sectionId);
    let answeredCount = 0;
    sectionQuestions.forEach(sq => {
      const ans = this.currentAttempt.answers[sq.id];
      if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0 && sq.id !== q.id) {
        answeredCount++;
      }
    });

    if (!isOptionAlreadySelected) {
      // User is trying to select/add an option.
      // If we are already at the limit of optional questions in this section, block it!
      const currentQHasAnswer = ansState.selectedOptionIds.length > 0;
      
      if (!currentQHasAnswer && answeredCount >= sectionConfig.answerRequired) {
        // Trigger limit exceeded warning
        document.getElementById("optional-limit-warning").classList.remove("hidden");
        this.showToast(`Section Limit: You cannot answer more than ${sectionConfig.answerRequired} optional questions.`, "warning");
        return;
      }

      if (isMulti) {
        nextOptionIds.push(optionId);
      } else {
        nextOptionIds = [optionId];
      }
    } else {
      // Deselect option
      if (isMulti) {
        nextOptionIds = nextOptionIds.filter(id => id !== optionId);
      } else {
        nextOptionIds = [];
      }
    }

    // Hide limit warning if valid selection
    document.getElementById("optional-limit-warning").classList.add("hidden");

    // Save choice in local attempt state and backend database
    ansState.selectedOptionIds = nextOptionIds;
    ansState.answered = (nextOptionIds.length > 0);

    // Trigger save API
    await this.saveAnswerState(q.id, {
      selectedOptionIds: nextOptionIds,
      answered: (nextOptionIds.length > 0)
    });

    this.renderQuestion();
    this.renderPalette();
    this.renderSectionsList();
  }

  async clearAnswer() {
    const sectionQuestions = this.getCurrentSectionQuestions();
    const q = sectionQuestions[this.currentQuestionIndex];
    if (!q) return;

    const ansState = this.currentAttempt.answers[q.id];
    if (ansState && ansState.selectedOptionIds.length > 0) {
      ansState.selectedOptionIds = [];
      ansState.answered = false;

      await this.saveAnswerState(q.id, {
        selectedOptionIds: [],
        answered: false
      });

      this.renderQuestion();
      this.renderPalette();
      this.renderSectionsList();
      this.showToast("Choice cleared successfully.");
    }
  }

  async toggleMarkForReview() {
    const sectionQuestions = this.getCurrentSectionQuestions();
    const q = sectionQuestions[this.currentQuestionIndex];
    if (!q) return;

    const ansState = this.currentAttempt.answers[q.id];
    const nextMarked = !ansState.markedForReview;
    ansState.markedForReview = nextMarked;

    await this.saveAnswerState(q.id, {
      markedForReview: nextMarked
    });

    this.renderQuestion();
    this.renderPalette();
  }

  async saveAnswerState(questionId, payload) {
    // Record question time spend increments on the fly
    // Let's add 1 second for standard call, though timer updates can push details later
    const timeIncrement = 1; 

    try {
      const res = await fetch(`/api/attempts/${this.currentAttempt.id}/save-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          timeTaken: timeIncrement,
          ...payload
        })
      });
      const data = await res.json();
      if (data.success) {
        // Sync return state (useful for changed counts, etc.)
        this.currentAttempt.answers[questionId] = data.answerState;
      }
    } catch (err) {
      console.error("Error saving answer state:", err);
    }
  }

  confirmSubmit() {
    // Check if optional limit counts are correct
    let isFullyAnswering = true;
    const warningDetails = [];

    this.testTemplate.sections.forEach(sec => {
      const sectionQuestions = this.questions.filter(q => q.sectionId === sec.id);
      let answeredCount = 0;
      sectionQuestions.forEach(sq => {
        const ans = this.currentAttempt.answers[sq.id];
        if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
          answeredCount++;
        }
      });

      if (answeredCount < sec.answerRequired) {
        isFullyAnswering = false;
        warningDetails.push(`${sec.name} has only ${answeredCount} of ${sec.answerRequired} answers.`);
      }
    });

    let confirmMsg = "Are you sure you want to submit your exam attempt?";
    if (!isFullyAnswering) {
      confirmMsg += "\n\nWarning: Some sections have not reached their required answer count:\n" + warningDetails.join("\n") + "\n\nSkipped questions will score 0 marks.";
    }

    if (confirm(confirmMsg)) {
      this.submitExam();
    }
  }

  async autoSubmitExam() {
    this.showToast("Time's up! Automatically submitting your exam...", "warning");
    await this.submitExam(true);
  }

  async submitExam(isAuto = false) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Calculate time elapsed
    const elapsedSeconds = Math.floor((Date.now() - new Date(this.currentAttempt.createdAt).getTime()) / 1000);
    const timeTakenStr = Math.min(elapsedSeconds, this.totalDurationSeconds);

    try {
      const res = await fetch(`/api/attempts/${this.currentAttempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeTaken: timeTakenStr
        })
      });
      const data = await res.json();
      
      if (data.error) {
        this.showToast(data.error, "error");
        // Re-display layout to let them fix any exceeds
        this.renderQuestion();
        this.renderPalette();
        this.renderSectionsList();
        this.showView("exam-view");
        return;
      }

      this.showToast("Exam submitted successfully! Generating result scorecard...", "success");
      await this.showResults(this.currentAttempt.id);
    } catch (err) {
      console.error("Error submitting exam:", err);
      this.showToast("Connection error during submission.", "error");
    }
  }

  // ================= RESULTS DISPLAY =================
  async showResults(attemptId) {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/results`);
      const data = await res.json();
      
      if (data.error) {
        this.showToast(data.error, "error");
        return;
      }

      const att = data.attempt;
      const test = data.test;
      const qs = data.questions;
      const rankInfo = data.rankInfo;

      // Header summary
      document.getElementById("result-test-title").textContent = test.title;
      document.getElementById("result-student-name").textContent = att.studentName;

      // Scoring values
      document.getElementById("res-marks-val").textContent = att.results.netMarks;
      document.getElementById("res-possible-val").textContent = att.results.totalPossibleMarks;
      document.getElementById("res-correct-val").textContent = att.results.correct;
      document.getElementById("res-wrong-val").textContent = att.results.wrong;
      document.getElementById("res-skipped-val").textContent = att.results.skipped;
      
      document.getElementById("res-rank-val").textContent = `Rank ${rankInfo.rank} of ${rankInfo.total}`;

      // Pass/Fail badge styling
      const pfBadge = document.getElementById("res-passfail-badge");
      pfBadge.textContent = att.results.passFail;
      pfBadge.className = `pass-fail-badge ${att.results.passFail.toLowerCase()}`;

      document.getElementById("res-summary-text").textContent = att.results.resultSummary;
      
      // Formatting time taken
      const min = Math.floor(att.results.timeTaken / 60);
      const sec = att.results.timeTaken % 60;
      document.getElementById("res-time-taken").textContent = `${min} mins ${sec} secs`;
      document.getElementById("res-total-paper-questions").textContent = qs.length;

      // Animate progress circle
      const percentText = document.getElementById("result-percent-val");
      percentText.textContent = `${att.results.percentage}%`;
      
      const ring = document.getElementById("score-ring");
      if (ring) {
        const radius = ring.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (att.results.percentage / 100) * circumference;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        ring.style.strokeDashoffset = offset;
      }

      // Section-wise progress bars
      const secContainer = document.getElementById("section-optional-details");
      secContainer.innerHTML = test.sections.map(s => {
        const answered = att.results.optionalAnswerCount[s.id] || 0;
        const req = s.answerRequired;
        const pct = Math.min((answered / req) * 100, 100);
        return `
          <div class="section-progress-row">
            <div class="sec-lbl-row">
              <span><strong>${s.name}</strong></span>
              <span>Answering usage: ${answered} / ${req} (${Math.round(pct)}%)</span>
            </div>
            <div class="sec-bar-bg">
              <div class="sec-bar-fill" style="width: ${pct}%; background: ${pct === 100 ? 'var(--success)' : 'var(--primary)'}"></div>
            </div>
          </div>
        `;
      }).join("");

      // Question review accordion list
      const reviewContainer = document.getElementById("results-review-list");
      reviewContainer.innerHTML = qs.map((q, idx) => {
        const ans = att.answers[q.id] || { selectedOptionIds: [], visited: false, answerChangedCount: 0 };
        const isCorrect = isCorrectAnswer(ans.selectedOptionIds, q.correctAnswer);
        const cardBorder = isCorrect ? "border-left-success" : (ans.selectedOptionIds.length === 0 ? "border-left-warning" : "border-left-danger");

        // Options rendering for review
        const optionsHtml = q.options.map(opt => {
          const isSel = ans.selectedOptionIds.includes(opt.id);
          const isCorr = q.correctAnswer.includes(opt.id);
          
          let rowClass = "";
          let badge = "";

          if (isCorr) {
            rowClass = "correct-option";
            badge = `<span class="review-badge-indicator badge-corr">✓ Correct Option</span>`;
          } else if (isSel) {
            rowClass = "wrong-selected";
            badge = `<span class="review-badge-indicator badge-wrong">✗ Your Selection</span>`;
          }

          if (isCorr && isSel) {
            badge = `<span class="review-badge-indicator badge-corr">✓ Your Correct Selection</span>`;
          }

          return `
            <div class="review-option-row ${rowClass}">
              <span class="option-text">${opt.text}</span>
              ${badge}
            </div>
          `;
        }).join("");

        const formattedQTime = `${Math.floor(ans.timeTaken / 60)}m ${ans.timeTaken % 60}s`;

        return `
          <div class="review-item-card glass ${cardBorder}">
            <div class="review-item-header">
              <span class="badge badge-${q.difficulty.toLowerCase()}">${q.category} • ${q.difficulty}</span>
              <div class="review-stats-inline">
                <span>⏱️ Time Spent: <strong>${formattedQTime}</strong></span>
                <span>🔄 Changed Count: <strong>${ans.answerChangedCount || 0}</strong></span>
              </div>
            </div>
            <div class="review-question-text">
              <strong>Q${idx + 1}.</strong> ${q.text}
            </div>
            <div class="options-grid">
              ${optionsHtml}
            </div>
            <div class="review-explanation-pane">
              <h4>Explanation</h4>
              <p>${q.explanation || "No step-by-step solution provided."}</p>
            </div>
          </div>
        `;
      }).join("");

      this.showView("results-view");
    } catch (err) {
      console.error("Error loading results scorecard:", err);
    }
  }

  // ================= ADMIN CONTROL OPERATIONS =================
  showAdminTab(tabId) {
    this.currentAdminTab = tabId;
    document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

    // Find trigger button and activate
    const triggerBtn = Array.from(document.querySelectorAll(".admin-tab-btn")).find(b => b.onclick.toString().includes(tabId));
    if (triggerBtn) triggerBtn.classList.add("active");

    const content = document.getElementById(tabId);
    if (content) content.classList.add("active");

    if (tabId === "manage-questions-tab") {
      this.renderQuestionBank();
    }
  }

  // Toggle dynamic form attributes based on type
  toggleQuestionTypeForm() {
    const typeSelect = document.getElementById("add-q-type");
    const checkBoxes = document.querySelectorAll(".correct-checker-container input");
    
    // Clear all correct fields when toggling
    checkBoxes.forEach(cb => cb.checked = false);

    // If MCQ: change checkbox behavior to radio button emulation
    const isMCQ = typeSelect.value === "MCQ";
    checkBoxes.forEach(cb => {
      cb.type = isMCQ ? "radio" : "checkbox";
      cb.name = isMCQ ? "mcq-correct-answer" : "correct-answer-checkboxes";
    });
  }

  updateSubCategoryDropdown() {
    const category = document.getElementById("add-q-category").value;
    const subInput = document.getElementById("add-q-subcategory");
    
    // Suggest standard subcategories
    if (category === "Arithmetic") subInput.placeholder = "e.g. Profit & Loss, Percentage, Time & Work";
    else if (category === "Reasoning") subInput.placeholder = "e.g. Blood Relations, Coding & Decoding, Syllogisms";
    else if (category === "English") subInput.placeholder = "e.g. Vocabulary, Grammar, Spelling Check";
  }

  // Handle building option rows
  addOptionRow() {
    const container = document.getElementById("options-rows-container");
    const rows = container.querySelectorAll(".option-row-input-group");
    
    if (rows.length >= 5) {
      this.showToast("Maximum of 5 options allowed.", "warning");
      return;
    }

    const nextLetter = "E";
    const nextId = 5;

    const row = document.createElement("div");
    row.className = "option-row-input-group";
    row.id = `option-row-group-${nextId}`;
    
    const isMCQ = document.getElementById("add-q-type").value === "MCQ";
    const typeInput = isMCQ ? "radio" : "checkbox";
    const nameInput = isMCQ ? "mcq-correct-answer" : "correct-answer-checkboxes";

    row.innerHTML = `
      <span class="option-letter-lbl">${nextLetter}</span>
      <input type="text" class="option-text-input" placeholder="Enter option text for ${nextLetter}..." required>
      <label class="correct-checker-container">
        <input type="${typeInput}" name="${nameInput}" value="${nextId}">
        Correct?
      </label>
    `;

    container.appendChild(row);
    
    // Disable Add Button since max = 5
    document.getElementById("btn-add-option-row").disabled = true;
    document.getElementById("btn-add-option-row").textContent = "Option limit reached";
  }

  resetOptionRows() {
    const container = document.getElementById("options-rows-container");
    const isMCQ = document.getElementById("add-q-type").value === "MCQ";
    const typeInput = isMCQ ? "radio" : "checkbox";
    const nameInput = isMCQ ? "mcq-correct-answer" : "correct-answer-checkboxes";

    container.innerHTML = [
      { letter: "A", id: 1 },
      { letter: "B", id: 2 },
      { letter: "C", id: 3 },
      { letter: "D", id: 4 }
    ].map(opt => `
      <div class="option-row-input-group">
        <span class="option-letter-lbl">${opt.letter}</span>
        <input type="text" class="option-text-input" placeholder="Enter option text for ${opt.letter}..." required>
        <label class="correct-checker-container">
          <input type="${typeInput}" name="${nameInput}" value="${opt.id}">
          Correct?
        </label>
      </div>
    `).join("");

    const addBtn = document.getElementById("btn-add-option-row");
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.textContent = "+ Add Option E";
    }
  }

  async submitNewQuestion(e) {
    e.preventDefault();

    const category = document.getElementById("add-q-category").value;
    const subCategory = document.getElementById("add-q-subcategory").value;
    const difficulty = document.getElementById("add-q-difficulty").value;
    const type = document.getElementById("add-q-type").value;
    const text = document.getElementById("add-q-text").value;
    const explanation = document.getElementById("add-q-explanation").value;
    const marks = document.getElementById("add-q-marks").value;
    const negativeMarks = document.getElementById("add-q-neg-marks").value;

    // Collect options
    const optionRows = document.querySelectorAll(".option-row-input-group");
    const options = [];
    const correctAnswer = [];

    optionRows.forEach((row, index) => {
      const textVal = row.querySelector(".option-text-input").value;
      const checked = row.querySelector("input[type='checkbox'], input[type='radio']").checked;
      const optId = index + 1;

      options.push({
        id: optId,
        text: textVal
      });

      if (checked) {
        correctAnswer.push(optId);
      }
    });

    if (correctAnswer.length === 0) {
      this.showToast("You must select at least one correct option.", "error");
      return;
    }

    const payload = {
      text,
      category,
      subCategory,
      difficulty,
      type,
      options,
      correctAnswer,
      explanation,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks)
    };

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.error) {
        this.showToast(data.error, "error");
        return;
      }

      this.showToast(`Question ${data.id} created successfully!`, "success");
      
      // Reset form
      document.getElementById("add-question-form").reset();
      this.resetOptionRows();
      
      // Update global dashboard metrics
      await this.loadDashboardStats();
    } catch (err) {
      console.error("Error creating question:", err);
      this.showToast("Failed to connect to backend server.", "error");
    }
  }

  async renderQuestionBank() {
    const tbody = document.getElementById("question-bank-body");
    const categoryFilter = document.getElementById("filter-category").value;
    if (!tbody) return;

    try {
      const res = await fetch("/api/questions");
      const questions = await res.json();
      
      const filtered = categoryFilter === "All"
        ? questions
        : questions.filter(q => q.category.toLowerCase() === categoryFilter.toLowerCase());

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No questions found matching criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(q => `
        <tr>
          <td><code>${q.id}</code></td>
          <td>${q.category}</td>
          <td><span class="badge badge-${q.difficulty.toLowerCase()}">${q.difficulty}</span></td>
          <td>${q.type}</td>
          <td><span class="question-snippet" title="${q.text}">${q.text.substring(0, 75)}${q.text.length > 75 ? '...' : ''}</span></td>
          <td><strong>${q.marks}</strong> (Neg: -${q.negativeMarks || 0})</td>
        </tr>
      `).join("");
    } catch (err) {
      console.error("Error loading question bank:", err);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load questions.</td></tr>`;
    }
  }
}

// Instantiate and initialize on DOM Load
const app = new FutureStudentApp();
window.app = app;

document.addEventListener("DOMContentLoaded", () => {
  app.init();
  app.resetOptionRows();
});
