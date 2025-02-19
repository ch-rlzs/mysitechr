document.addEventListener("DOMContentLoaded", function () {
    let clickCount = 0;
    let clickTimer = null;
    let gameActive = false;

    const titleElement = document.querySelector("h1");
    if (!titleElement) {
        console.error("No h1 element found for secret activation.");
        return;
    }
    titleElement.style.cursor = "pointer";

    titleElement.addEventListener("click", function () {
        clickCount++;
        console.log("Click count: " + clickCount);
        clearTimeout(clickTimer);
        if (clickCount >= 5) {
            clickCount = 0;
            startSecretPrompt();
        } else {
            // Reset count if 3 seconds pass between clicks
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 3000);
        }
    });

    function startSecretPrompt() {
        let userInput = prompt("Enter the secret code to unlock the game:");
        if (userInput && userInput.toLowerCase() === "chrlzs") {
            launchGame();
        } else {
            alert("Wrong code! Try again.");
        }
    }

    function launchGame() {
        if (gameActive) return;
        gameActive = true;

        // Create game container
        const gameContainer = document.createElement("div");
        gameContainer.style.position = "fixed";
        gameContainer.style.top = "50%";
        gameContainer.style.left = "50%";
        gameContainer.style.transform = "translate(-50%, -50%)";
        gameContainer.style.background = "rgba(27, 38, 59, 0.9)";
        gameContainer.style.padding = "20px";
        gameContainer.style.borderRadius = "10px";
        gameContainer.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.5)";
        gameContainer.style.textAlign = "center";
        gameContainer.style.zIndex = "1000";

        let score = 0;
        let timeLeft = 10;

        const scoreText = document.createElement("p");
        scoreText.textContent = "Score: 0";
        scoreText.style.color = "var(--off-white)";
        scoreText.style.fontSize = "18px";

        const timeText = document.createElement("p");
        timeText.textContent = "Time: 10s";
        timeText.style.color = "var(--light-blue)";
        timeText.style.fontSize = "16px";

        const clickButton = document.createElement("button");
        clickButton.textContent = "Click Me!";
        clickButton.style.padding = "10px 20px";
        clickButton.style.marginTop = "10px";
        clickButton.style.fontSize = "16px";
        clickButton.style.cursor = "pointer";
        clickButton.style.backgroundColor = "var(--steel-blue)";
        clickButton.style.color = "var(--off-white)";
        clickButton.style.border = "none";
        clickButton.style.borderRadius = "5px";
        clickButton.style.transition = "0.3s";
        clickButton.addEventListener("mouseover", () => clickButton.style.transform = "scale(1.1)");
        clickButton.addEventListener("mouseout", () => clickButton.style.transform = "scale(1)");
        clickButton.addEventListener("click", function () {
            score++;
            scoreText.textContent = "Score: " + score;
        });

        // Countdown Timer
        const timer = setInterval(function () {
            timeLeft--;
            timeText.textContent = "Time: " + timeLeft + "s";
            if (timeLeft <= 0) {
                clearInterval(timer);
                clickButton.disabled = true;
                alert("Time's up! Your final score: " + score);
                document.body.removeChild(gameContainer);
                gameActive = false;
            }
        }, 1000);

        gameContainer.appendChild(scoreText);
        gameContainer.appendChild(timeText);
        gameContainer.appendChild(clickButton);
        document.body.appendChild(gameContainer);
    }
});