function toggleSection(id) {
    var section = document.getElementById(id);
    if (section.style.display === "block") {
        section.style.display = "none";
    } else {
        section.style.display = "block";
    }
}
