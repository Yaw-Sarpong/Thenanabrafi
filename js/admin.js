// ===============================
// SIMPLE FRONT-END ADMIN "CMS"
// Manages Articles + Opportunities using localStorage
// ===============================

const STORAGE_KEY_ARTICLES = 'articlesData';
const STORAGE_KEY_OPPORTUNITIES = 'opportunitiesData';

// In-memory arrays
let adminArticles = [];
let adminOpportunities = [];

// Track which records are being edited
let editingArticleId = null;
let editingOppId = null;

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
// HELPERS: LOAD / SAVE / ESCAPE
// ===============================

function loadArticlesFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ARTICLES);
        adminArticles = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(adminArticles)) adminArticles = [];
    } catch (err) {
        console.error('Error parsing articles from localStorage:', err);
        adminArticles = [];
    }
}

function saveArticlesToStorage() {
    localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(adminArticles));
}

function loadOpportunitiesFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_OPPORTUNITIES);
        adminOpportunities = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(adminOpportunities)) adminOpportunities = [];
    } catch (err) {
        console.error('Error parsing opportunities from localStorage:', err);
        adminOpportunities = [];
    }
}

function saveOpportunitiesToStorage() {
    localStorage.setItem(
        STORAGE_KEY_OPPORTUNITIES,
        JSON.stringify(adminOpportunities)
    );
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

// ===============================
// RENDER: ARTICLES
// ===============================

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
        const mediaCount = Array.isArray(article.media)
            ? article.media.length
            : 0;
        html += `
            <div class="admin-article-row" data-id="${article.id}">
                <div class="admin-article-main">
                    <div class="admin-article-title-line">
                        <span class="admin-article-title">${escapeHtml(
                            article.title
                        )}</span>
                        ${
                            article.tag
                                ? `<span class="admin-badge">${escapeHtml(
                                      article.tag
                                  )}</span>`
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
// RENDER: OPPORTUNITIES
// ===============================

function renderAdminOpportunities() {
    const listEl = document.getElementById('adminOppList');
    if (!listEl) return;

    if (!adminOpportunities.length) {
        listEl.innerHTML = `
            <p class="muted-text">
                No opportunities added yet. Use the form on the left to create one.
            </p>
        `;
        return;
    }

    let html = '';
    adminOpportunities.forEach(opp => {
        html += `
            <div class="admin-article-row" data-id="${opp.id}">
                <div class="admin-article-main">
                    <div class="admin-article-title-line">
                        <span class="admin-article-title">${escapeHtml(
                            opp.title
                        )}</span>
                        ${
                            opp.type
                                ? `<span class="admin-badge">${escapeHtml(
                                      opp.type
                                  )}</span>`
                                : ''
                        }
                        ${
                            opp.category
                                ? `<span class="admin-badge">${escapeHtml(
                                      opp.category
                                  )}</span>`
                                : ''
                        }
                    </div>
                    <p class="admin-article-summary">
                        ${escapeHtml(opp.summary || '')}
                    </p>
                    <p class="admin-article-meta">
                        ${
                            opp.location
                                ? `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(
                                      opp.location
                                  )} · `
                                : ''
                        }
                        ${
                            opp.link
                                ? `<a href="${escapeHtml(
                                      opp.link
                                  )}" target="_blank" rel="noopener">View link</a>`
                                : 'No link set'
                        }
                    </p>
                </div>
                <div class="admin-article-actions">
                    <button class="btn ghost-btn admin-edit-btn" type="button" data-opp-action="edit">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                    <button class="btn ghost-btn admin-danger-btn" type="button" data-opp-action="delete">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;
}

// ===============================
// FORM HANDLING: ARTICLES
// ===============================

function setupAdminArticleForm() {
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

        const mediaRaw = mediaInput.value.trim();
        const media = mediaRaw
            ? mediaRaw
                  .split(',')
                  .map(s => s.trim())
                  .filter(Boolean)
            : [];

        if (!title || !summary || !content) {
            alert(
                'Please fill in all required fields (Title, Summary, Content).'
            );
            return;
        }

        if (editingArticleId) {
            const index = adminArticles.findIndex(
                a => a.id === editingArticleId
            );
            if (index !== -1) {
                adminArticles[index].title = title;
                adminArticles[index].tag = tag;
                adminArticles[index].summary = summary;
                adminArticles[index].coverImage = coverImage;
                adminArticles[index].content = content;
                adminArticles[index].media = media;
            }
        } else {
            const newArticle = {
                id: String(Date.now()),
                title,
                tag,
                summary,
                coverImage,
                content,
                media
            };
            adminArticles.unshift(newArticle);
        }

        saveArticlesToStorage();
        renderAdminArticles();

        editingArticleId = null;
        idInput.value = '';
        form.reset();
        updateArticleFormMode(false);

        alert('Article saved successfully ✔️');
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            editingArticleId = null;
            document.getElementById('adminArticleId').value = '';
            updateArticleFormMode(false);
        });
    }
}

function updateArticleFormMode(isEditing) {
    const panelTitle = document.querySelector(
        '.admin-grid:first-of-type .admin-panel h3'
    );
    if (!panelTitle) return;
    panelTitle.textContent = isEditing ? 'Edit Article' : 'New / Edit Article';
}

// LIST ACTIONS: ARTICLES
function setupAdminArticleListActions() {
    const listEl = document.getElementById('adminArticlesList');
    const clearAllBtn = document.getElementById('adminClearAll');
    const exportBtn = document.getElementById('adminExportArticles');

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
            const confirmDelete = confirm(
                'Are you sure you want to delete ALL articles?'
            );
            if (!confirmDelete) return;

            adminArticles = [];
            saveArticlesToStorage();
            renderAdminArticles();
            alert('All articles cleared.');
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!adminArticles.length) {
                alert('No articles to export.');
                return;
            }
            const json = JSON.stringify(adminArticles, null, 2);
            console.log('Exported articles JSON:', json);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard
                    .writeText(json)
                    .then(() => {
                        alert(
                            'Articles JSON copied to clipboard! Paste it into PUBLIC_ARTICLES in script.js.'
                        );
                    })
                    .catch(() => {
                        alert(
                            'Could not copy automatically. Check the browser console and copy from there.'
                        );
                    });
            } else {
                alert(
                    'Clipboard not available. Check the browser console and copy the JSON from there.'
                );
            }
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

    updateArticleFormMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteArticle(articleId) {
    const article = adminArticles.find(a => a.id === articleId);
    if (!article) return;

    const confirmDelete = confirm(
        `Delete the article "${article.title}"?`
    );
    if (!confirmDelete) return;

    adminArticles = adminArticles.filter(a => a.id !== articleId);
    saveArticlesToStorage();
    renderAdminArticles();
}

// ===============================
// FORM HANDLING: OPPORTUNITIES
// ===============================

function setupAdminOppForm() {
    const form = document.getElementById('adminOppForm');
    const resetBtn = document.getElementById('oppResetBtn');

    if (!form) return;

    form.addEventListener('submit', event => {
        event.preventDefault();

        const idInput = document.getElementById('oppId');
        const titleInput = document.getElementById('oppTitle');
        const typeInput = document.getElementById('oppType');
        const categoryInput = document.getElementById('oppCategory');
        const locationInput = document.getElementById('oppLocation');
        const linkInput = document.getElementById('oppLink');
        const imageInput = document.getElementById('oppImage');
        const summaryInput = document.getElementById('oppSummary');

        const title = titleInput.value.trim();
        const type = typeInput.value.trim();
        const category = categoryInput.value.trim();
        const location = locationInput.value.trim();
        const link = linkInput.value.trim();
        const image = imageInput.value.trim();
        const summary = summaryInput.value.trim();

        if (!title || !type || !summary) {
    alert(
        'Please fill in all required fields (Title, Type, Description). The link is optional.'
    );
    return;
}


        if (editingOppId) {
            const index = adminOpportunities.findIndex(
                o => o.id === editingOppId
            );
            if (index !== -1) {
                adminOpportunities[index].title = title;
                adminOpportunities[index].type = type;
                adminOpportunities[index].category = category;
                adminOpportunities[index].location = location;
                adminOpportunities[index].link = link;
                adminOpportunities[index].image = image;
                adminOpportunities[index].summary = summary;
            }
        } else {
            const newOpp = {
                id: String(Date.now()),
                title,
                type,
                category,
                location,
                link,
                image,
                summary
            };
            adminOpportunities.unshift(newOpp);
        }

        saveOpportunitiesToStorage();
        renderAdminOpportunities();

        editingOppId = null;
        idInput.value = '';
        form.reset();

        alert('Opportunity saved successfully ✔️');
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            editingOppId = null;
            document.getElementById('oppId').value = '';
        });
    }
}

// LIST ACTIONS: OPPORTUNITIES
function setupAdminOppListActions() {
    const listEl = document.getElementById('adminOppList');
    const clearAllBtn = document.getElementById('oppClearAll');
    const exportBtn = document.getElementById('oppExport');

    if (!listEl) return;

    listEl.addEventListener('click', event => {
        const editBtn = event.target.closest(
            'button[data-opp-action="edit"]'
        );
        const deleteBtn = event.target.closest(
            'button[data-opp-action="delete"]'
        );
        const row = event.target.closest('.admin-article-row');
        const oppId = row ? row.dataset.id : null;
        if (!oppId) return;

        if (editBtn) {
            startEditOpp(oppId);
        } else if (deleteBtn) {
            deleteOpp(oppId);
        }
    });

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (!adminOpportunities.length) {
                alert('No opportunities to clear.');
                return;
            }
            const confirmDelete = confirm(
                'Are you sure you want to delete ALL opportunities?'
            );
            if (!confirmDelete) return;

            adminOpportunities = [];
            saveOpportunitiesToStorage();
            renderAdminOpportunities();
            alert('All opportunities cleared.');
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!adminOpportunities.length) {
                alert('No opportunities to export.');
                return;
            }
            const json = JSON.stringify(adminOpportunities, null, 2);
            console.log('Exported opportunities JSON:', json);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard
                    .writeText(json)
                    .then(() => {
                        alert(
                            'Opportunities JSON copied to clipboard! Paste it into PUBLIC_OPPORTUNITIES in script.js.'
                        );
                    })
                    .catch(() => {
                        alert(
                            'Could not copy automatically. Check the browser console and copy from there.'
                        );
                    });
            } else {
                alert(
                    'Clipboard not available. Check the browser console and copy the JSON from there.'
                );
            }
        });
    }
}

function startEditOpp(oppId) {
    const opp = adminOpportunities.find(o => o.id === oppId);
    if (!opp) return;

    editingOppId = oppId;

    document.getElementById('oppId').value = opp.id;
    document.getElementById('oppTitle').value = opp.title || '';
    document.getElementById('oppType').value = opp.type || '';
    document.getElementById('oppCategory').value = opp.category || '';
    document.getElementById('oppLocation').value = opp.location || '';
    document.getElementById('oppLink').value = opp.link || '';
    document.getElementById('oppImage').value = opp.image || '';
    document.getElementById('oppSummary').value = opp.summary || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteOpp(oppId) {
    const opp = adminOpportunities.find(o => o.id === oppId);
    if (!opp) return;

    const confirmDelete = confirm(
        `Delete the opportunity "${opp.title}"?`
    );
    if (!confirmDelete) return;

    adminOpportunities = adminOpportunities.filter(o => o.id !== oppId);
    saveOpportunitiesToStorage();
    renderAdminOpportunities();
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
    loadOpportunitiesFromStorage();
    renderAdminArticles();
    renderAdminOpportunities();
    setupAdminArticleForm();
    setupAdminArticleListActions();
    setupAdminOppForm();
    setupAdminOppListActions();
    setAdminYear();
});
