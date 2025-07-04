document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    document.querySelectorAll('.admin-link').forEach(link => {
        link.style.display = isAdmin ? 'list-item' : 'none';
    });
});
