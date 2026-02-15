
// ===== Scroll to Top Button =====
const scrollBtn = document.createElement("button");
scrollBtn.innerText = "↑";
scrollBtn.classList.add("scroll-top");
document.body.appendChild(scrollBtn);

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    scrollBtn.classList.add("visible");
  } else {
    scrollBtn.classList.remove("visible");
  }
});

scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===== CodeSprint Typing Test =====
const codeSources = {
  javascript: {
    label: "JavaScript",
    files: [
      {
        label: "React Scheduler",
        repo: "facebook/react",
        branch: "main",
        path: "packages/scheduler/src/Scheduler.js",
      },
      {
        label: "Node.js Streams",
        repo: "nodejs/node",
        branch: "main",
        path: "lib/internal/streams/writable.js",
      },
    ],
  },
  python: {
    label: "Python",
    files: [
      {
        label: "CPython AST",
        repo: "python/cpython",
        branch: "main",
        path: "Python/ast.c",
      },
      {
        label: "Django URL Resolver",
        repo: "django/django",
        branch: "main",
        path: "django/urls/resolvers.py",
      },
    ],
  },
  go: {
    label: "Go",
    files: [
      {
        label: "Go HTTP Client",
        repo: "golang/go",
        branch: "master",
        path: "src/net/http/client.go",
      },
      {
        label: "Go JSON Decoder",
        repo: "golang/go",
        branch: "master",
        path: "src/encoding/json/decode.go",
      },
    ],
  },
  rust: {
    label: "Rust",
    files: [
      {
        label: "Rust Parser",
        repo: "rust-lang/rust",
        branch: "master",
        path: "compiler/rustc_parse/src/parser/mod.rs",
      },
      {
        label: "Rust Formatter",
        repo: "rust-lang/rustfmt",
        branch: "master",
        path: "src/formatting.rs",
      },
    ],
  },
  java: {
    label: "Java",
    files: [
      {
        label: "OpenJDK Collections",
        repo: "openjdk/jdk",
        branch: "master",
        path: "src/java.base/share/classes/java/util/ArrayList.java",
      },
      {
        label: "OpenJDK Optional",
        repo: "openjdk/jdk",
        branch: "master",
        path: "src/java.base/share/classes/java/util/Optional.java",
      },
    ],
  },
};

const fallbackSnippet =
  "function greetDeveloper(name) {\n" +
  "  const message = `Hello, ${name}! Ready to sprint?`;\n" +
  "  return message.toUpperCase();\n" +
  "}\n\n" +
  "const team = [\"frontend\", \"backend\", \"ops\"];\n" +
  "team.forEach(role => {\n" +
  "  console.log(greetDeveloper(role));\n" +
  "});\n";

const MAX_SNIPPET_LENGTH = 900;
let sprintText = "";
let sprintStart = null;
let sprintTimer = null;
let activeRequestId = 0;

const languageSelect = document.getElementById("languageSelect");
const snippetSelect = document.getElementById("snippetSelect");
const loadButton = document.getElementById("loadSnippet");
const resetButton = document.getElementById("resetSprint");
const codeDisplay = document.getElementById("codeDisplay");
const codeInput = document.getElementById("codeInput");
const repoName = document.getElementById("repoName");
const filePath = document.getElementById("filePath");
const fetchStatus = document.getElementById("fetchStatus");
const wpmValue = document.getElementById("wpmValue");
const accuracyValue = document.getElementById("accuracyValue");
const progressValue = document.getElementById("progressValue");
const timeValue = document.getElementById("timeValue");

const buildRawUrl = (source) =>
  `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${source.path}`;

const trimSnippet = (text) => {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (cleaned.length <= MAX_SNIPPET_LENGTH) {
    return cleaned;
  }
  return `${cleaned.slice(0, MAX_SNIPPET_LENGTH)}\n`;
};

const setStats = ({ wpm, accuracy, progress, time }) => {
  wpmValue.textContent = wpm;
  accuracyValue.textContent = `${accuracy}%`;
  progressValue.textContent = `${progress}%`;
  timeValue.textContent = `${time}s`;
};

const resetStats = () => {
  setStats({ wpm: 0, accuracy: 100, progress: 0, time: 0 });
};

const setFetchStatus = (text, type = "") => {
  if (!fetchStatus) {
    return;
  }
  fetchStatus.textContent = text;
  fetchStatus.classList.remove("success", "warning");
  if (type) {
    fetchStatus.classList.add(type);
  }
};

const renderSnippet = (text) => {
  codeDisplay.innerHTML = "";
  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    if (index === 0) {
      span.classList.add("active");
    }
    codeDisplay.appendChild(span);
  });
};

const stopTimer = () => {
  if (sprintTimer) {
    clearInterval(sprintTimer);
    sprintTimer = null;
  }
};

const startTimer = () => {
  if (sprintTimer) {
    return;
  }
  sprintStart = Date.now();
  sprintTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sprintStart) / 1000);
    timeValue.textContent = `${elapsed}s`;
  }, 1000);
};

const updateTypingState = () => {
  const inputValue = codeInput.value;
  const characters = [...sprintText];
  let correct = 0;

  const spans = codeDisplay.querySelectorAll("span");
  spans.forEach((span, index) => {
    const typedChar = inputValue[index];
    span.classList.remove("correct", "incorrect", "active");
    if (typedChar == null) {
      if (index === inputValue.length) {
        span.classList.add("active");
      }
      return;
    }
    if (typedChar === characters[index]) {
      span.classList.add("correct");
      correct += 1;
    } else {
      span.classList.add("incorrect");
    }
  });

  const totalTyped = inputValue.length;
  const totalChars = characters.length;
  const progress = totalChars === 0 ? 0 : Math.min(100, Math.round((totalTyped / totalChars) * 100));
  const accuracy = totalTyped === 0 ? 100 : Math.max(0, Math.round((correct / totalTyped) * 100));
  const elapsedMinutes = sprintStart ? (Date.now() - sprintStart) / 60000 : 0;
  const elapsedSeconds = sprintStart ? Math.floor((Date.now() - sprintStart) / 1000) : 0;
  const wpm = elapsedMinutes > 0 ? Math.round((correct / 5) / elapsedMinutes) : 0;

  setStats({
    wpm,
    accuracy,
    progress,
    time: elapsedSeconds,
  });

  if (totalTyped >= totalChars && totalChars > 0) {
    stopTimer();
    codeInput.blur();
  }
};

const populateSelectors = () => {
  languageSelect.innerHTML = "";
  Object.entries(codeSources).forEach(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = value.label;
    languageSelect.appendChild(option);
  });
  updateSnippetOptions();
};

const updateSnippetOptions = () => {
  const selectedLanguage = languageSelect.value;
  const language = codeSources[selectedLanguage];
  snippetSelect.innerHTML = "";
  language.files.forEach((file, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = file.label;
    snippetSelect.appendChild(option);
  });
};

const loadSnippet = async () => {
  const requestId = Date.now();
  activeRequestId = requestId;
  const selectedLanguage = languageSelect.value;
  const selectedIndex = Number(snippetSelect.value);
  const selectedFile = codeSources[selectedLanguage].files[selectedIndex];
  const rawUrl = buildRawUrl(selectedFile);
  loadButton.textContent = "Loading...";
  loadButton.disabled = true;
  setFetchStatus("Loading snippet...");

  let loadedFromGithub = false;
  try {
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch snippet.");
    }
    const text = await response.text();
    sprintText = trimSnippet(text);
    loadedFromGithub = true;
  } catch (error) {
    sprintText = fallbackSnippet;
  } finally {
    if (activeRequestId !== requestId) {
      return;
    }
    loadButton.textContent = "Load Snippet";
    loadButton.disabled = false;
  }

  repoName.textContent = selectedFile.repo;
  filePath.textContent = selectedFile.path;
  codeInput.value = "";
  sprintStart = null;
  resetStats();
  stopTimer();
  renderSnippet(sprintText);
  setFetchStatus(
    loadedFromGithub ? "Loaded from GitHub" : "GitHub unavailable, loaded demo snippet",
    loadedFromGithub ? "success" : "warning"
  );
};

const resetSprint = () => {
  codeInput.value = "";
  sprintStart = null;
  resetStats();
  stopTimer();
  renderSnippet(sprintText);
};

if (languageSelect && snippetSelect) {
  populateSelectors();
  loadSnippet();

  languageSelect.addEventListener("change", () => {
    updateSnippetOptions();
    loadSnippet();
  });

  loadButton.addEventListener("click", loadSnippet);
  resetButton.addEventListener("click", resetSprint);

  codeInput.addEventListener("input", () => {
    if (!sprintText) {
      return;
    }
    if (!sprintStart) {
      startTimer();
    }
    updateTypingState();
  });

  codeInput.addEventListener("focus", () => {
    if (!sprintStart && codeInput.value.length > 0) {
      startTimer();
    }
  });
}
