// ================================
// THEME TOGGLE (DARK / LIGHT)
// ================================

const THEME_KEY = 'site-theme';

/**
 * Apply the given theme ("dark" or "light") to the document
 * and update the toggle icon.
 */
function applyTheme(theme) {
    const root = document.documentElement; // <html>
    root.setAttribute('data-theme', theme);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        const icon = toggle.querySelector('i');
        if (icon) {
            if (theme === 'light') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
}

/**
 * Initialize theme from localStorage or system preference.
 */
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const current =
                document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(THEME_KEY, next);
        });
    }
}

// Run theme logic immediately
initTheme();

// ================================
// NAVIGATION: MOBILE TOGGLE
// ================================

const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('open');
        navLinks.classList.toggle('show');
    });

    // Close mobile nav when a link is clicked
    navLinks.addEventListener('click', event => {
        if (event.target.tagName.toLowerCase() === 'a') {
            navToggle.classList.remove('open');
            navLinks.classList.remove('show');
        }
    });
}

// ================================
// SCROLL REVEAL
// ================================

function handleScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15
            }
        );

        elements.forEach(el => observer.observe(el));
    } else {
        // Fallback: simple scroll listener
        const onScroll = () => {
            const triggerBottom = window.innerHeight * 0.9;
            elements.forEach(el => {
                if (el.classList.contains('visible')) return;
                const rect = el.getBoundingClientRect();
                if (rect.top < triggerBottom) {
                    el.classList.add('visible');
                }
            });
        };
        window.addEventListener('scroll', onScroll);
        onScroll();
    }
}

// ================================
// GALLERY LIGHTBOX
// ================================

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');
const galleryItems = document.querySelectorAll('.gallery-item');

if (lightbox && lightboxImage && galleryItems.length) {
    galleryItems.forEach(img => {
        img.addEventListener('click', () => {
            // Prefer data-full if present, else src
            const raw = img.getAttribute('data-full');
            const trimmed = raw ? raw.trim() : '';
            const fullSrc = trimmed || img.src;

            lightboxImage.src = fullSrc;
            lightbox.classList.add('show');
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('show');
            lightboxImage.src = '';
        });
    }

    // Close when clicking outside the image
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) {
            lightbox.classList.remove('show');
            lightboxImage.src = '';
        }
    });
}

// ================================
// TESTIMONIALS SLIDER
// ================================

function initTestimonialsSlider() {
    const testimonials = document.querySelectorAll('.testimonial');
    if (!testimonials.length) return;

    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');

    let current = 0;
    const total = testimonials.length;
    let intervalId = null;

    function show(index) {
        testimonials.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        current = index;
    }

    function next() {
        const nextIndex = (current + 1) % total;
        show(nextIndex);
    }

    function prev() {
        const prevIndex = (current - 1 + total) % total;
        show(prevIndex);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => {
        next();
        restartAuto();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prev();
        restartAuto();
    });

    function startAuto() {
        intervalId = setInterval(next, 8000);
    }

    function restartAuto() {
        if (intervalId) clearInterval(intervalId);
        startAuto();
    }

    show(0);
    startAuto();
}

initTestimonialsSlider();

// ================================
// BACK TO TOP BUTTON
// ================================

const backToTopBtn = document.getElementById('backToTop');

if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 450) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ================================
// PUBLIC ARTICLES & OPPORTUNITIES
// ================================

const STORAGE_KEY_ARTICLES = 'articlesData';
const STORAGE_KEY_OPPORTUNITIES = 'opportunitiesData';

// Escape helper
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Load articles for the main site "Featured Articles" section.
 * Populates #articlesList with cards that link to article.html?id=...
 */
function loadArticlesForPublic() {
    const container = document.getElementById('articlesList');
    if (!container) return; // not on index.html

    let articles = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ARTICLES);
        articles = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(articles)) {
            articles = [];
        }
    } catch (err) {
        console.error('Error reading articles from localStorage:', err);
        articles = [];
    }

    if (!articles.length) {
        container.innerHTML = `
            <p class="muted-text">
                No articles published yet. Check back soon.
            </p>
        `;
        return;
    }

    let html = '';
    articles.forEach(article => {
        const tag = article.tag || 'Article';
        const title = article.title || 'Untitled';
        const summary = article.summary || '';
        const coverImage = article.coverImage || '';
        const detailUrl = `article.html?id=${encodeURIComponent(article.id)}`;

        html += `
            <article class="article-card" data-id="${escapeHtml(article.id)}">
                ${
                    coverImage
                        ? `<div class="article-card-image">
                               <img src="${escapeHtml(
                                   coverImage
                               )}" alt="${escapeHtml(title)} cover">
                           </div>`
                        : ''
                }
                <span class="article-tag">
                    ${escapeHtml(tag)}
                </span>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(summary)}</p>
                <a href="${detailUrl}" class="article-link">
                    Read Article <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </article>
        `;
    });

    container.innerHTML = html;

    // Make the whole card clickable (not just the text link)
    attachArticleCardHandlers();
}

/**
 * Attach click handlers to article cards so clicking anywhere on the card
 * will navigate to the article.html?id=... page.
 */
function attachArticleCardHandlers() {
    const cards = document.querySelectorAll('.article-card[data-id]');
    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', event => {
            // If user clicked the <a> itself, let the default behavior work
            if (event.target.closest('a')) return;

            const link = card.querySelector('a.article-link');
            if (link && link.href) {
                window.location.href = link.href;
            }
        });
    });
}

/**
 * Load a single article on article.html based on ?id=...
 */
function loadArticleDetail() {
    const contentEl = document.getElementById('articleContent');
    if (!contentEl) return; // not on article.html

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const titleEl = document.getElementById('articleTitle');
    const tagEl = document.getElementById('articleTag');
    const summaryEl = document.getElementById('articleSummary');
    const coverWrapper = document.getElementById('articleCoverWrapper');
    const coverImg = document.getElementById('articleCover');
    const mediaSection = document.getElementById('articleMediaSection');
    const mediaGrid = document.getElementById('articleMediaGrid');

    if (!id) {
        if (titleEl) titleEl.textContent = 'Article not found';
        contentEl.textContent = 'No article id was provided.';
        if (coverWrapper) coverWrapper.style.display = 'none';
        if (mediaSection) mediaSection.style.display = 'none';
        return;
    }

    let articles = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ARTICLES);
        articles = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(articles)) {
            articles = [];
        }
    } catch (err) {
        console.error('Error reading articles from localStorage:', err);
        articles = [];
    }

    const article = articles.find(a => a.id === id);

    if (!article) {
        if (titleEl) titleEl.textContent = 'Article not found';
        contentEl.textContent =
            'The requested article could not be found. It may have been removed.';
        if (coverWrapper) coverWrapper.style.display = 'none';
        if (mediaSection) mediaSection.style.display = 'none';
        return;
    }

    // Fill header info
    if (titleEl) titleEl.textContent = article.title || 'Untitled article';
    if (tagEl) tagEl.textContent = article.tag || 'Article';
    if (summaryEl) summaryEl.textContent = article.summary || '';

    // Cover image
    if (coverImg && article.coverImage) {
        coverImg.src = article.coverImage;
        coverImg.alt = article.title || 'Article cover image';
        if (coverWrapper) coverWrapper.style.display = 'block';
    } else if (coverWrapper) {
        coverWrapper.style.display = 'none';
    }

    // Content: convert text → paragraphs + <br>
    if (article.content) {
        const safe = escapeHtml(article.content);
        const paragraphs = safe
            .split(/\n{2,}/)
            .map(chunk => `<p>${chunk.replace(/\n/g, '<br>')}</p>`)
            .join('');
        contentEl.innerHTML = paragraphs;
    } else {
        contentEl.innerHTML =
            '<p>No content provided for this article yet.</p>';
    }

    // Extra media gallery
    if (mediaSection && mediaGrid) {
        const media = Array.isArray(article.media) ? article.media : [];
        if (!media.length) {
            mediaSection.style.display = 'none';
        } else {
            const itemsHtml = media
                .map(url => {
                    const escapedUrl = escapeHtml(url);
                    return `
                        <a href="${escapedUrl}" target="_blank" class="article-media-item">
                            <img src="${escapedUrl}" alt="Article media">
                        </a>
                    `;
                })
                .join('');
            mediaGrid.innerHTML = itemsHtml;
            mediaSection.style.display = 'block';
        }
    }
}

/**
 * Load opportunities for the "Opportunities & Updates" section.
 */
function loadOpportunitiesForPublic() {
    const container = document.getElementById('opportunitiesList');
    if (!container) return; // not on index.html

    let opportunities = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY_OPPORTUNITIES);
        opportunities = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(opportunities)) opportunities = [];
    } catch (err) {
        console.error('Error reading opportunities from localStorage:', err);
        opportunities = [];
    }

    if (!opportunities.length) {
        container.innerHTML = `
            <p class="muted-text">
                No opportunities have been posted yet. Check back soon.
            </p>
        `;
        return;
    }

    let html = '';
    opportunities.forEach(opp => {
        const title = opp.title || 'Untitled opportunity';
        const type = opp.type || 'Opportunity';
        const category = opp.category || '';
        const location = opp.location || '';
        const summary = opp.summary || '';
        const link = opp.link || '#';
        const image = opp.image || '';

        html += `
            <article class="op-card" onclick="window.open('${escapeHtml(
                link
            )}','_blank')">
                <div class="op-card-thumb">
                    ${
                        image
                            ? `<img src="${escapeHtml(
                                  image
                              )}" alt="${escapeHtml(title)} thumbnail">`
                            : `<span class="op-card-thumb-placeholder">${escapeHtml(
                                  type
                              )}</span>`
                    }
                </div>
                <div class="op-card-body">
                    <div>
                        <span class="op-tag">
                            ${escapeHtml(type)}
                            ${
                                category
                                    ? ' · ' + escapeHtml(category)
                                    : ''
                            }
                        </span>
                    </div>
                    <h3 class="op-card-title">${escapeHtml(title)}</h3>
                    <p class="op-card-desc">${escapeHtml(summary)}</p>
                    <div class="op-card-meta">
                        ${
                            location
                                ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(
                                      location
                                  )}</span>`
                                : ''
                        }
                        <a href="${escapeHtml(
                            link
                        )}" target="_blank" rel="noopener">
                            View details <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

// ================================
// ON LOAD: INITIALISE CONTENT
// ================================

window.addEventListener('load', () => {
    handleScrollReveal();
    loadArticlesForPublic();
    loadArticleDetail();
    loadOpportunitiesForPublic();
});
