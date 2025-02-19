document.addEventListener("DOMContentLoaded", function () {
    let dropdownLinks = document.querySelectorAll(".dropdown-content a");

    dropdownLinks.forEach(link => {
        link.addEventListener("mouseover", function () {
            this.style.transform = "scale(1.05)";
            this.style.paddingLeft = "20px";
            this.style.transition = "transform 0.3s ease, padding-left 0.3s ease";
        });

        link.addEventListener("mouseout", function () {
            this.style.transform = "scale(1)";
            this.style.paddingLeft = "12px";
        });
    });
});