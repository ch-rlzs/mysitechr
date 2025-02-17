// Toggle menu on hamburger click
const hamburger = document.querySelector('.hamburger');
const dropdownContent = document.querySelector('.dropdown-content');

hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburger.classList.toggle('active');
    dropdownContent.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        hamburger.classList.remove('active');
        dropdownContent.classList.remove('active');
    }
});

// Close menu when clicking a link
document.querySelectorAll('.dropdown-content a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        dropdownContent.classList.remove('active');
    });
});