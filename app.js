const question = document.getElementById("question");
const sendButton = document.getElementById("send");
const messages = document.getElementById("messages");
const examResult = document.getElementById("examResult");


/* =========================
   ADD CHAT MESSAGE
========================= */

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className =
        "chat-message " +
        (type || "");

    div.textContent = text;

    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;
}


/* =========================
   SEND QUESTION
========================= */

async function sendQuestion() {

    const text =
        question.value.trim();

    if (!text) {
        return;
    }

    addMessage(
        "أنت: " + text,
        "user"
    );

    question.value = "";

    sendButton.disabled = true;

    const loading = document.createElement("div");

    loading.className =
        "chat-message ai loading-message";

    loading.textContent =
        "ميس ميري بتفكر... ⏳";

    messages.appendChild(loading);

    messages.scrollTop =
        messages.scrollHeight;


    try {

        const response =
            await fetch("/api/chat", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message: text
                })
            });


        const data =
            await response.json();


        loading.remove();


        if (data.success) {

            addMessage(
                "ميس ميري: " +
                data.answer,
                "ai"
            );

        } else {

            addMessage(
                "خطأ: " +
                data.error,
                "error"
            );
        }

    } catch (error) {

        console.log(error);

        loading.remove();

        addMessage(
            "حصل خطأ في الاتصال بالسيرفر.",
            "error"
        );
    }


    sendButton.disabled = false;

    question.focus();
}


/* =========================
   SEND BUTTON
========================= */

sendButton.addEventListener(
    "click",
    sendQuestion
);


/* =========================
   ENTER
========================= */

question.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendQuestion();
        }
    }
);


/* =========================
   GENERATE EXAM
========================= */

async function generateExam(unit) {

    if (!examResult) {
        return;
    }


    examResult.innerHTML =
        '<div class="exam-loading">' +
        "⏳ ميس ميري بتجهز امتحان الوحدة " +
        unit +
        "..." +
        "</div>";


    const buttons =
        document.querySelectorAll(
            ".exam-btn"
        );


    buttons.forEach(function (button) {
        button.disabled = true;
    });


    try {

        const response =
            await fetch("/api/exam", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    unit: unit
                })
            });


        const data =
            await response.json();


        if (data.success) {

            examResult.textContent =
                data.exam;

            examResult.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } else {

            examResult.textContent =
                "خطأ: " +
                data.error;
        }


    } catch (error) {

        console.log(error);

        examResult.textContent =
            "حصل خطأ في الاتصال بالسيرفر.";
    }


    buttons.forEach(function (button) {
        button.disabled = false;
    });
}