
import {
  jsQuizData,
  htmlQuizData,
  cssQuizData,
  pyQuizData,
  cppQuizData,
  javaQuizData,
  mysqlQuizData,
  mongoQuizData
} from './quiz_data.js';

const dataMap = {
  JavaScript: jsQuizData,
  HTML: htmlQuizData,
  CSS: cssQuizData,
  Python: pyQuizData,
  Cplus: cppQuizData,
  Java: javaQuizData,
  mysql: mysqlQuizData,
  mongodb: mongoQuizData
};

window.addEventListener("DOMContentLoaded", () => {
  const maincontainer = document.querySelector(".maincontainer");
  const quizcontainer = document.querySelector(".quiz-container");
  const h1 = quizcontainer.querySelector("h1");
  const labels = document.querySelectorAll(".label");
  const nextButton = document.getElementById("nextButton");
  const questionDiv = document.querySelector(".question");
  const optionList = document.querySelectorAll(".options li");
  const resultSpan = document.getElementById("score");
  const marksSpan = document.getElementById("marks");
  const marks = document.querySelector(".Points");
  const result = document.querySelector(".result");
  quizcontainer.style.display = "none";
  marks.style.display = "none";

  let currentQuestionIndex = 0;
  let currentQuizData = [];
  let mark = 0;
  labels.forEach((label) => {
    label.addEventListener("click", (e) => {
      maincontainer.style.display = "none";
      quizcontainer.style.display = "flex";
      const title = e.currentTarget.id;
      currentQuizData = dataMap[title];
      h1.textContent = title + " Quiz";
      resultSpan.textContent = "";
      currentQuestionIndex = 0;
      loadQuestion(currentQuestionIndex);
    });
  });

  function loadQuestion(index) {
    const current = currentQuizData[index];
    if (!current) {
      questionDiv.textContent = "Quiz Finished!";
      optionList.forEach((opt) => opt.style.display = "none");
      nextButton.style.display = "none";
      result.style.display = "none";
      marks.style.display = "block";
      marks.style.color = "greenyellow";
      marksSpan.textContent = `${mark} / ${currentQuizData.length}`;
      return;
    }

    questionDiv.textContent = current.question;
    optionList.forEach((li, i) => {
      li.textContent = current.options[i];
      li.style.display = "list-item";
      li.style.pointerEvents = "auto";
      li.style.backgroundColor = ""; 
      li.onclick = () => {
        optionList.forEach(option => {
          option.style.pointerEvents = "none";
        });
        if (current.answer === li.textContent) {
          resultSpan.textContent = "Correct!";
          resultSpan.style.color = "green";
          mark++;
        } else {
          resultSpan.textContent = "Wrong!";
          const res = document.getElementById("score");
          resultSpan.style.color = "red";
        }
        optionList.forEach(option => {
          if (option.textContent === current.answer) {
            option.style.backgroundColor = "#76e790ff"; // light green
          }
        });

        // Optional: highlight selected wrong answer
        if (li.textContent !== current.answer) {
          li.style.backgroundColor = "#ee707bff"; // light red
        }
      };
    });
  }

  nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    resultSpan.textContent = "";
    loadQuestion(currentQuestionIndex);
  });

  window.addEventListener("load", () => {
    setTimeout(() => {
      document.querySelector(".Loader").style.display = "none";
      document.querySelector(".Loader2").style.display = "flex";

      setTimeout(() => {
        document.querySelector(".Loader2").style.display = "none";
        document.querySelector(".main-page").style.display = "flex";
      }, 2000);
    }, 2000);
  });
});
