/**
 * @file module-category-ui.js
 * @description Gestor dedicado a la interfaz y lógicas visuales de los filtros / categorías / departamentos.
 */

import { showCatFeedback } from '../utils/ui-utils.js';

// --- Estado Encapsulado del Gestor ---
export const FILTER_ALL_KEY = '__ALL__';
window.FILTER_ALL_KEY = FILTER_ALL_KEY;
export const DEFAULT_CATEGORY = 'General';

window.activeFilters = window.activeFilters || [FILTER_ALL_KEY];
Object.defineProperty(window, '_activeFilters', { value: [FILTER_ALL_KEY], writable: true });

// --- Lógicas Core Visuales y de Colores ---
export function getDeterministicHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function getUserColor(username, currentUsername, baseColor = null) {
    if (username === 'Sistema' || username === 'TimeCode' || !username) return '#888888';
    const hash = getDeterministicHash(username);
    const finalBaseColor = (baseColor && baseColor.startsWith('#')) ? baseColor : '#7B68EE';
    const hsl = hexToHsl(finalBaseColor);
    const PHI = 0.618033988749895;
    const hShift = ((hash * PHI) % 1) * 40 - 20;
    const h = (hsl.h + hShift + 360) % 360;
    const sShift = ((hash * PHI * PHI) % 1) * 70 - 35;
    let s = hsl.s + sShift;
    s = Math.max(15, Math.min(100, s));
    const lShift = ((hash * PHI * PHI * PHI) % 1) * 60 - 30;
    let l = hsl.l + lShift;
    l = Math.max(30, Math.min(80, l));
    return hslToHex(h, s, l);
}

export function getCategoryInfo(categoryIdentifier, currentCategories) {
    if (categoryIdentifier === 'Todos') return { color: 'var(--accent-blue)', name: 'Todos' };
    const found = (currentCategories || []).find(c =>
        c.id === categoryIdentifier ||
        (c.name && categoryIdentifier && c.name.toLowerCase() === categoryIdentifier.toLowerCase())
    );
    if (found) return { color: found.color, name: found.name, id: found.id };
    return { color: 'var(--accent-primary)', name: categoryIdentifier, id: categoryIdentifier };
}

export function getCategoryColor(category, currentCategories) {
    return getCategoryInfo(category, currentCategories).color;
}

// --- Componentes Visuales: Filtros ---
export function filterMessages() {
    const messages = document.querySelectorAll('.message');
    const showAll = window.activeFilters.includes(FILTER_ALL_KEY);

    messages.forEach(msg => {
        const category = msg.getAttribute('data-category-id') || msg.getAttribute('data-category');
        if (showAll || window.activeFilters.includes(category)) {
            msg.style.display = '';
        } else {
            msg.style.display = 'none';
        }
    });

    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

export function createFilterBar(allUsersData = null, envState = {}) {
    // envState debe proveer currentCategories y localesData
    const currentCategories = envState.currentCategories || window.currentCategories || [];
    const localesData = envState.localesData || window.localesData || {};

    // Si no recibimos allUsersData, intentamos la caché global
    if (allUsersData === null) {
        allUsersData = window.lastUsersDataCache || [];
    } else {
        window.lastUsersDataCache = allUsersData;
    }

    const categoryFilterBar = document.getElementById('categoryFilterBar');
    if (!categoryFilterBar) return;

    categoryFilterBar.innerHTML = '';
    categoryFilterBar.style.display = 'flex';

    let globalCategoryIds = new Set();
    if (allUsersData && allUsersData.length > 0) {
        allUsersData.forEach(u => {
            // Categoría del usuario principal
            if (u.categoryIds && u.categoryIds.length > 0) {
                globalCategoryIds.add(u.categoryIds[0]);
            } else if (u.categories && u.categories.length > 0) {
                const info = getCategoryInfo(u.categories[0], currentCategories);
                if (info && info.id) globalCategoryIds.add(info.id);
            }
            
            // [v60] Extraer también las categorías de los subusuarios
            if (u.subUsers && Array.isArray(u.subUsers)) {
                u.subUsers.forEach(su => {
                    const suInfo = getCategoryInfo(su.category, currentCategories);
                    if (suInfo && suInfo.id) globalCategoryIds.add(suInfo.id);
                });
            }
        });
    }

    const categoryIdsList = Array.from(globalCategoryIds);
    const filters = [FILTER_ALL_KEY, ...categoryIdsList];
    const isMultiSelect = categoryIdsList.length > 2;

    window.activeFilters = window.activeFilters.filter(f => filters.includes(f));
    if (window.activeFilters.length === 0) window.activeFilters = [FILTER_ALL_KEY];

    filters.forEach(filterId => {
        const btn = document.createElement('button');
        const isAll = (filterId === FILTER_ALL_KEY);
        const isActive = window.activeFilters.includes(filterId);

        const catInfo = getCategoryInfo(filterId, currentCategories);

        btn.className = `filter-btn ${isActive ? 'active' : ''}`;
        btn.textContent = isAll ? (localesData?.chat?.filter_all || 'All') : catInfo.name;
        btn.dataset.filter = filterId;

        const bColor = catInfo.color;

        if (isActive) {
            btn.style.backgroundColor = bColor;
            btn.style.borderColor = bColor;
            btn.style.boxShadow = `0 0 10px ${bColor}`;
            btn.style.color = '#fff';
        } else {
            btn.style.backgroundColor = 'rgba(123, 104, 238, 0.05)';
            btn.style.borderColor = isAll ? 'var(--accent-blue)' : bColor;
            btn.style.color = isAll ? '#fff' : bColor;
        }

        btn.onclick = () => {
            if (filterId === FILTER_ALL_KEY) {
                window.activeFilters = [FILTER_ALL_KEY];
            } else {
                if (!isMultiSelect) {
                    window.activeFilters = [filterId];
                } else {
                    window.activeFilters = window.activeFilters.filter(f => f !== FILTER_ALL_KEY);
                    if (window.activeFilters.includes(filterId)) {
                        window.activeFilters = window.activeFilters.filter(f => f !== filterId);
                    } else {
                        window.activeFilters.push(filterId);
                    }
                }
            }
            if (window.activeFilters.length === 0) window.activeFilters = [FILTER_ALL_KEY];

            document.querySelectorAll('.filter-btn').forEach(b => {
                const bFilter = b.dataset.filter;
                const bActive = window.activeFilters.includes(bFilter);
                const info = getCategoryInfo(bFilter, currentCategories);
                const cColor = info.color;

                if (bActive) {
                    b.classList.add('active');
                    b.style.backgroundColor = cColor;
                    b.style.borderColor = cColor;
                    b.style.boxShadow = `0 0 10px ${cColor}`;
                    b.style.color = '#fff';
                } else {
                    b.classList.remove('active');
                    b.style.backgroundColor = 'rgba(123, 104, 238, 0.05)';
                    b.style.boxShadow = 'none';
                    b.style.borderColor = (bFilter === FILTER_ALL_KEY) ? 'var(--accent-blue)' : cColor;
                    b.style.color = (bFilter === FILTER_ALL_KEY) ? '#fff' : cColor;
                }
            });

            filterMessages();
            if (typeof window.refreshMasterAdminTable === 'function') {
                window.refreshMasterAdminTable();
            }
        };
        categoryFilterBar.appendChild(btn);
    });
}

// --- Componentes Visuales: Modal Administrativo (Master) ---

export function updateCategorySelect(currentCategories, currentLang, localesData) {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) return;
    const currentId = categorySelect.dataset.selectedId || categorySelect.value;
    const placeholderText = (localesData && localesData.interface) ? localesData.interface.select_category : (currentLang === 'es' ? 'Selecciona Dpto...' : 'Select category...');
    categorySelect.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;

    currentCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        opt.style.color = cat.color;
        categorySelect.appendChild(opt);
    });

    let selectionFound = false;
    if (currentId) {
        const exists = currentCategories.find(c => c.id === currentId || c.name === currentId);
        if (exists) {
            categorySelect.value = exists.id;
            categorySelect.dataset.selectedId = exists.id;
            selectionFound = true;
        }
    }
}

export function openCategoryManager(envState = {}) {
    let existing = document.getElementById('categoryManagerModal');
    if (existing) { existing.remove(); return; }

    const localesData = envState.localesData || window.localesData;
    const currentCategories = window.currentCategories || envState.currentCategories || [];
    envState.currentCategories = currentCategories;
    const maxCategories = envState.maxCategories || window.maxCategories || 25;
    const safeEmit = envState.safeEmit || window.safeEmit;

    const modal = document.createElement('div');
    modal.id = 'categoryManagerModal';
    modal.className = (window.openedFromSettings || envState.openedFromSettings) ? 'user-modal from-settings' : 'user-modal';
    modal.style.zIndex = '3000';

    const content = document.createElement('div');
    content.className = 'modal-content category-manager-content';

    const manageTitle = localesData?.control?.manage_categories || 'Gestionar Categorías';
    const catDesc = localesData?.control?.categories_description || 'Añade, edita o elimina departamentos';
    content.innerHTML = `
        <h2 class="modal-title-small">${manageTitle}</h2>
        <p class="modal-subtitle">${catDesc}. <span class="cat-counter">${currentCategories.length} / ${maxCategories}</span></p>
    `;

    const catList = document.createElement('div');
    catList.className = 'cat-manager-list';
    catList.id = 'catManagerList';
    renderCategoryManagerList(catList, envState);
    content.appendChild(catList);

    if (currentCategories.length < maxCategories) {
        const deptName = localesData?.control?.department_name || 'Nombre del departamento';
        const addForm = document.createElement('div');
        addForm.className = 'cat-add-form';
        addForm.innerHTML = `
            <div class="cat-add-row">
                <input type="text" id="newCatName" class="dict-input" placeholder="${deptName}" maxlength="30">
                <input type="color" id="newCatColor" class="cat-color-picker" value="#FF9800" title="Elegir color">
                <button id="btnAddCat" class="btn-add-tag" title="Añadir">+</button>
            </div>
        `;
        content.appendChild(addForm);
    }

    const syncBtnText = localesData?.control?.btn_close_sync || 'Cerrar y Sincronizar';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-start';
    closeBtn.style.cssText = 'width: 100%; margin-top: 15px;';
    closeBtn.textContent = syncBtnText;
    closeBtn.onclick = () => {
        modal.remove();
        if (window.openedFromSettings && window.settingsModal) {
            window.settingsModal.classList.add('no-fade');
            window.settingsModal.classList.remove('hidden');
            window.openedFromSettings = false;
        }
    };
    content.appendChild(closeBtn);
    modal.appendChild(content);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (window.openedFromSettings && window.settingsModal) {
                window.settingsModal.classList.add('no-fade');
                window.settingsModal.classList.remove('hidden');
                window.openedFromSettings = false;
            }
        }
    });

    document.body.appendChild(modal);

    const btnAddCat = document.getElementById('btnAddCat');
    const newCatName = document.getElementById('newCatName');
    const newCatColor = document.getElementById('newCatColor');
    if (btnAddCat && safeEmit) {
        btnAddCat.onclick = () => {
            const name = newCatName.value.trim();
            if (!name) { showCatFeedback('Escribe un nombre', 'error'); return; }
            
            const usernameInput = document.getElementById('usernameInput');
            const pinInput = document.getElementById('pinInput');
            const authUsername = window.currentUsername || (usernameInput ? usernameInput.value.trim() : '');
            const authPin = window.currentRoomPin || (pinInput ? pinInput.value.trim() : '');

            safeEmit('add-category', { name, color: newCatColor.value, authUsername, authPin }, (res) => {
                if (res.success) {
                    showCatFeedback(`"${name}" añadida ✓`, 'success');
                    newCatName.value = '';
                } else {
                    showCatFeedback(res.error, 'error');
                }
            });
        };
        newCatName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnAddCat.click();
        });
    }
}

export function renderCategoryManagerList(container = null, envState = {}) {
    if (!container) container = document.getElementById('catManagerList');
    if (!container) return;
    container.innerHTML = '';

    const currentCategories = window.currentCategories || envState.currentCategories || [];
    envState.currentCategories = currentCategories;
    const safeEmit = envState.safeEmit || window.safeEmit;
    const currentUser = envState.currentUser || (window.currentUsername ? { user: window.currentUsername } : null);
    const MASTER_USERNAME = envState.MASTER_USERNAME || window.MASTER_USERNAME;

    currentCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'cat-manager-item';
        item.innerHTML = `
            <div class="cat-item-info">
                <span class="cat-item-color" style="background: ${cat.color}"></span>
                <span class="cat-item-name">${cat.name}</span>
            </div>
            <div class="cat-item-actions">
                <button class="cat-btn-edit" title="Editar" data-id="${cat.id}">✏️</button>
                <button class="cat-btn-delete" title="Eliminar" data-id="${cat.id}">🗑️</button>
            </div>
        `;
        container.appendChild(item);

        item.querySelector('.cat-btn-edit').onclick = () => {
            openEditCategoryInline(item, cat, envState);
        };

        item.querySelector('.cat-btn-delete').onclick = () => {
            // Permitir borrar siempre que sea Master o MasterCandidate
            const isMaster = window.isMaster || window.isMasterCandidate || (currentUser && currentUser.user === MASTER_USERNAME);
            if (currentCategories.length <= 1 && !isMaster) {
                showCatFeedback('Debe haber al menos 1 categoría', 'error');
                return;
            }
            if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
            
            const usernameInput = document.getElementById('usernameInput');
            const pinInput = document.getElementById('pinInput');
            const authUsername = window.currentUsername || (usernameInput ? usernameInput.value.trim() : '');
            const authPin = window.currentRoomPin || (pinInput ? pinInput.value.trim() : '');

            if (safeEmit) {
                safeEmit('delete-category', { id: cat.id, authUsername, authPin }, (res) => {
                    if (res.success) {
                        showCatFeedback(`"${cat.name}" eliminada ✓`, 'success');
                    } else {
                        showCatFeedback(res.error, 'error');
                    }
                });
            }
        };
    });
}

export function openEditCategoryInline(itemElement, cat, envState = {}) {
    const safeEmit = envState.safeEmit || window.safeEmit;
    itemElement.innerHTML = `
        <div class="cat-edit-row">
            <input type="text" class="dict-input cat-edit-input" value="${cat.name}" maxlength="30">
            <input type="color" class="cat-color-picker" value="${cat.color}" title="Color">
            <button class="cat-btn-save" title="Guardar">✓</button>
            <button class="cat-btn-cancel" title="Cancelar">✕</button>
        </div>
    `;

    const input = itemElement.querySelector('.cat-edit-input');
    const colorInput = itemElement.querySelector('.cat-color-picker');
    input.focus();
    input.select();

    const save = () => {
        const newName = input.value.trim();
        if (!newName) { showCatFeedback('El nombre no puede estar vacío', 'error'); return; }
        
        const usernameInput = document.getElementById('usernameInput');
        const pinInput = document.getElementById('pinInput');
        const authUsername = window.currentUsername || (usernameInput ? usernameInput.value.trim() : '');
        const authPin = window.currentRoomPin || (pinInput ? pinInput.value.trim() : '');

        if (safeEmit) {
            safeEmit('edit-category', { id: cat.id, name: newName, color: colorInput.value, authUsername, authPin }, (res) => {
                if (res.success) {
                    showCatFeedback(`Categoría actualizada ✓`, 'success');
                    const btnSave = itemElement.querySelector('.cat-btn-save');
                    if (btnSave) {
                        btnSave.style.backgroundColor = 'var(--success, #4CAF50)';
                        btnSave.style.color = '#fff';
                        btnSave.style.borderColor = 'var(--success, #4CAF50)';
                    }
                    setTimeout(() => {
                        renderCategoryManagerList(null, envState);
                    }, 400);
                } else {
                    showCatFeedback(res.error, 'error');
                }
            });
        }
    };

    itemElement.querySelector('.cat-btn-save').onclick = save;
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') save(); });
    itemElement.querySelector('.cat-btn-cancel').onclick = () => {
        renderCategoryManagerList(null, envState);
    };
}
