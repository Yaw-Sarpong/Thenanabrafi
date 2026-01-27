// ===============================
// SIMPLE FRONT-END ADMIN "CMS"
// Uses localStorage to store articles for the public site
// ===============================

const STORAGE_KEY = 'articlesData';

// In-memory array of article objects
let adminArticles = [];

// Track which article is being edited (null means create new)
let editingArticleId = null;

// ===============================
// BASIC PASSWORD PROTECTION
// ===============================

function protectAdminWithPassword() {
    const ADMIN_PASSWORD = 'changeme123'; // <-- CHANGE THIS to your own password

    // Already authenticated for this session?
    if (sessionStorage.getItem('adminAuthed') === 'true') {
        return;
    }

    const input = prompt('Enter admin password:');

    if (input !== ADMIN_PASSWORD) {
        alert('Access denied. Redirecting to main site.');
        window.location.href = 'index.html';
    } else {
        sessionStorage.setItem('adminAuthed', 'true');
    }
}

// ===============================
// HELPERS: LOAD / SAVE / RENDER
// ===============================

function loadArticlesFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        adminArticles = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(adminArticles)) {
            adminArticles = [];
        }
    } catch (err) {
        console.error('Error parsing articles from localStorage:', err);
        adminArticles = [];
    }
}

function saveArticlesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adminArticles));
}

// Simple HTML escaper
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Render article list in admin panel
function renderAdminArticles() {
    const listEl = document.getElementById('adminArticlesList');
    if (!listEl) return;

    if (!adminArticles.length) {
        listEl.innerHTML = `
            <p class="muted-text">
                No articles yet. Add one using the form on the left.
            </p>
        `;
        return;
    }

    let html = '';
    adminArticles.forEach(article => {
        const mediaCount = Array.isArray(article.media) ? article.media.length : 0;
        html += `
            <div class="admin-article-row" data-id="${article.id}">
                <div class="admin-article-main">
                    <div class="admin-article-title-line">
                        <span class="admin-article-title">${escapeHtml(article.title)}</span>
                        ${
                            article.tag
                                ? `<span class="admin-badge">${escapeHtml(article.tag)}</span>`
                                : ''
                        }
                    </div>
                    <p class="admin-article-summary">
                        ${escapeHtml(article.summary || '')}
                    </p>
                    <p class="admin-article-meta">
                        ${
                            article.coverImage
                                ? '<i class="fa-solid fa-image"></i> Cover image set'
                                : '<i class="fa-regular fa-image"></i> No cover image'
                        }
                        ${
                            mediaCount
                                ? ` · <i class="fa-solid fa-photo-film"></i> ${mediaCount} media item(s)`
                                : ''
                        }
                    </p>
                </div>
                <div class="admin-article-actions">
                    <button class="btn ghost-btn admin-edit-btn" type="button" data-action="edit">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn ghost-btn admin-danger-btn" type="button" data-action="delete">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

// ===============================
// FORM HANDLING (CREATE / EDIT)
// ===============================

function setupAdminForm() {
    const form = document.getElementById('adminArticleForm');
    const resetBtn = document.getElementById('adminResetBtn');

    if (!form) return;

    form.addEventListener('submit', event => {
        event.preventDefault();

        const idInput = document.getElementById('adminArticleId');
        const titleInput = document.getElementById('adminTitle');
        const tagInput = document.getElementById('adminTag');
        const summaryInput = document.getElementById('adminSummary');
        const coverInput = document.getElementById('adminCover');
        const mediaInput = document.getElementById('adminMedia');
        const contentInput = document.getElementById('adminContent');

        const title = titleInput.value.trim();
        const tag = tagInput.value.trim();
        const summary = summaryInput.value.trim();
        const coverImage = coverInput.value.trim();
        const content = contentInput.value.trim();

        // Parse media URLs into an array
        const mediaRaw = mediaInput.value.trim();
        const media = mediaRaw
            ? mediaRaw
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
            : [];

        if (!title || !summary || !content) {
            alert('Please fill in all required fields (Title, Summary, Content).');
            return;
        }

        if (editingArticleId) {
            // Update existing
            const index = adminArticles.findIndex(a => a.id === editingArticleId);
            if (index !== -1) {
                adminArticles[index].title = title;
                adminArticles[index].tag = tag;
                adminArticles[index].summary = summary;
                adminArticles[index].coverImage = coverImage;
                adminArticles[index].content = content;
                adminArticles[index].media = media;
            }
        } else {
            // Create new
            const newArticle = {
                id: String(Date.now()),
                title,
                tag,
                summary,
                coverImage,
                content,
                media
            };
            // Put newest first
            adminArticles.unshift(newArticle);
        }

        saveArticlesToStorage();
        renderAdminArticles();

        editingArticleId = null;
        idInput.value = '';
        form.reset();
        updateFormModeLabel(false);

        alert('Article saved successfully ✔️');
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            editingArticleId = null;
            document.getElementById('adminArticleId').value = '';
            updateFormModeLabel(false);
        });
    }
}

function updateFormModeLabel(isEditing) {
    const panelTitle = document.querySelector('.admin-panel h3');
    if (!panelTitle) return;
    panelTitle.textContent = isEditing ? 'Edit Article' : 'New / Edit Article';
}

// ===============================
// LIST ACTIONS: EDIT / DELETE / CLEAR
// ===============================

function setupAdminListActions() {
    const listEl = document.getElementById('adminArticlesList');
    const clearAllBtn = document.getElementById('adminClearAll');

    if (!listEl) return;

    listEl.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const row = button.closest('.admin-article-row');
        const articleId = row ? row.dataset.id : null;

        if (!articleId) return;

        if (action === 'edit') {
            startEditArticle(articleId);
        } else if (action === 'delete') {
            deleteArticle(articleId);
        }
    });

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (!adminArticles.length) {
                alert('No articles to clear.');
                return;
            }
            const confirmDelete = confirm('Are you sure you want to delete ALL articles?');
            if (!confirmDelete) return;

            adminArticles = [];
            saveArticlesToStorage();
            renderAdminArticles();
            alert('All articles cleared.');
        });
    }
}

function startEditArticle(articleId) {
    const article = adminArticles.find(a => a.id === articleId);
    if (!article) return;

    editingArticleId = articleId;

    document.getElementById('adminArticleId').value = article.id;
    document.getElementById('adminTitle').value = article.title || '';
    document.getElementById('adminTag').value = article.tag || '';
    document.getElementById('adminSummary').value = article.summary || '';
    document.getElementById('adminCover').value = article.coverImage || '';

    const mediaStr = (article.media || []).join(', ');
    document.getElementById('adminMedia').value = mediaStr;

    document.getElementById('adminContent').value = article.content || '';

    updateFormModeLabel(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteArticle(articleId) {
    const article = adminArticles.find(a => a.id === articleId);
    if (!article) return;

    const confirmDelete = confirm(`Delete the article "${article.title}"?`);
    if (!confirmDelete) return;

    adminArticles = adminArticles.filter(a => a.id !== articleId);
    saveArticlesToStorage();
    renderAdminArticles();
}

// ===============================
// FOOTER YEAR
// ===============================

function setAdminYear() {
    const span = document.getElementById('adminYear');
    if (span) {
        span.textContent = new Date().getFullYear();
    }
}

// ===============================
// INIT
// ===============================

document.addEventListener('DOMContentLoaded', () => {
    protectAdminWithPassword();
    loadArticlesFromStorage();
    renderAdminArticles();
    setupAdminForm();
    setupAdminListActions();
    setAdminYear();
});
