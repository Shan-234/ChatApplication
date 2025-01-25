const inputText = "Hey, let's chat!";
let reply = "Sure, if you don't have an account yet, start by signing up here to start chatting!";
let inputEndIndex = 1;
let replyEndIndex = 1;

if (document.getElementById("title").textContent.indexOf("Welcome") === 0) {
    const firstName = document.getElementById("title").textContent.substring(8, document.getElementById("title").textContent.length);
    reply = "Hey, " + firstName + "! Go ahead and click on Chat on the top-right to start chatting!";
}

function WriteText() {
    let firstText = document.getElementById("first_text");
    firstText.textContent = inputText.substring(0, inputEndIndex);
}

function WriteReply() {
    const replyIntervalId = setInterval(() => {
        if (document.getElementById("title").textContent.indexOf("Welcome") === 0) {
            document.getElementById("reply_text").textContent = reply.substring(0, replyEndIndex);
        } else {
            const hereIndex = reply.indexOf("here");

            if (replyEndIndex < (hereIndex + 4)) {
                document.getElementById("reply_text").innerHTML = `
                ${reply.substring(0, replyEndIndex)}
                `;
            } else if (replyEndIndex <= reply.length) {
                document.getElementById("reply_text").innerHTML = `
                ${reply.substring(0, (hereIndex - 1))} <a href="/sign_up" class="signup-link">here</a> ${reply.substring((hereIndex + 4), replyEndIndex)}
                `;
            }
            else {
                clearInterval(replyIntervalId);
            }
        }

        replyEndIndex++;
    }, 100);
}

const inputIntervalId = setInterval(() => {
    WriteText();
    inputEndIndex++;

    if (inputEndIndex > inputText.length) {
        clearInterval(inputIntervalId);
    }
}, 100);

setTimeout(() => {
    WriteReply();
}, (inputText.length * 100) + 500);