document.addEventListener("DOMContentLoaded", function () {
    const chrlzsElement = document.getElementById("chrlzs");
    const searchBarContainer = document.getElementById("searchBarContainer");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const hamburger = document.querySelector(".hamburger");
    const dropdownContent = document.querySelector(".dropdown-content");

    // Toggle search bar when clicking "Chrlzs"
    chrlzsElement.addEventListener("click", function () {
        searchBarContainer.style.display = searchBarContainer.style.display === "block" ? "none" : "block";
    });

    // Toggle hamburger menu
    hamburger.addEventListener("click", function () {
        dropdownContent.classList.toggle("active");
        hamburger.classList.toggle("active");
    });

    // Handle search button click
    searchButton.addEventListener("click", function () {
        let url = searchInput.value.trim();
        if (!url) {
            alert("Please enter a URL.");
            return;
        }

        // If the user enters a website without "http://" or "https://", add "https://"
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }

        // Redirect through ProxyScrape's proxy
        window.open(`https://proxyscrape.com/proxy/visit?u=${encodeURIComponent(url)}`, "_blank");
    });
});