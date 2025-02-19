document.addEventListener("DOMContentLoaded", function () {
    let clickCount = 0;
    let clickTimer = null;
    let gameActive = false;
    let score = 0;
    let timeLeft = 10;
    let timer;
    
    const titleElement = document.querySelector("h1");
    if (!titleElement) {
        console.error("No h1 element found for secret activation.");
        return;
    }
    titleElement.style.cursor = "pointer";

    titleElement.addEventListener("click", function () {
        clickCount++;
        clearTimeout(clickTimer);
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

        // Remove old game if exists
        const existingGame = document.getElementById("gameContainer");
        if (existingGame) existingGame.remove();

        // Create game container
        const gameContainer = document.createElement("div");
        gameContainer.id = "gameContainer";
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
        gameContainer.appendChild(clickButton);
        document.body.appendChild(gameContainer);
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
        let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
        leaderboard.push(score);
        leaderboard.sort((a, b) => b - a);
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
        leaderboard.forEach((score, index) => {
            message += `${index + 1}. ${score}\n`;
        });

        alert(message);
    }
});