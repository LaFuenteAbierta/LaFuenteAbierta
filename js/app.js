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
    
    // Ordenar por vistas
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
    
    // Botón anterior
    if (appState.currentPage > 1) {
        const prevBtn = createPageButton('‹ Anterior', appState.currentPage - 1);
        container.appendChild(prevBtn);
    }
    
    // Números de página
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
    
    // Botón siguiente
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
    // Filtrado por categoría
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-category]')) {
            e.preventDefault();
            const category = e.target.dataset.category;
            filterByCategory(category);
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Actualizar breadcrumbs
            updateBreadcrumbs(category);
            
            // Scroll suave al inicio
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Búsqueda
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
    
    // Aplicar búsqueda si existe
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

// Abrir post completo
async function openPost(contentFile, title) {
    incrementViewCount(contentFile);
    
    try {
        const response = await fetch(CONFIG.postsFolder + contentFile);
        const markdown = await response.text();
        const html = markdownToHTML(markdown);
        
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'reading-overlay';
        overlay.innerHTML = `
            <div class="reading-content">
                <button onclick="this.parentElement.parentElement.remove(); document.body.style.overflow = 'auto'" class="float-right text-gray-400 hover:text-white text-3xl leading-none">
                    &times;
                </button>
                <h1 class="font-headline text-4xl mb-6 text-accent-primary">${title}</h1>
                <div class="prose prose-invert max-w-none">
                    ${html}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        // Cerrar al hacer clic fuera
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                document.body.style.overflow = 'auto';
            }
        });
        
        // Cerrar con tecla ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.body.style.overflow = 'auto';
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
    } catch (error) {
        console.error('Error al cargar el post:', error);
        alert('No se pudo cargar el artículo completo.');
    }
}

// Convertir Markdown a HTML (básico)
function markdownToHTML(markdown) {
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mb-3 mt-6">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mb-4 mt-8">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mb-6 mt-10">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Code inline
    html = html.replace(/`(.*?)`/g, '<code class="bg-dark-700 px-2 py-1 rounded text-accent-primary">$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent-primary hover:underline">$1</a>');
    
    // Paragraphs
    html = html.split('\n\n').map(p => p.trim() ? `<p class="mb-4">${p}</p>` : '').join('\n');
    
    return html;
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
    return diffInHours < 48; // Nuevo si tiene menos de 48 horas
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
    return views[postId] || Math.floor(Math.random() * 10000) + 1000; // Simulado
}

function incrementViewCount(postId) {
    const views = JSON.parse(localStorage.getItem('postViews') || '{}');
    views[postId] = (views[postId] || Math.floor(Math.random() * 10000)) + 1;
    localStorage.setItem('postViews', JSON.stringify(views));
}

function loadViewCounts() {
    // Inicializar vistas simuladas si no existen
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