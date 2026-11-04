/**
 * Talk-me Module: Master Administration UI
 * Handles the user management table, kick actions, and real-time session timers.
 * [v59.REVERSED to Bridge Mode]
 */

class MasterAdminUI {
    constructor() {
        this.lastUsersData = [];
        this.sessionTimer = null;
    }

    /**
     * Inicializa el módulo.
     */
    init() {
        this.startSessionTimer();
    }

    /**
     * Sincroniza la tabla de administración Master.
     * @param {Array} users - Lista de usuarios del servidor.
     * @param {boolean} isMaster - Estado de autoridad del usuario actual.
     */
    updateUserTable(users = null, isMaster = true) {
        if (!isMaster) return; 
        
        if (users) {
            this.lastUsersData = users;
        } else {
            users = this.lastUsersData;
        }
        
        if (!users || users.length === 0) return;

        const body = document.getElementById('userManagementBody');
        if (!body) return;

        // [v60] En la tabla Master NO filtramos. El Master debe ver a todos para gestionarlos.
        body.innerHTML = '';

        users.forEach(u => {
            if (!u) return;

            const username = typeof u === 'string' ? u : (u.username || 'Anónimo');
            const userId = typeof u === 'string' ? null : u.id;
            const userCategories = (u.categories && u.categories.length > 0) ? u.categories : ['General'];

            const tr = document.createElement('tr');

            // 1. Usuario (Color dinámico sincronizado)
            const tdUser = document.createElement('td');
            const userCat = (u.categories && u.categories.length > 0) ? u.categories[0] : null;
            const catNameStr = typeof userCat === 'object' ? userCat.name : userCat;
            
            const userColor = typeof window.getUserColor === 'function' 
                ? window.getUserColor(username, catNameStr) 
                : '#fff';
            
            tdUser.innerHTML = `<span style="color: ${userColor}; font-weight: 600;">${username}</span>`;
            tr.appendChild(tdUser);

            // 2. Categoría (Estilo Avanzado)
            const tdCat = document.createElement('td');
            userCategories.forEach(catItem => {
                const name = typeof catItem === 'object' ? catItem.name : catItem;
                const officialCat = typeof window.getCategoryInfo === 'function' ? window.getCategoryInfo(name) : { name: name, color: '#888' };
                
                const tag = document.createElement('small');
                tag.className = 'category-tag-inline';
                const tagColor = officialCat.color || 'var(--text-secondary)';
                tag.style.color = tagColor;
                tag.style.border = `1px solid ${tagColor}`;
                tag.style.background = 'rgba(255, 255, 255, 0.05)';
                tag.style.padding = '2px 6px';
                tag.style.borderRadius = '4px';
                tag.style.fontSize = '10px';
                tag.style.textTransform = 'uppercase';
                tag.style.fontWeight = '700';
                tag.textContent = name;
                tdCat.appendChild(tag);
            });
            tr.appendChild(tdCat);

            // 3. Sub-Usr (moved after Categoría)
            const tdSubUsr = document.createElement('td');
            const subCount = u.subUsers ? u.subUsers.length : 0;
            tdSubUsr.innerHTML = subCount > 0 ? `<span style="color: var(--accent-blue); font-weight: 700;">${subCount}</span>` : `<span style="color: var(--text-secondary); opacity: 0.5;">0</span>`;
            tr.appendChild(tdSubUsr);

            // 4. Idioma
            const tdLang = document.createElement('td');
            tdLang.innerHTML = `<span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">${(u.lang || 'es').toUpperCase()}</span>`;
            tr.appendChild(tdLang);

            // 5. Trad. Activa
            const tdAutoTrans = document.createElement('td');
            if (u.autoTranslate && u.enabledLangs && u.enabledLangs.length > 0) {
                // Generar badges para cada idioma activo en el filtro
                tdAutoTrans.innerHTML = u.enabledLangs.map(l => 
                    `<small class="category-tag-inline" style="color: #4ade80; border: 1px solid #4ade80; background: rgba(74, 222, 128, 0.05); padding: 2px 4px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-right: 2px;">${l.toUpperCase()}</small>`
                ).join('');
            } else if (u.autoTranslate) {
                // Fallback si no hay enabledLangs pero está activo (usar el propio del sistema)
                tdAutoTrans.innerHTML = `<small class="category-tag-inline" style="color: #4ade80; border: 1px solid #4ade80; background: rgba(74, 222, 128, 0.05); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${(u.lang || 'es').toUpperCase()}</small>`;
            } else {
                tdAutoTrans.textContent = '';
            }
            tr.appendChild(tdAutoTrans);

            // 6. Msgs
            const tdMsgs = document.createElement('td');
            tdMsgs.textContent = u.msgCount || 0;
            tr.appendChild(tdMsgs);

            // 7. Fotos
            const tdPhotos = document.createElement('td');
            const photoCount = u.photoCount || 0;
            tdPhotos.innerHTML = photoCount > 0 ? `<span style="color: var(--accent-orange); font-weight: 700;">${photoCount}</span>` : `<span style="color: var(--text-secondary); opacity: 0.5;">0</span>`;
            tr.appendChild(tdPhotos);

            // 8. Triggers
            const tdTriggers = document.createElement('td');
            const triggerCount = u.triggerCount || 0;
            tdTriggers.innerHTML = triggerCount > 0 ? `<span style="color: #c084fc; font-weight: 700;">${triggerCount}</span>` : `<span style="color: var(--text-secondary); opacity: 0.5;">0</span>`;
            tr.appendChild(tdTriggers);

            // 9. Sesión
            const tdSes = document.createElement('td');
            tdSes.className = 'admin-session-time';
            tdSes.dataset.joinedAt = u.joinedAt || Date.now();
            this.updateSessionText(tdSes);
            tr.appendChild(tdSes);

            // 4. Acción (Kick)
            const tdAct = document.createElement('td');
            
            // [v60] El Master no puede expulsarse a sí mismo (Protección de Asiento)
            const isUserMaster = u.isMaster || (username === window.MASTER_USERNAME);
            const isMe = userId === (window.socket ? window.socket.id : null);

            if (userId && !isUserMaster && !isMe) {
                const btnKick = document.createElement('button');
                btnKick.className = 'btn-kick-small';
                btnKick.title = 'Expulsar permanentemente';
                btnKick.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                `;
                btnKick.onclick = (e) => {
                    e.stopPropagation();
                    const title = window.localesData?.kicked?.title || 'Expulsar Usuario';
                    const msg = (window.localesData?.interface?.confirm_kick_user || '¿Expulsar a "{name}" definitivamente de esta sala?').replace('{name}', username);
                    if (typeof window.showCustomConfirm === 'function') {
                        window.showCustomConfirm(title, msg, () => {
                            if (window.safeEmit) window.safeEmit('kick-user', userId);
                        });
                    } else {
                        if (confirm(msg)) {
                            if (window.safeEmit) window.safeEmit('kick-user', userId);
                        }
                    }
                };
                tdAct.appendChild(btnKick);
            }
            tr.appendChild(tdAct);

            body.appendChild(tr);
        });
    }

    /**
     * Motor de sincronización temporal real-time.
     */
    startSessionTimer() {
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        this.sessionTimer = setInterval(() => {
            const sessionCells = document.querySelectorAll('.admin-session-time');
            sessionCells.forEach(cell => this.updateSessionText(cell));
        }, 1000);
    }

    updateSessionText(cell) {
        const joinedAt = parseInt(cell.dataset.joinedAt);
        const elapsedMs = Date.now() - joinedAt;
        const min = Math.floor(elapsedMs / 60000);
        const sec = Math.floor((elapsedMs % 60000) / 1000);
        cell.textContent = `${min}m ${sec < 10 ? '0' : ''}${sec}s`;
    }

    /**
     * [v60.1-INDUSTRIAL] Monitor de salud en tiempo real para el Master.
     * Inyecta un badge flotante con métricas de latencia y carga.
     */
    updateMasterHealthUI(metrics) {
        let badge = document.getElementById('masterHealthBadge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'masterHealthBadge';
            badge.className = 'master-health-badge';
            document.body.appendChild(badge);
            
            // Inyectar estilos mínimos necesarios si no existen
            if (!document.getElementById('masterHealthStyles')) {
                const style = document.createElement('style');
                style.id = 'masterHealthStyles';
                style.textContent = `
                    .master-health-badge {
                        position: fixed;
                        bottom: 85px;
                        right: 20px;
                        background: rgba(10, 15, 28, 0.9);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        padding: 8px 12px;
                        font-family: 'Inter', sans-serif;
                        font-size: 11px;
                        color: #fff;
                        z-index: 10000;
                        backdrop-filter: blur(10px);
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                        pointer-events: none;
                        transition: all 0.3s ease;
                        opacity: 0.8;
                    }
                    .health-item { display: flex; justify-content: space-between; gap: 15px; }
                    .health-label { color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; }
                    .health-value { font-weight: 700; font-variant-numeric: tabular-nums; }
                    .status-green { color: #4ade80; }
                    .status-yellow { color: #fbbf24; }
                    .status-red { color: #f87171; }
                `;
                document.head.appendChild(style);
            }
        }

        const latency = metrics.inferenceTime || 0;
        const slots = metrics.activeSlots || 0;
        const maxSlots = metrics.maxSlots || 8;

        const latencyClass = latency < 150 ? 'status-green' : (latency < 300 ? 'status-yellow' : 'status-red');
        const slotsClass = slots < (maxSlots * 0.7) ? 'status-green' : 'status-red';

        badge.innerHTML = `
            <div class="health-item">
                <span class="health-label">Vosk Latency</span>
                <span class="health-value ${latencyClass}">${latency}ms</span>
            </div>
            <div class="health-item">
                <span class="health-label">Vosk Load</span>
                <span class="health-value ${slotsClass}">${slots}/${maxSlots} Slots</span>
            </div>
        `;
    }
}

const masterAdminUI = new MasterAdminUI();
// Exponer al scope global para SocketHandlers
window.updateMasterHealthUI = (m) => masterAdminUI.updateMasterHealthUI(m);
export default masterAdminUI;
