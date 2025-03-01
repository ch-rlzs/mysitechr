document.addEventListener("DOMContentLoaded", function () {
    const chrlzsElement = document.getElementById("chrlzs");
    const searchBarContainer = document.getElementById("searchBarContainer");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    // Show search bar when "Chrlzs" is clicked
    chrlzsElement.addEventListener("click", function () {
        searchBarContainer.style.display = "block";
    });

    // Handle search button click
    searchButton.addEventListener("click", function () {
        const url = searchInput.value.trim();
        if (!url) {
            alert("Please enter a URL.");
            return;
        }

        // Fetch a proxy from ProxyScrape
        fetch('https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all')
            .then(response => response.text())
            .then(proxyList => {
                const proxies = proxyList.trim().split('\n');
                if (proxies.length === 0) {
                    alert("No proxies available.");
                    return;
                }

                // Pick a random proxy
                const proxy = proxies[Math.floor(Math.random() * proxies.length)];
                const proxyParts = proxy.split(':');
                const proxyUrl = `http://${proxyParts[0]}:${proxyParts[1]}`;

                // Open URL through proxy
                const proxyServer = `https://your-proxy-server.com/browse?proxy=${proxyUrl}&url=${encodeURIComponent(url)}`;
                window.open(proxyServer, "_blank");
            })
            .catch(error => {
                console.error('Error fetching proxy list:', error);
                alert('Failed to retrieve proxy list.');
            });
    });
});