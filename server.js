const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `
أنت ميس ميري، مدرسة علوم للصف الثالث الإعدادي في مصر.

مهمتك:
- الإجابة عن أسئلة العلوم المرتبطة بمنهج الصف الثالث الإعدادي.
- افهمي السؤال سواء بالفصحى أو العامية المصرية.
- افهمي الأخطاء الإملائية والحروف المكررة أو الناقصة.
- لا ترفضي السؤال لمجرد أنه مكتوب بالعامية.

إذا كان السؤال متعلقًا بمفهوم علمي أو كيميائي أو فيزيائي أو بيولوجي مناسب للدراسة، أجيبي عليه بشكل تعليمي مبسط.

إذا كان السؤال عن موضوع خارج العلوم، قولي:
"أنا متخصصة في علوم الصف الثالث الإعدادي فقط."

أسلوب الإجابة:
- ابدئي بالإجابة مباشرة.
- استخدمي لغة عربية بسيطة يفهمها طالب مصري.
- ممكن تستخدمي العامية المصرية البسيطة.
- الإجابة مختصرة وواضحة.
- لا تكتبي مقدمات طويلة.
- لا تخترعي معلومات.
`;

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/status", function (req, res) {
    res.json({
        success: true,
        ai: process.env.GROQ_API_KEY ? "READY" : "MISSING KEY",
        model: MODEL
    });
});

async function askGroq(messages, maxTokens) {
    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.GROQ_API_KEY
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 0.3,
                max_tokens: maxTokens
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.log("GROQ ERROR:", data);

        throw new Error(
            data.error && data.error.message
                ? data.error.message
                : "Groq Error"
        );
    }

    return data.choices[0].message.content;
}

app.post("/api/chat", async function (req, res) {
    const message = req.body.message;

    if (!message) {
        return res.status(400).json({
            success: false,
            error: "اكتب سؤالك."
        });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({
            success: false,
            error: "مفتاح Groq غير موجود."
        });
    }

    try {
        const answer = await askGroq(
            [
                {
                    role: "system",
                    content: SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: message
                }
            ],
            500
        );

        res.json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post("/api/exam", async function (req, res) {
    const unit = Number(req.body.unit);

    if (![1, 2, 3, 4].includes(unit)) {
        return res.status(400).json({
            success: false,
            error: "الوحدة غير صحيحة."
        });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({
            success: false,
            error: "مفتاح Groq غير موجود."
        });
    }

    const examPrompt = `
أنت ميس ميري، مدرسة علوم للصف الثالث الإعدادي في مصر.

أنشئي امتحانًا تدريبيًا في علوم الصف الثالث الإعدادي للوحدة رقم ${unit} فقط.

الشروط:
- 10 أسئلة.
- اختيار من متعدد.
- صح وخطأ.
- أسئلة قصيرة.
- مستوى مناسب للصف الثالث الإعدادي.
- لا تضعي أسئلة من وحدات أخرى.
- رتبي الأسئلة بأرقام واضحة.
- اكتبي الاختيارات بوضوح.
- في النهاية اكتبي نموذج الإجابة.
- ضعي الإجابات الصحيحة فقط.
- لا تكتبي مقدمة طويلة.
`;

    try {
        const exam = await askGroq(
            [
                {
                    role: "system",
                    content: examPrompt
                },
                {
                    role: "user",
                    content:
                        "ابدئي الآن بإنشاء امتحان الوحدة رقم " + unit
                }
            ],
            1800
        );

        res.json({
            success: true,
            exam: exam
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

if (require.main === module) {
    app.listen(3000, function () {
        console.log("================================");
        console.log("MISS MERRY AI");
        console.log("http://localhost:3000");

        console.log(
            "AI: " +
            (process.env.GROQ_API_KEY ? "READY" : "MISSING KEY")
        );

        console.log("MODEL: " + MODEL);
        console.log("================================");
    });
}

module.exports = app;