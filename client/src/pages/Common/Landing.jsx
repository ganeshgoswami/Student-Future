import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export const Landing = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  // 1. Domain Explorer State
  const [activeDomain, setActiveDomain] = useState('web');

  const domainData = {
    web: {
      title: "Full Stack Web Assessment",
      emoji: "🌐",
      duration: "45 Minutes",
      questions: "30 MCQ Tasks",
      difficulty: "Intermediate to Advanced",
      skills: ["React functional hooks & context API", "Node.js & Express API servers", "MongoDB schemas & relationships", "CORS policy & security controls"],
      prepTip: "Focus on understanding React lifecycle state optimization, express routing middleware patterns, and database CRUD operations."
    },
    aptitude: {
      title: "Quantitative Reasoning & Logical Aptitude",
      emoji: "🧠",
      duration: "30 Minutes",
      questions: "25 Analytical Problems",
      difficulty: "All Skill Levels",
      skills: ["Computational speed math", "Visual pattern recognition", "Logical sequencing", "Data interpretation charts"],
      prepTip: "Work on pacing yourself. Practice mental math shortcuts, review geometric formulas, and manage your time strictly."
    },
    sysdesign: {
      title: "High-Scale System Architecture & DB Design",
      emoji: "📁",
      duration: "60 Minutes",
      questions: "40 Architecture Scenarios",
      difficulty: "Advanced / Expert",
      skills: ["Microservices communication protocols", "Redis caching layers", "Database sharding & replication", "Rate-limiting & security shielding"],
      prepTip: "Read up on system bottlenecks, stateful vs stateless design, horizontal scaling strategies, and rate-limiting middlewares."
    }
  };

  // 2. Interactive Stepper State
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Register & Choose",
      desc: "Register a secure student account and select from our available examination domains based on your curriculum."
    },
    {
      id: 2,
      title: "Dynamic Shuffle",
      desc: "Our engine randomized-samples questions and shuffles options. Every student gets a distinct exam setup to promote academic integrity."
    },
    {
      id: 3,
      title: "Enforced Timing",
      desc: "Complete section-level quotas. A real-time timer auto-synchronizes with secure database validation check-ins."
    },
    {
      id: 4,
      title: "Instant Credentials",
      desc: "Submit to receive instant analytics. If you pass the scoring criteria, the server instantly issues a secure PDF certificate for your portfolio."
    }
  ];

  // 3. Mini Practice Quiz State
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const quizQuestion = {
    text: "If a React application is deployed to Netlify and throws net::ERR_CONNECTION_REFUSED during login, what is the most likely cause?",
    options: [
      { id: 0, text: "The client is sending credentials over plain unencrypted HTTP." },
      { id: 1, text: "The user has inputted an invalid password form format." },
      { id: 2, text: "The Axios API base URL is hardcoded to http://localhost:5000 and the live server is unreachable." },
      { id: 3, text: "The database has run out of index space memory bandwidth." }
    ],
    correctId: 2,
    explanation: "Correct! Netlify hosts the client side statically. If the API URL is pointing to 'localhost', the user's browser attempts to connect to the backend on their local machine, which fails if the server is not running locally. Resolving this requires using dynamic environment variables like VITE_API_URL!"
  };

  const handleVerifyQuiz = () => {
    if (selectedOption !== null) {
      setQuizSubmitted(true);
    }
  };

  const handleResetQuiz = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="container py-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Hero Header Banner */}
      <div className="row justify-content-center align-items-center py-5 text-center">
        <div className="col-lg-10">
          <span className="badge mb-3 px-3 py-2 text-uppercase fw-bold" style={{ backgroundColor: 'rgba(0, 240, 255, 0.12)', border: '1px solid #00f0ff', color: '#00f0ff', letterSpacing: '2px' }}>
            ⚡ Advanced Examination Suite
          </span>
          <h1 className="display-4 fw-extrabold mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(to right, #ffffff, #00f0ff, #8c52ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(0, 240, 255, 0.1)' }}>
            Empower Your Future with Pro-Level Appraisals
          </h1>
          <p className="lead text-muted mx-auto mb-5 fs-5" style={{ maxWidth: '800px', lineHeight: '1.7' }}>
            StudentFuture is a dynamic online examination and preparation assessment portal. Experience fair, double-shuffled option pools, strict section limits, real-time leaderboard statistics, and cryptographic certificate issuance.
          </p>

          <div className="d-flex justify-content-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg px-4" style={{ backgroundColor: '#00f0ff', color: '#020105', border: 'none', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' }}>
                  Enter Dashboard
                </Link>
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" className="btn btn-outline-info btn-lg px-4" style={{ borderColor: '#00f0ff', color: '#00f0ff' }}>
                    Admin Console
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-lg px-4" style={{ backgroundColor: '#00f0ff', color: '#020105', border: 'none', fontWeight: 'bold', boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)' }}>
                  Candidate Login
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg px-4">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Domain Explorer - Details of Exams */}
      <div className="my-5 py-3">
        <h2 className="h3 text-white fw-bold mb-4 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Explore Our Specialized Assessment Categories
        </h2>
        
        {/* Domain Tabs Navigation */}
        <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
          {Object.keys(domainData).map((key) => (
            <button
              key={key}
              onClick={() => setActiveDomain(key)}
              className={`btn px-4 py-2 fw-semibold rounded-pill transition-all ${
                activeDomain === key 
                  ? 'btn-info text-black' 
                  : 'btn-outline-secondary text-white'
              }`}
              style={{
                border: activeDomain === key ? 'none' : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: activeDomain === key ? '#00f0ff' : 'transparent',
                boxShadow: activeDomain === key ? '0 0 15px rgba(0, 240, 255, 0.3)' : 'none'
              }}
            >
              <span className="me-2">{domainData[key].emoji}</span>
              {domainData[key].title}
            </button>
          ))}
        </div>

        {/* Tab Detail Panel */}
        <div className="card glass-card p-4 mx-auto" style={{ maxWidth: '900px' }}>
          <div className="row g-4 align-items-center">
            <div className="col-md-7">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="fs-2">{domainData[activeDomain].emoji}</span>
                <div>
                  <h3 className="h4 text-white fw-bold mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {domainData[activeDomain].title}
                  </h3>
                  <span className="badge bg-secondary-subtle text-white-50 small mt-1">
                    Difficulty: {domainData[activeDomain].difficulty}
                  </span>
                </div>
              </div>

              <h4 className="h6 text-info fw-semibold mb-2">Subject Matter Coverage:</h4>
              <ul className="list-unstyled mb-3">
                {domainData[activeDomain].skills.map((skill, index) => (
                  <li key={index} className="d-flex align-items-start gap-2 mb-2 text-muted">
                    <span className="text-info">✔</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-md-5 bg-opacity-25 rounded p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderLeft: '3px solid #00f0ff' }}>
              <h4 className="h6 text-white fw-bold mb-2">📋 Assessment Details</h4>
              <div className="d-flex justify-content-between mb-2 pb-2 border-bottom border-secondary-subtle">
                <span className="text-muted">Exam Duration:</span>
                <span className="fw-semibold text-white">{domainData[activeDomain].duration}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Total Questions:</span>
                <span className="fw-semibold text-white">{domainData[activeDomain].questions}</span>
              </div>
              
              <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.05)' }}>
                <span className="d-block text-info fw-bold small mb-1">💡 Preparation Recommendation:</span>
                <p className="text-muted small mb-0" style={{ lineHeight: '1.4' }}>
                  {domainData[activeDomain].prepTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Preparation Stepper Timeline */}
      <div className="my-5 py-4">
        <h2 className="h3 text-white fw-bold mb-2 text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
          The StudentFuture Prep & Exam Flow
        </h2>
        <p className="text-muted text-center mb-5 small">Select steps to explore what makes our examination portal unique.</p>

        <div className="row g-4 justify-content-center">
          {/* Stepper Timeline Nav */}
          <div className="col-lg-4 d-flex flex-column gap-3">
            {steps.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className="p-3 rounded cursor-pointer transition-all d-flex align-items-center gap-3"
                style={{
                  backgroundColor: activeStep === s.id ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.01)',
                  border: activeStep === s.id ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transform: activeStep === s.id ? 'translateX(5px)' : 'none'
                }}
              >
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: activeStep === s.id ? '#00f0ff' : 'rgba(255,255,255,0.1)',
                    color: activeStep === s.id ? '#000' : '#fff'
                  }}
                >
                  {s.id}
                </div>
                <div>
                  <h4 className={`h6 fw-bold mb-0 ${activeStep === s.id ? 'text-info' : 'text-white'}`}>
                    {s.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>

          {/* Stepper Content Viewer */}
          <div className="col-lg-6">
            <div className="card glass-card p-4 h-100 d-flex flex-column justify-content-center" style={{ minHeight: '220px' }}>
              <span className="text-info fw-bold small text-uppercase mb-2">Step {activeStep} of 4</span>
              <h3 className="h4 text-white fw-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {steps[activeStep - 1].title}
              </h3>
              <p className="text-muted mb-0 fs-6" style={{ lineHeight: '1.6' }}>
                {steps[activeStep - 1].desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Try-it-Out Mini Quiz Component */}
      <div className="my-5 py-3 mx-auto" style={{ maxWidth: '800px' }}>
        <div className="p-4 rounded border" style={{ backgroundColor: 'rgba(13, 10, 22, 0.65)', borderColor: 'rgba(0, 240, 255, 0.2)' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="fs-3">💡</span>
            <div>
              <h3 className="h5 fw-bold text-white mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Interactive Practice Demo
              </h3>
              <p className="text-muted small mb-0">Test your diagnosis skills. Select the correct answer below:</p>
            </div>
          </div>

          <div className="p-3 mb-4 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderLeft: '4px solid #8c52ff' }}>
            <p className="fw-medium text-white mb-0" style={{ fontSize: '0.95rem' }}>
              {quizQuestion.text}
            </p>
          </div>

          {/* Options Grid */}
          <div className="d-flex flex-column gap-2 mb-4">
            {quizQuestion.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrect = opt.id === quizQuestion.correctId;
              let optionStyle = {
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.1)',
                cursor: quizSubmitted ? 'default' : 'pointer'
              };

              if (isSelected && !quizSubmitted) {
                optionStyle.backgroundColor = 'rgba(0, 240, 255, 0.1)';
                optionStyle.borderColor = '#00f0ff';
              } else if (quizSubmitted) {
                if (isCorrect) {
                  optionStyle.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                  optionStyle.borderColor = '#10b981';
                } else if (isSelected && !isCorrect) {
                  optionStyle.backgroundColor = 'rgba(244, 63, 94, 0.15)';
                  optionStyle.borderColor = '#f43f5e';
                }
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => !quizSubmitted && setSelectedOption(opt.id)}
                  className="p-3 rounded border transition-all d-flex align-items-center gap-3 option-row-demo"
                  style={optionStyle}
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid',
                      borderColor: isSelected ? (quizSubmitted && !isCorrect ? '#f43f5e' : '#00f0ff') : 'rgba(255,255,255,0.3)',
                      backgroundColor: isSelected ? (quizSubmitted && !isCorrect ? '#f43f5e' : '#00f0ff') : 'transparent',
                      color: isSelected ? '#000' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.8rem'
                    }}
                  >
                    {String.fromCharCode(65 + opt.id)}
                  </div>
                  <span className="text-white-50" style={{ fontSize: '0.9rem' }}>{opt.text}</span>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="d-flex justify-content-end gap-2">
            {!quizSubmitted ? (
              <button
                onClick={handleVerifyQuiz}
                disabled={selectedOption === null}
                className="btn btn-info px-4 text-black fw-bold"
                style={{
                  backgroundColor: '#00f0ff',
                  border: 'none',
                  opacity: selectedOption === null ? 0.5 : 1
                }}
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleResetQuiz}
                className="btn btn-outline-light px-4"
              >
                Reset Demo
              </button>
            )}
          </div>

          {/* Feedback Section */}
          {quizSubmitted && (
            <div 
              className="mt-4 p-3 rounded"
              style={{
                backgroundColor: selectedOption === quizQuestion.correctId ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: '1px solid',
                borderColor: selectedOption === quizQuestion.correctId ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'
              }}
            >
              <h4 className={`h6 fw-bold mb-2 ${selectedOption === quizQuestion.correctId ? 'text-success' : 'text-danger'}`}>
                {selectedOption === quizQuestion.correctId ? '🎉 Correct Answer!' : '❌ Incorrect Attempt'}
              </h4>
              <p className="text-muted small mb-0" style={{ lineHeight: '1.5' }}>
                {quizQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feature Section Cards */}
      <div className="row mt-5 text-start g-4 justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card glass-card p-4 h-100">
            <div className="fs-1 mb-2">⚡</div>
            <h3 className="h5 fw-bold text-white">Shuffled Option Pools</h3>
            <p className="text-muted small mb-0">Protects assessment fairness. Shuffles both question sequences and choices dynamically to make exam cheat sheets obsolete.</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card glass-card p-4 h-100">
            <div className="fs-1 mb-2">📋</div>
            <h3 className="h5 fw-bold text-white">Quota Enforcements</h3>
            <p className="text-muted small mb-0">Imposes exact limits on specific optional test sections. Validated interactively in-browser and enforced securely on our backend.</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card glass-card p-4 h-100">
            <div className="fs-1 mb-2">🎓</div>
            <h3 className="h5 fw-bold text-white">Auto Certification</h3>
            <p className="text-muted small mb-0">Earn high-quality achievement PDFs as soon as you pass. Instantly downloadable and queryable via secure database route links.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
