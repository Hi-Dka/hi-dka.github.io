document.addEventListener('DOMContentLoaded', function() {
  const headerHeight = document.querySelector('.header').offsetHeight;
  document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

  window.addEventListener('resize', function() {
    const headerHeight = document.querySelector('.header').offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  });
});