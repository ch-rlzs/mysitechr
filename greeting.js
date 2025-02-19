document.addEventListener("DOMContentLoaded", function () {
    const messages = {
        morning: ["Good morning! Did you sleep, or just blink?", "Rise and shine! Or just rise, that's fine too.", "Another day, another chance to Google everything."],
        afternoon: ["Good afternoon! Hope your lunch was better than my coding skills.", "Still working? I admire your persistence.", "It’s the perfect time for a nap, just saying."],
        evening: ["Good evening! Almost bedtime, or just more screen time?", "It’s getting late... but that’s a problem for future you.", "Moon’s up. Are you?"],
        night: ["Late night browsing, huh? Respect.", "The internet never sleeps, and apparently, neither do you.", "Is it too late for productivity or too early for sleep?"]
    };

    const hour = new Date().getHours();
    let timeOfDay;

    if (hour >= 5 && hour < 12) {
        timeOfDay = "morning";
    } else if (hour >= 12 && hour < 17) {
        timeOfDay = "afternoon";
    } else if (hour >= 17 && hour < 21) {
        timeOfDay = "evening";
    } else {
        timeOfDay = "night";
    }

    const randomMessage = messages[timeOfDay][Math.floor(Math.random() * messages[timeOfDay].length)];

    const greetingElement = document.createElement("h2");
    greetingElement.textContent = randomMessage;
    greetingElement.style.color = "var(--light-blue)";
    greetingElement.style.marginBottom = "10px";

    document.querySelector(".container").prepend(greetingElement);
});