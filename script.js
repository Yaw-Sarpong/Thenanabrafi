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

    // Close mobile menu when a nav link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
            navToggle.classList.remove('open');
        });
    });
}

// ================================
// SMOOTH SCROLL FOR INTERNAL LINKS
// ================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').slice(1);
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        e.preventDefault();

        window.scrollTo({
            top: targetEl.offsetTop - 72,
            behavior: 'smooth'
        });
    });
});

// ================================
// SCROLL REVEAL ANIMATION
// ================================

const revealElements = document.querySelectorAll('.reveal');

function handleScrollReveal() {
    const triggerBottom = window.innerHeight * 0.82;

    revealElements.forEach(el => {
        const boxTop = el.getBoundingClientRect().top;
        if (boxTop < triggerBottom) {
            el.classList.add('visible');
        }
    });
}

// ================================
// PUBLIC ARTICLES: LIST + DETAIL
// ================================
// ================================
// PUBLIC ARTICLES: LIST + DETAIL
// ================================

const STORAGE_KEY = 'articlesData';

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
        const raw = localStorage.getItem(STORAGE_KEY);
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
                               <img src="${escapeHtml(coverImage)}" alt="${escapeHtml(title)} cover">
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
        const raw = localStorage.getItem(STORAGE_KEY);
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
        contentEl.textContent = 'The requested article could not be found. It may have been removed.';
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
        contentEl.innerHTML = '<p>No content provided for this article yet.</p>';
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


// ================================
// RUN ON PAGE LOAD
// ================================

window.addEventListener('load', () => {
    handleScrollReveal();
    loadArticlesForPublic();  // safe on pages that don't have #articlesList
    loadArticleDetail();      // safe on pages that don't have article elements
});

// Also reveal on scroll
window.addEventListener('scroll', handleScrollReveal);

// ================================
// GALLERY LIGHTBOX
// ================================

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const lightboxClose = document.querySelector('.lightbox-close');

document.querySelectorAll('.gallery-item').forEach(img => {
    img.addEventListener('click', () => {
        const fullSrc = img.getAttribute('data-full') || img.src;
        if (!lightboxImage || !lightbox) return;
        lightboxImage.src = fullSrc;
        lightbox.classList.add('show');
    });
});

if (lightboxClose && lightbox && lightboxImage) {
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('show');
        lightboxImage.src = '';
    });

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

const testimonials = document.querySelectorAll('.testimonial');
let currentTestimonial = 0;

const prevBtn = document.getElementById('prevTestimonial');
const nextBtn = document.getElementById('nextTestimonial');

function showTestimonial(index) {
    testimonials.forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

if (testimonials.length) {
    showTestimonial(currentTestimonial);

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentTestimonial =
                (currentTestimonial - 1 + testimonials.length) % testimonials.length;
            showTestimonial(currentTestimonial);
        });
    }

    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, 7000);
}

// ================================
// BOOKING FORM HANDLING
// ================================

const bookingForm = document.getElementById('bookingForm');
const bookingModal = document.getElementById('bookingModal');
const bookingModalClose = document.getElementById('bookingModalClose');
const bookingModalOk = document.getElementById('bookingModalOk');

if (bookingForm) {
    bookingForm.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData.entries());

        if (!data.name || !data.email || !data.eventType || !data.message) {
            alert('Please fill in all required fields.');
            return;
        }

        // Build email
        const subject = encodeURIComponent('New Booking Inquiry from ' + data.name);
        const bodyLines = [
            `Name: ${data.name}`,
            `Email: ${data.email}`,
            `Event Type: ${data.eventType}`,
            `Event Date: ${data.eventDate || 'Not specified'}`,
            `Budget: ${data.budget || 'Not specified'}`,
            '',
            'Event Details:',
            data.message
        ];
        const body = encodeURIComponent(bodyLines.join('\n'));

        const yourEmail = 'naoabrafi@gmail.com'; // <-- booking email

        // Open mail client with prefilled email to you
        window.location.href = `mailto:${yourEmail}?subject=${subject}&body=${body}`;

        // Optional confirmation modal
        if (bookingModal) {
            bookingModal.classList.add('show');
        }

        bookingForm.reset();
    });
}

if (bookingModalClose && bookingModal) {
    bookingModalClose.addEventListener('click', () => {
        bookingModal.classList.remove('show');
    });
}

if (bookingModalOk && bookingModal) {
    bookingModalOk.addEventListener('click', () => {
        bookingModal.classList.remove('show');
    });
}

if (bookingModal) {
    bookingModal.addEventListener('click', e => {
        if (e.target === bookingModal) {
            bookingModal.classList.remove('show');
        }
    });
}

// ================================
// BACK TO TOP BUTTON
// ================================

const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (!backToTop) return;
    if (window.scrollY > 350) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ================================
// FOOTER YEAR (for any page using #year)
// ================================

const yearSpan = document.getElementById('year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}
