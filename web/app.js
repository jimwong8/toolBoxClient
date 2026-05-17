// Web3ToolBox Web Dashboard - Main Application (No Router)
const { useState, useEffect, useCallback, createContext, useContext } = React;

// ============================================================
// API Client
// ============================================================
const API = {
    async _request(method, path, body) {
        const url = `/${path}`;
        const config = { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined };
        try {
            const res = await fetch(url, config);
            return await res.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    },
    get(path) { return this._request('GET', path); },
    post(path, body) { return this._request('POST', path, body); },
    delete(path, body) { return this._request('DELETE', path, body); },
    getFingerPrints() { return this.get('api/getFingerPrints'); },
    getFingerPrintCount() { return this.get('api/getFingerPrintCount'); },
    generateFingerPrints(counts) { return this.post('api/generateFingerPrints', { counts }); },
    deleteFingerPrints(ids) { return this.post('api/deleteFingerPrints', { ids }); },
    clearFingerPrints() { return this.get('api/clearFingerPrints'); },
    updateFingerPrintName(id, name) { return this.post('api/updateFingerPrintName', { id, name }); },
    updateFingerPrintProxy(id, proxy) { return this.post('api/updateFingerPrintProxy', { id, proxy }); },
    deleteFingerPrintProxy(id) { return this.post('api/deleteFingerPrintProxy', { id }); },
    getAllWallets() { return this.get('api/getAllWallets'); },
    createWallets(count) { return this.post('api/createWallet', { count }); },
    deleteWallets(ids) { return this.delete('api/deleteWallets', { ids }); },
    updateWalletName(id, name) { return this.post('api/updateWalletName', { id, name }); },
    initWallets(ids) { return this.post('api/initWallets', { ids }); },
    openWallets(ids) { return this.post('api/openWallets', { ids }); },
    exportWallets(ids, directory) { return this.post('api/exportWallets', { ids, directory }); },
    bindWalletEnv(walletId, envId) { return this.post('api/bindWalletEnv', { walletId, envId }); },
    getAllTasks(dt) { return this.get('api/getAllTasks?defaultTask=' + dt); },
    execTask(name, data) { return this.post('api/execTask', { taskName: name, taskData: data }); },
    deleteTask(names) { return this.delete('api/deleteTask', { taskNames: names }); },
    getSavePath() { return this.get('api/getSavePath'); },
    setSavePath(path) { return this.post('api/setSavePath', { path }); },
    getChromePath() { return this.get('api/getChromePath'); },
    setChromePath(path) { return this.post('api/setChromePath', { path }); },
    runInstaller() { return this.post('api/runInstaller'); },
    checkReadiness() { return this.get('api/readiness'); },
    checkProxy(params) { return this.post('api/checkProxy', params); },
};

// ============================================================
// Toast Context
// ============================================================
const ToastContext = createContext();
function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);
    return React.createElement(ToastContext.Provider, { value: showToast }, children,
        React.createElement('div', { className: 'toast-container' },
            toasts.map(t => React.createElement('div', { key: t.id, className: `web-toast ${t.type}` },
                t.type === 'success' && React.createElement('i', { className: 'bi bi-check-circle' }),
                t.type === 'error' && React.createElement('i', { className: 'bi bi-x-circle' }),
                t.type === 'warning' && React.createElement('i', { className: 'bi bi-exclamation-triangle' }),
                t.type === 'info' && React.createElement('i', { className: 'bi bi-info-circle' }),
                t.message
            ))
        )
    );
}
function useToast() { return useContext(ToastContext); }

// ============================================================
// Sidebar
// ============================================================
function Sidebar({ collapsed, setCollapsed, currentPage, onNavigate }) {
    const menuItems = [
        { id: 'dashboard', icon: 'bi-speedometer2', label: '仪表盘' },
        { id: 'chromeManager', icon: 'bi-globe', label: '浏览器管理' },
        { id: 'walletManage', icon: 'bi-wallet2', label: '钱包管理' },
        { id: 'syncFunction', icon: 'bi-arrow-repeat', label: '同步功能' },
        { id: 'taskManage', icon: 'bi-list-check', label: '任务管理' },
        { id: 'aiAgents', icon: 'bi-robot', label: 'AI Agents' },
    ];
    return React.createElement('nav', { className: `web-sidebar ${collapsed ? 'collapsed' : ''}` },
        React.createElement('div', { className: 'sidebar-brand' },
            React.createElement('i', { className: 'bi bi-box-seam', style: { fontSize: '1.4rem', color: '#5A67D8' } }),
            React.createElement('span', null, 'Web3ToolBox')
        ),
        React.createElement('div', { className: 'sidebar-section' }, '主要功能'),
        menuItems.map(item =>
            React.createElement('div', { key: item.id, className: `nav-item ${currentPage === item.id ? 'active' : ''}`, onClick: () => onNavigate(item.id) },
                React.createElement('i', { className: `bi ${item.icon}` }),
                React.createElement('span', null, item.label)
            )
        ),
        React.createElement('div', { className: 'sidebar-divider' }),
        React.createElement('div', { className: 'sidebar-section' }, '系统'),
        React.createElement('div', { className: 'nav-item', onClick: () => window.open('https://web3toolbox.app', '_blank') },
            React.createElement('i', { className: 'bi bi-globe2' }),
            React.createElement('span', null, '官方网站')
        )
    );
}

// ============================================================
// Top Bar
// ============================================================
function TopBar({ pageTitle, collapsed, setCollapsed, serverStatus }) {
    return React.createElement('div', { className: 'web-topbar' },
        React.createElement('button', { className: 'toggle-btn', onClick: () => setCollapsed(!collapsed) },
            React.createElement('i', { className: collapsed ? 'bi bi-list' : 'bi bi-list-nested' })
        ),
        React.createElement('span', { className: 'page-title' }, pageTitle),
        React.createElement('div', { className: 'topbar-right' },
            React.createElement('div', { className: 'server-status' },
                React.createElement('div', { className: `dot ${serverStatus ? '' : 'offline'}` }),
                serverStatus ? '服务在线' : '服务离线'
            )
        )
    );
}

// ============================================================
// Dashboard Page
// ============================================================
function DashboardPage() {
    const [stats, setStats] = useState({ fingerprints: 0, wallets: 0, tasks: 0 });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([API.getFingerPrintCount(), API.getAllWallets(), API.getAllTasks(false)])
            .then(([fp, wallets, tasks]) => {
                let fpCount = 0;
            if (fp.success) {
                if (typeof fp.count === 'number') fpCount = fp.count;
                else if (typeof fp.message === 'number') fpCount = fp.message;
                else if (typeof fp.data === 'number') fpCount = fp.data;
            }
                setStats({ fingerprints: fpCount, wallets: Array.isArray(wallets) ? wallets.length : 0, tasks: Array.isArray(tasks) ? tasks.length : 0 });
                setLoading(false);
            }).catch(() => setLoading(false));
    }, []);
    if (loading) return React.createElement('div', { className: 'loading-overlay' }, React.createElement('div', { className: 'loading-spinner' }));
    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, '仪表盘'),
        React.createElement('div', { className: 'stats-grid' },
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-icon blue' }, React.createElement('i', { className: 'bi bi-fingerprint' })),
                React.createElement('div', { className: 'stat-info' }, React.createElement('div', { className: 'stat-value' }, stats.fingerprints), React.createElement('div', { className: 'stat-label' }, '指纹环境'))
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-icon green' }, React.createElement('i', { className: 'bi bi-wallet2' })),
                React.createElement('div', { className: 'stat-info' }, React.createElement('div', { className: 'stat-value' }, stats.wallets), React.createElement('div', { className: 'stat-label' }, '钱包数量'))
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-icon orange' }, React.createElement('i', { className: 'bi bi-list-check' })),
                React.createElement('div', { className: 'stat-info' }, React.createElement('div', { className: 'stat-value' }, stats.tasks), React.createElement('div', { className: 'stat-label' }, '任务数量'))
            ),
            React.createElement('div', { className: 'stat-card' },
                React.createElement('div', { className: 'stat-icon cyan' }, React.createElement('i', { className: 'bi bi-hdd-stack' })),
                React.createElement('div', { className: 'stat-info' }, React.createElement('div', { className: 'stat-value' }, 'Web'), React.createElement('div', { className: 'stat-label' }, '运行模式'))
            )
        )
    );
}

// ============================================================
// ChromeManager Page
// ============================================================
function ChromeManagerPage() {
    const [fingerprints, setFingerprints] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [installStatus, setInstallStatus] = useState('idle');
    const [chromePath, setChromePath] = useState('');
    const [savePath, setSavePath] = useState('');
    const [genCount, setGenCount] = useState(10);
    const toast = useToast();

    const fetchData = useCallback(async () => {
        const [fpRes, pathRes, chromeRes] = await Promise.all([API.getFingerPrints(), API.getSavePath(), API.getChromePath()]);
        if (fpRes.success) {
            if (fpRes.data) setFingerprints(Object.values(fpRes.data));
            else if (Array.isArray(fpRes)) setFingerprints(fpRes);
        }
        if (pathRes.path) setSavePath(pathRes.path);
        if (chromeRes.path) setChromePath(chromeRes.path);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleGenerate = async () => {
        const res = await API.generateFingerPrints(genCount);
        if (res.success) { toast('成功生成 ' + genCount + ' 个指纹', 'success'); fetchData(); }
        else toast(res.message || '生成失败', 'error');
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    const res = await fetch('/api/loadFingerPrints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: JSON.stringify(data) }) });
                    const result = await res.json();
                    if (result.success) { toast('指纹导入成功', 'success'); fetchData(); }
                    else toast(result.message || '导入失败', 'error');
                } catch (err) { toast('文件格式错误: ' + err.message, 'error'); }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleExport = async () => {
        const res = await API.getFingerPrints();
        if (res.success && res.data) {
            const arr = Object.values(res.data);
            const data = JSON.stringify(arr, null, 2);
            const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'fingerprints_' + Date.now() + '.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
            toast('指纹导出成功 (' + arr.length + ' 个)', 'success');
        } else { toast('导出失败', 'error'); }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) { toast('请选择要删除的指纹', 'warning'); return; }
        if (!confirm('确认删除选中的 ' + selectedIds.length + ' 个指纹？')) return;
        const res = await API.deleteFingerPrints(selectedIds);
        if (res.success) { toast('删除成功', 'success'); setSelectedIds([]); fetchData(); }
        else toast(res.message || '删除失败', 'error');
    };

    const handleInstall = async () => {
        setInstallStatus('installing');
        const res = await API.runInstaller();
        if (res.success) { toast('浏览器安装成功', 'success'); setInstallStatus('success'); }
        else { toast(res.message || '安装失败', 'error'); setInstallStatus('error'); }
    };

    if (loading) return React.createElement('div', { className: 'loading-overlay' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, '浏览器管理'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, React.createElement('span', null, '浏览器安装'), React.createElement('span', { className: `badge ${chromePath ? 'bg-success' : 'bg-warning'}` }, chromePath ? '已安装' : '未安装')),
            React.createElement('div', { className: 'card-body' },
                chromePath && React.createElement('div', { className: 'mb-3' }, React.createElement('small', { className: 'text-muted' }, 'Chrome 路径: '), React.createElement('code', null, chromePath)),
                React.createElement('button', { className: 'btn btn-primary', onClick: handleInstall, disabled: installStatus === 'installing' },
                    installStatus === 'installing' ? React.createElement(React.Fragment, null, React.createElement('span', { className: 'spinner-border spinner-border-sm me-1' }), '安装中...') : React.createElement(React.Fragment, null, React.createElement('i', { className: 'bi bi-download me-1' }), '安装浏览器')
                )
            )
        ),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, '保存路径'),
            React.createElement('div', { className: 'card-body' }, React.createElement('div', { className: 'd-flex align-items-center gap-2' }, React.createElement('i', { className: 'bi bi-folder' }), React.createElement('code', null, savePath || '未配置')))
        ),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, React.createElement('span', null, '指纹管理'), React.createElement('span', { className: 'badge bg-primary' }, fingerprints.length + ' 个指纹')),
            React.createElement('div', { className: 'card-body' },
                React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' } },
                    React.createElement('div', { className: 'input-group', style: { width: 'auto' } },
                        React.createElement('span', { className: 'input-group-text' }, '数量'),
                        React.createElement('input', { type: 'number', className: 'form-control', style: { width: '80px' }, value: genCount, min: 1, max: 1000, onChange: e => setGenCount(parseInt(e.target.value) || 1) })
                    ),
                    React.createElement('button', { className: 'btn btn-primary btn-sm', onClick: handleGenerate }, React.createElement('i', { className: 'bi bi-plus-circle me-1' }), '生成指纹'),
                    React.createElement('button', { className: 'btn btn-success btn-sm', onClick: handleImport }, React.createElement('i', { className: 'bi bi-upload me-1' }), '导入指纹'),
                    React.createElement('button', { className: 'btn btn-info btn-sm', onClick: handleExport }, React.createElement('i', { className: 'bi bi-download me-1' }), '导出指纹'),
                    React.createElement('button', { className: 'btn btn-danger btn-sm', onClick: handleDeleteSelected, disabled: selectedIds.length === 0 }, React.createElement('i', { className: 'bi bi-trash me-1' }), '删除选中 (' + selectedIds.length + ')')
                ),
                fingerprints.length > 0
                    ? React.createElement('div', { style: { overflowX: 'auto' } },
                        React.createElement('table', { className: 'web-table' },
                            React.createElement('thead', null, React.createElement('tr', null,
                                React.createElement('th', null, React.createElement('input', { type: 'checkbox', checked: selectedIds.length === fingerprints.length, onChange: e => setSelectedIds(e.target.checked ? fingerprints.map(fp => fp.id || fp._id) : []) })),
                                React.createElement('th', null, '名称'), React.createElement('th', null, 'User Agent'), React.createElement('th', null, '平台'), React.createElement('th', null, '代理'), React.createElement('th', null, '创建时间')
                            )),
                            React.createElement('tbody', null, fingerprints.map(fp => {
                                const id = fp.id || fp._id;
                                return React.createElement('tr', { key: id },
                                    React.createElement('td', null, React.createElement('input', { type: 'checkbox', checked: selectedIds.includes(id), onChange: e => setSelectedIds(e.target.checked ? [...selectedIds, id] : selectedIds.filter(sid => sid !== id)) })),
                                    React.createElement('td', null, fp.name || id.substring(0, 8)),
                                    React.createElement('td', null, (fp.user_agent || '-').substring(0, 50) + '...'),
                                    React.createElement('td', null, fp.platform || '-'),
                                    React.createElement('td', null, fp.proxy ? React.createElement('span', { className: 'badge bg-success' }, '已配置') : React.createElement('span', { className: 'badge bg-secondary' }, '无')),
                                    React.createElement('td', null, fp.createdAt ? new Date(fp.createdAt).toLocaleDateString() : '-')
                                );
                            }))
                        )
                    )
                    : React.createElement('div', { className: 'text-center text-muted py-5' }, React.createElement('i', { className: 'bi bi-inbox', style: { fontSize: '2rem' } }), React.createElement('p', { className: 'mt-2' }, '暂无指纹数据'))
            )
        )
    );
}

// ============================================================
// WalletManager Page
// ============================================================
function WalletManagerPage() {
    const [wallets, setWallets] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createCount, setCreateCount] = useState(5);
    const toast = useToast();

    const fetchData = useCallback(async () => {
        const res = await API.getAllWallets();
        if (Array.isArray(res)) setWallets(res);
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        const res = await API.createWallets(createCount);
        if (res.success) { toast('成功创建 ' + createCount + ' 个钱包', 'success'); fetchData(); }
        else toast(res.message || '创建失败', 'error');
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) { toast('请选择要删除的钱包', 'warning'); return; }
        if (!confirm('确认删除选中的 ' + selectedIds.length + ' 个钱包？')) return;
        const res = await API.deleteWallets(selectedIds);
        if (res.success) { toast('删除成功', 'success'); setSelectedIds([]); fetchData(); }
        else toast(res.message || '删除失败', 'error');
    };

    if (loading) return React.createElement('div', { className: 'loading-overlay' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, '钱包管理'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, React.createElement('span', null, '钱包列表'), React.createElement('span', { className: 'badge bg-primary' }, wallets.length + ' 个钱包')),
            React.createElement('div', { className: 'card-body' },
                React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' } },
                    React.createElement('div', { className: 'input-group', style: { width: 'auto' } },
                        React.createElement('span', { className: 'input-group-text' }, '数量'),
                        React.createElement('input', { type: 'number', className: 'form-control', style: { width: '80px' }, value: createCount, min: 1, max: 100, onChange: e => setCreateCount(parseInt(e.target.value) || 1) })
                    ),
                    React.createElement('button', { className: 'btn btn-primary btn-sm', onClick: handleCreate }, React.createElement('i', { className: 'bi bi-plus-circle me-1' }), '创建钱包'),
                    React.createElement('button', { className: 'btn btn-danger btn-sm', onClick: handleDelete, disabled: selectedIds.length === 0 }, React.createElement('i', { className: 'bi bi-trash me-1' }), '删除选中 (' + selectedIds.length + ')')
                ),
                wallets.length > 0
                    ? React.createElement('div', { style: { overflowX: 'auto' } },
                        React.createElement('table', { className: 'web-table' },
                            React.createElement('thead', null, React.createElement('tr', null,
                                React.createElement('th', null, React.createElement('input', { type: 'checkbox', checked: selectedIds.length === wallets.length, onChange: e => setSelectedIds(e.target.checked ? wallets.map(w => w.id) : []) })),
                                React.createElement('th', null, '名称'), React.createElement('th', null, 'ETH 地址'), React.createElement('th', null, 'SOL 地址'), React.createElement('th', null, '状态'), React.createElement('th', null, '绑定环境')
                            )),
                            React.createElement('tbody', null, wallets.map(w => React.createElement('tr', { key: w.id },
                                React.createElement('td', null, React.createElement('input', { type: 'checkbox', checked: selectedIds.includes(w.id), onChange: e => setSelectedIds(e.target.checked ? [...selectedIds, w.id] : selectedIds.filter(id => id !== w.id)) })),
                                React.createElement('td', null, w.name || '-'),
                                React.createElement('td', null, React.createElement('code', null, (w.ethAddress || '-').substring(0, 12) + '...')),
                                React.createElement('td', null, React.createElement('code', null, (w.solAddress || '-').substring(0, 12) + '...')),
                                React.createElement('td', null, w.walletInitialized ? React.createElement('span', { className: 'badge bg-success' }, '已初始化') : React.createElement('span', { className: 'badge bg-warning' }, '未初始化')),
                                React.createElement('td', null, w.bindEnvId || '-')
                            )))
                        )
                    )
                    : React.createElement('div', { className: 'text-center text-muted py-5' }, React.createElement('i', { className: 'bi bi-wallet2', style: { fontSize: '2rem' } }), React.createElement('p', { className: 'mt-2' }, '暂无钱包'))
            )
        )
    );
}

// ============================================================
// TaskManage Page
// ============================================================
function TaskManagePage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const fetchData = useCallback(async () => { const res = await API.getAllTasks(false); if (Array.isArray(res)) setTasks(res); setLoading(false); }, []);
    useEffect(() => { fetchData(); }, [fetchData]);
    const handleExec = async (task) => { const res = await API.execTask(task.taskName, {}); if (res.success) toast('任务 "' + task.taskName + '" 已启动', 'success'); else toast(res.message || '启动失败', 'error'); };
    if (loading) return React.createElement('div', { className: 'loading-overlay' }, React.createElement('div', { className: 'loading-spinner' }));
    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, '任务管理'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, React.createElement('span', null, '任务列表'), React.createElement('span', { className: 'badge bg-primary' }, tasks.length + ' 个任务')),
            React.createElement('div', { className: 'card-body' },
                tasks.length > 0
                    ? React.createElement('div', { style: { overflowX: 'auto' } },
                        React.createElement('table', { className: 'web-table' },
                            React.createElement('thead', null, React.createElement('tr', null, React.createElement('th', null, '任务名称'), React.createElement('th', null, '类型'), React.createElement('th', null, '操作'))),
                            React.createElement('tbody', null, tasks.map((t, i) => React.createElement('tr', { key: i },
                                React.createElement('td', null, React.createElement('strong', null, t.taskName)),
                                React.createElement('td', null, React.createElement('span', { className: 'badge bg-secondary' }, t.taskType || 'unknown')),
                                React.createElement('td', null, React.createElement('button', { className: 'btn btn-success btn-sm', onClick: () => handleExec(t) }, React.createElement('i', { className: 'bi bi-play-fill me-1' }), '执行'))
                            )))
                        )
                    )
                    : React.createElement('div', { className: 'text-center text-muted py-5' }, React.createElement('i', { className: 'bi bi-list-check', style: { fontSize: '2rem' } }), React.createElement('p', { className: 'mt-2' }, '暂无任务'))
            )
        )
    );
}

// ============================================================
// SyncFunction Page
// ============================================================
function SyncFunctionPage() {
    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, '同步功能'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, '同步分组管理'),
            React.createElement('div', { className: 'card-body' },
                React.createElement('div', { className: 'text-center text-muted py-5' },
                    React.createElement('i', { className: 'bi bi-arrow-repeat', style: { fontSize: '2rem' } }),
                    React.createElement('p', { className: 'mt-2' }, '同步功能开发中...')
                )
            )
        )
    );
}

// ============================================================
// AIAgents Page
// ============================================================
function AIAgentsPage() {
    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, 'AI Agents'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' }, 'AI 代理管理'),
            React.createElement('div', { className: 'card-body' },
                React.createElement('div', { className: 'text-center text-muted py-5' },
                    React.createElement('i', { className: 'bi bi-robot', style: { fontSize: '2rem' } }),
                    React.createElement('p', { className: 'mt-2' }, 'AI Agents 功能开发中...')
                )
            )
        )
    );
}

// ============================================================
// Main App
// ============================================================
function App() {
    const [collapsed, setCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [serverOnline, setServerOnline] = useState(false);

    const pageTitles = { dashboard: '仪表盘', chromeManager: '浏览器管理', walletManage: '钱包管理', syncFunction: '同步功能', taskManage: '任务管理', aiAgents: 'AI Agents' };

    useEffect(() => {
        const check = async () => { const res = await API.checkReadiness(); setServerOnline(!!res.success); };
        check();
        const interval = setInterval(check, 10000);
        return () => clearInterval(interval);
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return React.createElement(DashboardPage);
            case 'chromeManager': return React.createElement(ChromeManagerPage);
            case 'walletManage': return React.createElement(WalletManagerPage);
            case 'syncFunction': return React.createElement(SyncFunctionPage);
            case 'taskManage': return React.createElement(TaskManagePage);
            case 'aiAgents': return React.createElement(AIAgentsPage);
            default: return React.createElement(DashboardPage);
        }
    };

    return React.createElement(ToastProvider, null,
        React.createElement('div', null,
            React.createElement(Sidebar, { collapsed, setCollapsed, currentPage, onNavigate: setCurrentPage }),
            React.createElement('div', { className: `web-main ${collapsed ? 'expanded' : ''}` },
                React.createElement(TopBar, { pageTitle: pageTitles[currentPage] || 'Web3ToolBox', collapsed, setCollapsed, serverStatus: serverOnline }),
                React.createElement('div', { className: 'web-content' }, renderPage())
            )
        )
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
