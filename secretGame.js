// Ensure firebaseConfig.js is loaded before this script

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
    let playerName = "";

    const titleElement = document.querySelector("h1");
    if (!titleElement) {
        console.error("No h1 element found for secret activation.");
        return;
    }
    titleElement.style.cursor = "pointer";

    titleElement.addEventListener("click", function (e) {
        clickCount++;
        clearTimeout(clickTimer);

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
        // Remove old menu if exists
        const existingMenu = document.getElementById("gameMenu");
        if (existingMenu) existingMenu.remove();

        // Create menu container
        const menuContainer = document.createElement("div");
        menuContainer.id = "gameMenu";
        menuContainer.style.textAlign = "center";

        const startButton = createButton("Start Game", startGame);
        const stopButton = createButton("Stop Game", stopGame);
        const restartButton = createButton("Restart Game", restartGame);
        const leaderboardButton = createButton("View Leaderboard", showLeaderboard);

        menuContainer.appendChild(startButton);
        menuContainer.appendChild(stopButton);
        menuContainer.appendChild(restartButton);
        menuContainer.appendChild(leaderboardButton);

        document.body.appendChild(menuContainer);
    }

    function createButton(text, onClick) {
        const button = document.createElement("button");
        button.textContent = text;
        button.style.margin = "5px";
        button.style.padding = "10px";
        button.style.border = "none";
        button.style.background = "#415A77";
        button.style.color = "white";
        button.style.cursor = "pointer";
        button.addEventListener("click", onClick);
        return button;
    }

    function startGame() {
        if (gameActive) {
            alert("Game is already running!");
            return;
        }

        playerName = prompt("Enter your username:") || "Anonymous";
        gameActive = true;
        score = 0;
        timeLeft = 10;
        comboCounter = 0;
        lastClickTime = 0;

        const existingGame = document.getElementById("gameContainer");
        if (existingGame) existingGame.remove();

        const gameContainer = document.createElement("div");
        gameContainer.id = "gameContainer";

        const scoreText = document.createElement("p");
        scoreText.textContent = "Score: 0";

        const timeText = document.createElement("p");
        timeText.textContent = "Time: 10s";

        const comboText = document.createElement("p");
        comboText.textContent = "Combo: 0x";

        const clickButton = document.createElement("button");
        clickButton.textContent = "Click Me!";
        clickButton.addEventListener("click", function () {
            const now = Date.now();
            if (now - lastClickTime < 500) {
                comboCounter++;
            } else {
                comboCounter = 0;
            }
            lastClickTime = now;

            score += powerUpActive ? 2 : 1;
            scoreText.textContent = "Score: " + score;
            comboText.textContent = "Combo: " + comboCounter + "x";

            if (score % 5 === 0 && !powerUpActive) {
                activatePowerUp();
            }
        });

        const powerUpText = document.createElement("p");
        powerUpText.textContent = "Power-Up: None";

        timer = setInterval(function () {
            timeLeft--;
            timeText.textContent = "Time: " + timeLeft + "s";
            if (timeLeft <= 0) {
                clearInterval(timer);
                clickButton.disabled = true;
                alert(`Time's up! Your final score: ${score}`);
                saveScore(playerName, score);
                stopGame();
            }
        }, 1000);

        gameContainer.append(scoreText, timeText, comboText, powerUpText, clickButton);
        document.body.appendChild(gameContainer);
    }

    function activatePowerUp() {
        powerUpActive = true;
        const powerUpText = document.querySelector("#gameContainer p:nth-child(4)");
        powerUpText.textContent = "Power-Up: 2x Points!";
        setTimeout(() => {
            powerUpActive = false;
            powerUpText.textContent = "Power-Up: None";
        }, 3000);
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

    function saveScore(username, score) {
        database.ref("leaderboard").push({
            username: username,
            score: score
        });
    }

    function showLeaderboard() {
        const leaderboardContainer = document.createElement("div");
        leaderboardContainer.id = "leaderboard";
        leaderboardContainer.innerHTML = "<h2>Leaderboard</h2><ul id='leaderboard-list'></ul>";

        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.margin = "10px";
        closeButton.addEventListener("click", () => leaderboardContainer.remove());

        leaderboardContainer.appendChild(closeButton);
        document.body.appendChild(leaderboardContainer);

        const leaderboardList = document.getElementById("leaderboard-list");
        database.ref("leaderboard").orderByChild("score").limitToLast(5).once("value", (snapshot) => {
            leaderboardList.innerHTML = "";
            let scores = [];
            snapshot.forEach((childSnapshot) => {
                scores.push(childSnapshot.val());
            });

            scores.reverse();
            scores.forEach((entry) => {
                let li = document.createElement("li");
                li.textContent = `${entry.username}: ${entry.score}`;
                leaderboardList.appendChild(li);
            });
        });
    }
});