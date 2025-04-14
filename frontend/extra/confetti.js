// confetti.js
function throwConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 } // Adjusted origin for better visibility
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const message = document.querySelector('.message');
    if (message) {
        setTimeout(() => {
            message.style.top = '50px';
            setTimeout(() => {
                throwConfetti();
            }, 500);
        }, 1000);
    }
});
