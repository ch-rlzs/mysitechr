document.addEventListener("DOMContentLoaded", function () {
    let clickCount = 0;
    let clickTimer = null;
    let gameActive = false;
    let score = 0;
    let timeLeft = 10;
    let timer;
    let comboCounter = 0;
    let lastClickTime = 0;
    let powerUpActive = false;

    const titleElement = document.querySelector("h1");
    if (!titleElement) {
        console.error("No h1 element found for secret activation.");
        return;
    }
    titleElement.style.cursor = "pointer";

    // Visual feedback for secret activation
    titleElement.addEventListener("click", function (e) {
        clickCount++;
        clearTimeout(clickTimer);

        // Add visual feedback
        const feedback = document.createElement("div");
        feedback.textContent = `${5 - clickCount} more clicks`;
        feedback.style.position = "absolute";
        feedback.style.left = `${e.clientX + 10}px`;
        feedback.style.top = `${e.clientY + 10}px`;
        feedback.style.color = "var(--light-blue)";
        feedback.style.fontSize = "14px";
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1000);

        if (clickCount >= 5) {
            clickCount = 0;
            showGameMenu();
        } else {
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 3000);
        }
    });

    function showGameMenu() {
        let choice = prompt(
            "Secret Game Menu:\n\n1 - Start Game\n2 - Stop Game\n3 - Restart Game\n4 - View Leaderboard"
        );

        if (choice === "1") startGame();
        else if (choice === "2") stopGame();
        else if (choice === "3") restartGame();
        else if (choice === "4") showLeaderboard();
        else alert("Invalid option. Try again.");
    }

    function startGame() {
        if (gameActive) {
            alert("Game is already running!");
            return;
        }
        gameActive = true;
        score = 0;
        timeLeft = 10;
        comboCounter = 0;
        lastClickTime = 0;

        // Remove old game if exists
        const existingGame = document.getElementById("gameContainer");
        if (existingGame) existingGame.remove();

        // Create game container
        const gameContainer = document.createElement("div");
        gameContainer.id = "gameContainer";
        gameContainer.classList.add("game-container"); // Use CSS class for styling

        const scoreText = document.createElement("p");
        scoreText.textContent = "Score: 0";
        scoreText.classList.add("game-text");

        const timeText = document.createElement("p");
        timeText.textContent = "Time: 10s";
        timeText.classList.add("game-text");

        const comboText = document.createElement("p");
        comboText.textContent = "Combo: 0x";
        comboText.classList.add("game-text");

        const clickButton = document.createElement("button");
        clickButton.textContent = "Click Me!";
        clickButton.classList.add("game-button");

        // Power-up indicator
        const powerUpText = document.createElement("p");
        powerUpText.textContent = "Power-Up: None";
        powerUpText.classList.add("game-text");

        // Click button logic
        clickButton.addEventListener("click", function () {
            const now = Date.now();
            if (now - lastClickTime < 500) { // 0.5s combo window
                comboCounter++;
            } else {
                comboCounter = 0;
            }
            lastClickTime = now;

            // Apply power-up effects
            if (powerUpActive) {
                score += 2; // Double points
            } else {
                score++;
            }

            scoreText.textContent = "Score: " + score;
            comboText.textContent = "Combo: " + comboCounter + "x";

            // Check for power-up
            if (score % 5 === 0 && !powerUpActive) {
                activatePowerUp();
            }
        });

        // Countdown Timer
        timer = setInterval(function () {
            timeLeft--;
            timeText.textContent = "Time: " + timeLeft + "s";
            if (timeLeft <= 0) {
                clearInterval(timer);
                clickButton.disabled = true;
                alert("Time's up! Your final score: " + score);
                saveScore(score);
                stopGame();
            }
        }, 1000);

        gameContainer.appendChild(scoreText);
        gameContainer.appendChild(timeText);
        gameContainer.appendChild(comboText);
        gameContainer.appendChild(powerUpText);
        gameContainer.appendChild(clickButton);
        document.body.appendChild(gameContainer);
    }

    function activatePowerUp() {
        powerUpActive = true;
        const powerUpText = document.querySelector("#gameContainer .game-text:nth-child(4)");
        powerUpText.textContent = "Power-Up: 2x Points!";
        setTimeout(() => {
            powerUpActive = false;
            powerUpText.textContent = "Power-Up: None";
        }, 3000); // Power-up lasts 3 seconds
    }

    function stopGame() {
        const gameContainer = document.getElementById("gameContainer");
        if (gameContainer) {
            gameContainer.remove();
            clearInterval(timer);
            gameActive = false;
            alert("Game stopped.");
        } else {
            alert("No game is running!");
        }
    }

    function restartGame() {
        stopGame();
        startGame();
    }

    function saveScore(score) {
        const name = prompt("Enter your name for the leaderboard:");
        const entry = {
            name: name || "Anonymous",
            score: score,
            date: new Date().toLocaleDateString()
        };

        let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 5); // Keep top 5 scores
        localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    }

    function showLeaderboard() {
        let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
        if (leaderboard.length === 0) {
            alert("No scores recorded yet!");
            return;
        }

        let message = "Leaderboard:\n";
        leaderboard.forEach((entry, index) => {
            message += `${index + 1}. ${entry.name} - ${entry.score} (${entry.date})\n`;
        });

        alert(message);
    }
});