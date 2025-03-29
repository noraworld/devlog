// https://hachy.github.io/2018/11/14/add-file-name-to-code-block-in-jekyll-on-github-pages.html

document.addEventListener('DOMContentLoaded', () => {
  const code = document.getElementsByTagName('code');

  Array.from(code).forEach(el => {
    if (el.dataset.lang) {
      const s = el.dataset.lang.split(':');
      const highlightLang = s[0]?.trim();
      const filename = s[1]?.trim();
      if (filename) {
        el.classList.add(highlightLang);
        el.parentElement.setAttribute('data-lang', filename);
        el.parentElement.classList.add('code-block-header');
      }
    }
  });
});
