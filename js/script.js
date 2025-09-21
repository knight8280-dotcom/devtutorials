/*
 * Simple interactivity for KnightGaming website.
 * Currently includes a toggle for the mobile navigation menu.
 */

document.addEventListener('DOMContentLoaded', () => {
  const menuIcon = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('nav .nav-links');

  // Toggle the mobile navigation drawer
  menuIcon.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
});
