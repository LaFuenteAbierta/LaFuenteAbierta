// Configuración
const CONFIG = {
    postsPerPage: 6,
    postsDataFile: 'data/posts.json',
    postsFolder: 'posts/',
    imagesFolder: 'images/'
};

// Estado de la aplicación
let appState = {
    allPosts: [],
    filteredPosts: [],
    currentCategory: 'all',
    currentPage: 1,
    searchTerm: ''
};

// Colores por categoría
const categoryColors = {
    'Tecnología': 'bg-purple-600',
    'Deportes': 'bg-green-600',
    'Política': 'bg-red-600',
    'Economía': 'bg-blue-600',
    'Cultura': 'bg-orange-600',
    'Ciencia': 'bg-teal-600',
    'Internacional': 'bg-pink-600',
    'Opinión': 'bg-indigo-600',
    'Redes': 'bg-cyan-600',
    'Programación': 'bg-violet-600'
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    updateCurrentDate();
    await loadPosts();
    setupEventListeners();
    handlePostHash(); // abrir post si viene desde link compartido
});

// Actualizar fecha
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const currentDate = new Date().toLocaleDateString('es-ES', options);
    dateElement.textContent = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);
}

// Cargar posts desde JSON
async function loadPosts() {
    try {
        const response = await fetch(CONFIG.postsDataFile);
        if (!response.ok) throw new Error('No se pudo cargar el archivo de posts');

        const data = await response.json();
        appState.allPosts = data.posts || [];

        // Ordenar por fecha (más reciente primero)
        appState.allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Cargar vistas desde localStorage
        loadViewCounts();

        // Renderizar
        appState.filteredPosts = [...appState.allPosts];
        renderPosts();
        hideLoadingSkeleton();

    } catch (error) {
        console.error('Error al cargar posts:', error);
        showError('No se pudieron cargar las noticias. Por favor, intenta más tarde.');
        hideLoadingSkeleton();
    }
}

// Ocultar skeleton loader
function hideLoadingSkeleton() {
    document.getElementById('loading-skeleton').style.display = 'none';
    document.getElementById('featured-section').style.display = 'block';
    document.getElementById('news-grid').style.display = 'grid';
    document.getElementById('secondary-section').style.display = 'grid';
}

// Mostrar error
function showError(message) {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="font-headline text-3xl text-gray-300 mb-2">Error al cargar</h3>
            <p class="text-gray-500">${message}</p>
        </div>
    `;
}

// Renderizar posts
function renderPosts() {
    const { filteredPosts, currentPage } = appState;

    if (filteredPosts.length === 0) {
        showNoResults();
        return;
    }

    hideNoResults();

    // Asegurar que todas las secciones estén visibles
    document.getElementById('featured-section').style.display = 'block';
    document.getElementById('news-grid').style.display = 'grid';
    document.getElementById('secondary-section').style.display = 'grid';

    // Calcular paginación
    const startIndex = (currentPage - 1) * CONFIG.postsPerPage;
    const endIndex = startIndex + CONFIG.postsPerPage;
    const postsToShow = filteredPosts.slice(startIndex, endIndex);

    // Featured (primer post)
    if (currentPage === 1 && postsToShow.length > 0) {
        renderFeaturedPost(postsToShow[0]);
        renderNewsGrid(postsToShow.slice(1, 4)); // 3 posts siguientes
        renderSecondaryNews(postsToShow.slice(4)); // Resto
    } else {
        document.getElementById('featured-section').style.display = 'none';
        renderNewsGrid(postsToShow.slice(0, 6));
        renderSecondaryNews([]);
    }

    renderMostRead();
    renderPagination();
    updateBreakingNews();
}

// Renderizar post destacado
function renderFeaturedPost(post) {
    const section = document.getElementById('featured-section');
    const isNew = isPostNew(post.date);

    section.style.display = 'block';
    section.innerHTML = `
        <article class="article-card bg-dark-800 rounded-lg overflow-hidden border border-dark-600 hover:border-accent-primary">
            <div class="grid md:grid-cols-2 gap-0">
                <div class="overflow-hidden">
                    <img src="${CONFIG.imagesFolder}${post.image}"
                         alt="${post.title}"
                         class="w-full h-full object-cover min-h-[300px]"
                         onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop'">
                </div>
                <div class="p-8 flex flex-col justify-center">
                    <div class="flex items-center gap-3 mb-4 flex-wrap">
                        ${post.category.map(cat => `
                            <span class="${getCategoryColor(cat)} text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded category-tag">
                                ${cat}
                            </span>
                        `).join('')}
                        ${isNew ? '<span class="new-badge text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded">NUEVO</span>' : ''}
                        <span class="text-gray-500 text-sm">${getTimeAgo(post.date)}</span>
                    </div>
                    <h2 class="font-headline text-4xl md:text-5xl mb-4 leading-tight hover:text-accent-primary transition-colors cursor-pointer" onclick="openPost('${post.contentFile}', '${post.title}')">
                        ${post.title.toUpperCase()}
                    </h2>
                    <p class="text-gray-400 text-lg mb-6 leading-relaxed">
                        ${post.excerpt}
                    </p>
                    <div class="flex items-center gap-4 mb-4">
                        <span class="read-time">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            ${getReadTime(post.excerpt)} min lectura
                        </span>
                        <span class="read-time view-count">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            ${getViewCount(post.contentFile)} vistas
                        </span>
                    </div>
                    <a href="#" onclick="openPost('${post.contentFile}', '${post.title}'); return false;" class="inline-flex items-center text-accent-primary font-bold hover:underline group">
                        Leer más
                        <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                </div>
            </div>
        </article>
    `;
}

// Renderizar grid de noticias
function renderNewsGrid(posts) {
    const grid = document.getElementById('news-grid');

    if (posts.length === 0) {
        grid.style.display = 'none';
        return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = posts.map((post, index) => {
        const isNew = isPostNew(post.date);
        return `
            <article class="article-card bg-dark-800 rounded-lg overflow-hidden border border-dark-600 hover:border-accent-primary animate-fade-in stagger-${index + 2}">
                <div class="overflow-hidden cursor-pointer" onclick="openPost('${post.contentFile}', '${post.title}')">
                    <img src="${CONFIG.imagesFolder}${post.image}"
                         alt="${post.title}"
                         class="w-full h-48 object-cover"
                         onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop'">
                </div>
                <div class="p-6">
                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                        ${post.category.map(cat => `
                            <span class="${getCategoryColor(cat)} text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded inline-block category-tag">
                                ${cat}
                            </span>
                        `).join('')}
                        ${isNew ? '<span class="new-badge text-white px-2 py-1 text-xs font-bold uppercase rounded inline-block">NUEVO</span>' : ''}
                    </div>
                    <h3 class="font-headline text-2xl mb-3 leading-tight hover:text-accent-primary transition-colors cursor-pointer" onclick="openPost('${post.contentFile}', '${post.title}')">
                        ${post.title.toUpperCase()}
                    </h3>
                    <p class="text-gray-400 text-sm mb-4">
                        ${post.excerpt}
                    </p>
                    <div class="flex items-center justify-between">
                        <span class="text-gray-500 text-xs">${getTimeAgo(post.date)}</span>
                        <span class="read-time">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            ${getViewCount(post.contentFile)}
                        </span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Renderizar noticias secundarias
function renderSecondaryNews(posts) {
    const container = document.getElementById('secondary-news');

    container.innerHTML = posts.slice(0, 3).map(post => `
        <article class="article-card flex gap-4 bg-dark-800 p-4 rounded-lg border border-dark-600 hover:border-accent-primary cursor-pointer" onclick="openPost('${post.contentFile}', '${post.title}')">
            <img src="${CONFIG.imagesFolder}${post.image}"
                 alt="${post.title}"
                 class="w-32 h-24 object-cover rounded flex-shrink-0"
                 onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=150&fit=crop'">
            <div>
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    ${post.category.slice(0, 2).map(cat => `
                        <span class="${getCategoryColor(cat)} text-white px-2 py-1 text-xs font-bold uppercase rounded inline-block">
                            ${cat}
                        </span>
                    `).join('')}
                </div>
                <h4 class="font-headline text-lg mb-2 hover:text-accent-primary transition-colors">
                    ${post.title.toUpperCase()}
                </h4>
                <span class="text-gray-500 text-xs">${getTimeAgo(post.date)}</span>
            </div>
        </article>
    `).join('');
}

// Renderizar "Lo más leído"
function renderMostRead() {
    const container = document.getElementById('most-read');

    const mostRead = [...appState.allPosts]
        .sort((a, b) => getViewCount(b.contentFile) - getViewCount(a.contentFile))
        .slice(0, 5);

    container.innerHTML = `
        <ol class="space-y-5">
            ${mostRead.map((post, index) => `
                <li class="flex gap-4 pb-4 border-b border-dark-600 last:border-0 cursor-pointer hover:bg-dark-700 p-3 -m-3 rounded transition-colors" onclick="openPost('${post.contentFile}', '${post.title}')">
                    <span class="font-headline text-4xl ${index === 0 ? 'text-accent-primary' : 'text-gray-600'} flex-shrink-0">
                        ${index + 1}
                    </span>
                    <div>
                        <h4 class="font-semibold mb-1 hover:text-accent-primary transition-colors">
                            ${post.title}
                        </h4>
                        <span class="text-gray-500 text-xs">${formatNumber(getViewCount(post.contentFile))} lecturas</span>
                    </div>
                </li>
            `).join('')}
        </ol>
    `;
}

// Renderizar paginación
function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(appState.filteredPosts.length / CONFIG.postsPerPage);

    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    if (appState.currentPage > 1) {
        const prevBtn = createPageButton('‹ Anterior', appState.currentPage - 1);
        container.appendChild(prevBtn);
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= appState.currentPage - 1 && i <= appState.currentPage + 1)) {
            const pageBtn = createPageButton(i, i, i === appState.currentPage);
            container.appendChild(pageBtn);
        } else if (i === appState.currentPage - 2 || i === appState.currentPage + 2) {
            const dots = document.createElement('span');
            dots.className = 'px-2 text-gray-500';
            dots.textContent = '...';
            container.appendChild(dots);
        }
    }

    if (appState.currentPage < totalPages) {
        const nextBtn = createPageButton('Siguiente ›', appState.currentPage + 1);
        container.appendChild(nextBtn);
    }
}

// Crear botón de paginación
function createPageButton(label, page, isActive = false) {
    const button = document.createElement('button');
    button.className = `pagination-btn text-white ${isActive ? 'active' : ''}`;
    button.textContent = label;
    button.onclick = () => {
        appState.currentPage = page;
        renderPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return button;
}

// Actualizar "última hora"
function updateBreakingNews() {
    const latestPost = appState.allPosts[0];
    if (latestPost) {
        document.getElementById('breaking-text').textContent = latestPost.title;
    }
}

// Mostrar/ocultar "sin resultados"
function showNoResults() {
    document.getElementById('no-results').style.display = 'block';
    document.getElementById('featured-section').style.display = 'none';
    document.getElementById('news-grid').style.display = 'none';
    document.getElementById('secondary-section').style.display = 'none';
    document.getElementById('pagination').style.display = 'none';
}

function hideNoResults() {
    document.getElementById('no-results').style.display = 'none';
}

// Configurar event listeners
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-category]')) {
            e.preventDefault();
            const category = e.target.dataset.category;
            filterByCategory(category);

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            e.target.classList.add('active');

            updateBreadcrumbs(category);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchPosts(e.target.value);
            }, 300);
        });
    }
}

// Filtrar por categoría
function filterByCategory(category) {
    appState.currentCategory = category;
    appState.currentPage = 1;

    if (category === 'all') {
        appState.filteredPosts = [...appState.allPosts];
    } else {
        appState.filteredPosts = appState.allPosts.filter(post =>
            post.category.includes(category)
        );
    }

    if (appState.searchTerm) {
        searchPosts(appState.searchTerm);
    } else {
        renderPosts();
    }
}

// Buscar posts
function searchPosts(term) {
    appState.searchTerm = term.toLowerCase();
    appState.currentPage = 1;

    const baseArray = appState.currentCategory === 'all'
        ? appState.allPosts
        : appState.allPosts.filter(post => post.category.includes(appState.currentCategory));

    if (!term) {
        appState.filteredPosts = baseArray;
    } else {
        appState.filteredPosts = baseArray.filter(post =>
            post.title.toLowerCase().includes(term) ||
            post.excerpt.toLowerCase().includes(term) ||
            post.category.some(cat => cat.toLowerCase().includes(term))
        );
    }

    renderPosts();
}

// Actualizar breadcrumbs
function updateBreadcrumbs(category) {
    const breadcrumbs = document.getElementById('breadcrumbs');
    if (category === 'all') {
        breadcrumbs.innerHTML = '<span class="text-gray-500">Inicio</span>';
    } else {
        breadcrumbs.innerHTML = `
            <a href="#" class="text-accent-primary hover:underline" data-category="all">Inicio</a>
            <span class="text-gray-500 mx-2">/</span>
            <span class="text-gray-500">${category}</span>
        `;
    }
}

// Abrir post automáticamente si la URL tiene #post:slug
function handlePostHash() {
    const hash = window.location.hash;
    if (!hash.startsWith('#post:')) return;

    const slug = hash.replace('#post:', '');
    const post = appState.allPosts.find(p =>
        p.contentFile === `${slug}.md` || p.slug === slug
    );

    if (post) {
        // Pequeño delay para que el DOM esté listo
        setTimeout(() => openPost(post.contentFile, post.title), 300);
    }
}

// Cerrar overlay de lectura
function closeReadingOverlay() {
    const overlay = document.querySelector('.reading-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}

// Abrir post completo
async function openPost(contentFile, title) {
    incrementViewCount(contentFile);

    try {
        const response = await fetch(CONFIG.postsFolder + contentFile);
        const markdown = await response.text();
        const html = markdownToHTML(markdown);

        const currentPost = appState.allPosts.find(p => p.contentFile === contentFile);
        const postImage = currentPost ? `${CONFIG.imagesFolder}${currentPost.image}` : null;
        const postExcerpt = currentPost ? currentPost.excerpt : '';

        // URL de la página HTML dedicada del post (generada por el bot)
        const postSlug = contentFile.replace('.md', '');
        const postUrl = `${window.location.origin}${window.location.pathname.replace('index.html','').replace(/\/$/, '')}/p/${postSlug}.html`;
        const shareText = encodeURIComponent(title);
        const shareUrl  = encodeURIComponent(postUrl);

        const overlay = document.createElement('div');
        overlay.className = 'reading-overlay';

        overlay.innerHTML = `
            <!-- X roja fija, se mueve con el scroll -->
            <button onclick="closeReadingOverlay()"
                style="position:fixed;top:1.2rem;right:1.5rem;z-index:99999;
                       width:48px;height:48px;border-radius:50%;
                       background:#ef4444;border:none;cursor:pointer;
                       font-size:1.8rem;color:white;font-weight:bold;
                       display:flex;align-items:center;justify-content:center;
                       box-shadow:0 4px 16px rgba(239,68,68,0.5);
                       transition:background .2s,transform .2s;"
                onmouseover="this.style.background='#b91c1c';this.style.transform='scale(1.1)'"
                onmouseout="this.style.background='#ef4444';this.style.transform='scale(1)'">
                &#x2715;
            </button>

            <div style="width:100%;max-width:100%;padding:2rem 15%;box-sizing:border-box;font-size:1.15rem;line-height:1.9;">
                <h1 class="font-headline" style="font-size:2.4rem;line-height:1.2;color:#10b981;margin-bottom:1.5rem;">${title}</h1>

                ${postImage ? `<img src="${postImage}" alt="${title}"
                    style="width:100%;max-height:480px;object-fit:cover;border-radius:8px;margin-bottom:2rem;"
                    onerror="this.style.display='none'">` : ''}

                <div style="color:#cbd5e1;">
                    ${html}
                </div>

                <!-- Botones de compartir -->
                <div style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid #3a3a3a;">
                    <p style="font-size:.85rem;color:#94a3b8;margin-bottom:1rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;">Compartir noticia</p>
                    <div style="display:flex;gap:.75rem;flex-wrap:wrap;">

                        <!-- Copiar link -->
                        <button id="copy-link-btn" onclick="copyPostLink('${postUrl}')"
                            style="display:flex;align-items:center;gap:.5rem;padding:.6rem 1.1rem;
                                   border-radius:8px;border:1px solid #3a3a3a;background:#2a2a2a;
                                   color:#f1f5f9;font-size:.85rem;cursor:pointer;transition:all .2s;"
                            onmouseover="this.style.background='#3a3a3a'" onmouseout="this.style.background='#2a2a2a'">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                            Copiar link
                        </button>

                        <!-- WhatsApp -->
                        <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener"
                            style="display:flex;align-items:center;gap:.5rem;padding:.6rem 1.1rem;
                                   border-radius:8px;border:none;background:#25D366;
                                   color:white;font-size:.85rem;cursor:pointer;text-decoration:none;transition:opacity .2s;"
                            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                        </a>

                        <!-- X / Twitter -->
                        <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener"
                            style="display:flex;align-items:center;gap:.5rem;padding:.6rem 1.1rem;
                                   border-radius:8px;border:none;background:#000;
                                   color:white;font-size:.85rem;cursor:pointer;text-decoration:none;transition:opacity .2s;"
                            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            X
                        </a>

                        <!-- Facebook -->
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener"
                            style="display:flex;align-items:center;gap:.5rem;padding:.6rem 1.1rem;
                                   border-radius:8px;border:none;background:#1877F2;
                                   color:white;font-size:.85rem;cursor:pointer;text-decoration:none;transition:opacity .2s;"
                            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                        </a>

                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        // Bloquear scroll del body Y del html
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeReadingOverlay();
        });

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeReadingOverlay();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

    } catch (error) {
        console.error('Error al cargar el post:', error);
        alert('No se pudo cargar el artículo completo.');
    }
}

// Copiar link del post
function copyPostLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-link-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅ ¡Copiado!';
            btn.style.background = '#065f46';
            btn.style.borderColor = '#10b981';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.background = '#2a2a2a';
                btn.style.borderColor = '#3a3a3a';
            }, 2000);
        }
    }).catch(() => {
        // Fallback para navegadores sin clipboard API
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    });
}

// Convertir Markdown a HTML
// FIX: párrafos con \n simple, links planos clickeables, título h1 omitido (ya se muestra arriba)
function markdownToHTML(markdown) {
    let html = markdown;

    // Normalizar saltos de línea
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Headers (h1 se omite, ya se muestra en el overlay)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mb-3 mt-6 text-white">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mb-4 mt-8 text-accent-primary">$1</h2>');
    html = html.replace(/^# .*$/gim, '');

    // Separador ---
    html = html.replace(/^---$/gim, '<hr class="border-dark-600 my-8">');

    // Bold e Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f1f5f9;">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong style="color:#f1f5f9;">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code inline
    html = html.replace(/`(.*?)`/g, '<code style="background:#2a2a2a;padding:2px 6px;border-radius:4px;color:#10b981;">$1</code>');

    // Links markdown [texto](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" style="color:#10b981;text-decoration:underline;word-break:break-all;">$1</a>');

    // URLs planas (http/https que no están ya dentro de href)
    html = html.replace(/(?<![="'])(https?:\/\/[^\s<"'\]]+)/g,
        '<a href="$1" target="_blank" rel="noopener" style="color:#10b981;text-decoration:underline;word-break:break-all;">$1</a>');

    // Procesar línea por línea — cada línea no vacía es un párrafo independiente
    const lines = html.split('\n');
    const blocks = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('<h') || trimmed.startsWith('<hr')) {
            blocks.push(trimmed);
        } else {
            blocks.push(`<p style="margin-bottom:1.4rem;line-height:1.9;color:#cbd5e1;font-size:1.15rem;">${trimmed}</p>`);
        }
    }

    return blocks.join('\n');
}

// Utilidades
function getCategoryColor(category) {
    return categoryColors[category] || 'bg-gray-600';
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hace 1 día';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;

    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isPostNew(dateString) {
    const postDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - postDate) / (1000 * 60 * 60);
    return diffInHours < 48;
}

function getReadTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(' ').length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// Sistema de vistas (localStorage)
function getViewCount(postId) {
    const views = JSON.parse(localStorage.getItem('postViews') || '{}');
    return views[postId] || Math.floor(Math.random() * 10000) + 1000;
}

function incrementViewCount(postId) {
    const views = JSON.parse(localStorage.getItem('postViews') || '{}');
    views[postId] = (views[postId] || Math.floor(Math.random() * 10000)) + 1;
    localStorage.setItem('postViews', JSON.stringify(views));
}

function loadViewCounts() {
    const views = JSON.parse(localStorage.getItem('postViews') || '{}');
    appState.allPosts.forEach(post => {
        if (!views[post.contentFile]) {
            views[post.contentFile] = Math.floor(Math.random() * 50000) + 5000;
        }
    });
    localStorage.setItem('postViews', JSON.stringify(views));
}

// Botón volver arriba
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scroll-top');
    if (btn) {
        if (window.scrollY > 500) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        } else {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
        }
    }
});
