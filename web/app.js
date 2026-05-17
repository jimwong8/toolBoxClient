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
    getTaskStatus(taskNames) { return this.post('api/getTaskStatus', { taskNames }); },
    terminateTask(taskName) { return this.post('api/terminateTask', { taskName }); },
    getAgentTasks() { return this.get('api/getAgentTasks'); },
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
        React.createElement('div', { className: 'nav-item', onClick: () => window.open('https://web3toolbox.app/', '_blank', 'noopener,noreferrer') },
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
        const count = Number(genCount);
        if (!Number.isInteger(count) || count <= 0) {
            toast('请输入大于 0 的整数生成数量', 'warning');
            return;
        }
        const res = await API.generateFingerPrints(count);
        if (res.success) {
            toast('成功生成 ' + count + ' 个指纹', 'success');
            fetchData();
            return;
        }
        const msg = (res && res.message) ? String(res.message) : '生成失败';
        if (msg.includes('fontsFamily missing')) {
            toast('指纹基础数据未初始化（fontsFamily），正在使用默认字体重试', 'warning');
            const retry = await API.generateFingerPrints(count);
            if (retry.success) {
                toast('成功生成 ' + count + ' 个指纹', 'success');
                fetchData();
                return;
            }
            toast(retry.message || '生成失败', 'error');
            return;
        }
        toast(msg, 'error');
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
        try {
            const res = await API.getFingerPrints();
            if (!(res && res.success && res.data)) {
                toast((res && res.message) ? res.message : '暂无可导出的指纹数据', 'warning');
                return;
            }
            const arr = Object.values(res.data);
            if (!Array.isArray(arr) || arr.length === 0) {
                toast('暂无可导出的指纹数据', 'warning');
                return;
            }
            const data = JSON.stringify(arr, null, 2);
            const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'fingerprints_' + Date.now() + '.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                if (a.parentNode) document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            toast('指纹导出成功 (' + arr.length + ' 个)', 'success');
        } catch (err) {
            toast('导出失败: ' + (err && err.message ? err.message : '未知错误'), 'error');
        }
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
        if (res.success) {
            setInstallStatus('success');
            if (res.chromePath) setChromePath(res.chromePath);
            else fetchData();
            toast(res.message || '浏览器安装成功', 'success');
        } else {
            setInstallStatus('error');
            toast(res.message || '安装失败', 'error');
        }
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
    const [envs, setEnvs] = useState([]);
    const [masterId, setMasterId] = useState('');
    const [slaveIds, setSlaveIds] = useState([]);
    const [running, setRunning] = useState(false);
    const [syncState, setSyncState] = useState({ phase: 'idle', success: null, message: '' });
    const [slaveProgress, setSlaveProgress] = useState({});
    const [lastTaskLogs, setLastTaskLogs] = useState([]);
    const toast = useToast();

    const fetchData = useCallback(async () => {
        const res = await API.getFingerPrints();
        if (res && res.success && res.data) {
            const arr = Object.values(res.data);
            setEnvs(arr);
            if (!masterId && arr.length > 0) setMasterId(arr[0].id || arr[0]._id || '');
        } else {
            setEnvs([]);
        }
    }, [masterId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        let ws = null;
        try {
            ws = new WebSocket('ws://127.0.0.1:30001/ws?clientTag=renderer-test');
            ws.onmessage = (evt) => {
                try {
                    const msg = JSON.parse(evt.data || '{}');
                    if (!msg || !msg.type) return;
                    if (msg.type === 'task_log' && String(msg.taskName || '').includes('syncFunction')) {
                        setLastTaskLogs(prev => [
                            { time: msg.time || new Date().toLocaleString(), message: msg.message || '' },
                            ...prev
                        ].slice(0, 20));
                        setSyncState(prev => ({ ...prev, message: msg.message || prev.message }));

                        const text = String(msg.message || '');
                        setSlaveProgress(prev => {
                            const next = { ...prev };
                            Object.keys(next).forEach((id) => {
                                if (text.includes(id)) {
                                    next[id] = { ...next[id], status: 'running', message: text, updatedAt: Date.now() };
                                }
                            });
                            return next;
                        });
                    }
                    if (msg.type === 'task_completed' && String(msg.taskName || '').includes('syncFunction')) {
                        const ok = !!msg.success;
                        setRunning(false);
                        setSyncState({ phase: 'completed', success: ok, message: msg.message || (ok ? '同步完成' : '同步失败') });
                        setSlaveProgress(prev => {
                            const next = { ...prev };
                            Object.keys(next).forEach((id) => {
                                if (next[id].status !== 'success') {
                                    next[id] = { ...next[id], status: ok ? 'success' : 'failed', message: msg.message || '', updatedAt: Date.now() };
                                }
                            });
                            return next;
                        });
                    }
                    if (msg.type === 'task_error' && String(msg.message || '').toLowerCase().includes('sync')) {
                        setRunning(false);
                        setSyncState({ phase: 'completed', success: false, message: msg.message || '同步失败' });
                    }
                } catch (_) {}
            };
        } catch (_) {}
        return () => {
            if (ws && ws.readyState === 1) ws.close();
        };
    }, []);

    useEffect(() => {
        if (!running) return undefined;
        const timer = setInterval(async () => {
            const res = await API.getTaskStatus(['syncFunction']);
            const isRunningNow = !!(res && res.syncFunction);
            if (!isRunningNow) {
                setRunning(false);
                setSyncState(prev => ({ ...prev, phase: 'completed', message: prev.message || '同步任务已结束' }));
            }
        }, 2000);
        return () => clearInterval(timer);
    }, [running]);

    const toggleSlave = (id, checked) => {
        setSlaveIds(prev => checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
    };

    const initSlaveProgress = (ids) => {
        const map = {};
        ids.forEach(id => {
            map[id] = { status: 'pending', message: '等待执行', updatedAt: Date.now() };
        });
        setSlaveProgress(map);
    };

    const handleStopSync = async () => {
        const res = await API.terminateTask('syncFunction');
        if (res && res.success) {
            setRunning(false);
            setSyncState({ phase: 'completed', success: false, message: '同步任务已手动停止' });
            toast('同步任务已停止', 'warning');
        } else {
            toast((res && res.message) || '停止失败', 'error');
        }
    };

    const handleStartSync = async (retryFailedOnly = false) => {
        if (!masterId) { toast('请先选择主环境', 'warning'); return; }
        let finalSlaveIds = slaveIds.filter(id => id !== masterId);
        if (retryFailedOnly) {
            finalSlaveIds = finalSlaveIds.filter(id => (slaveProgress[id] && slaveProgress[id].status === 'failed'));
        }
        if (finalSlaveIds.length === 0) { toast(retryFailedOnly ? '没有可重试的失败环境' : '请至少选择一个从环境', 'warning'); return; }

        setRunning(true);
        setSyncState({ phase: 'running', success: null, message: '同步任务启动中...' });
        setLastTaskLogs([]);
        initSlaveProgress(finalSlaveIds);
        setSlaveProgress(prev => {
            const next = { ...prev };
            finalSlaveIds.forEach(id => {
                next[id] = { status: 'running', message: '任务已下发', updatedAt: Date.now() };
            });
            return next;
        });

        const payload = { envIds: [masterId, ...finalSlaveIds], masterId, slaveIds: finalSlaveIds, mode: 'env' };
        const res = await API.execTask('syncFunction', payload);
        if (res && res.success) {
            toast('同步任务已启动', 'success');
            return;
        }
        setRunning(false);
        setSyncState({ phase: 'completed', success: false, message: (res && res.message) || '同步任务启动失败' });
        setSlaveProgress(prev => {
            const next = { ...prev };
            Object.keys(next).forEach((id) => {
                if (next[id].status === 'running' || next[id].status === 'pending') {
                    next[id] = { ...next[id], status: 'failed', message: (res && res.message) || '启动失败', updatedAt: Date.now() };
                }
            });
            return next;
        });
        toast((res && res.message) || '同步任务启动失败', 'error');
    };

    const statusBadge = (status) => {
        if (status === 'success') return React.createElement('span', { className: 'badge bg-success' }, '成功');
        if (status === 'failed') return React.createElement('span', { className: 'badge bg-danger' }, '失败');
        if (status === 'running') return React.createElement('span', { className: 'badge bg-primary' }, '进行中');
        return React.createElement('span', { className: 'badge bg-secondary' }, '待执行');
    };

    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, '同步功能'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' },
                React.createElement('span', null, '同步分组管理'),
                React.createElement('span', { className: 'badge bg-primary' }, envs.length + ' 个环境')
            ),
            React.createElement('div', { className: 'card-body' },
                envs.length === 0
                    ? React.createElement('div', { className: 'text-center text-muted py-4' }, '暂无指纹环境，请先在浏览器管理生成指纹')
                    : React.createElement(React.Fragment, null,
                        React.createElement('div', { className: 'mb-3' },
                            React.createElement('label', { className: 'form-label' }, '主环境'),
                            React.createElement('select', { className: 'form-select', value: masterId, onChange: e => setMasterId(e.target.value) },
                                envs.map(fp => {
                                    const id = fp.id || fp._id;
                                    return React.createElement('option', { key: id, value: id }, (fp.name || id) + ' (' + id.slice(0, 8) + ')');
                                })
                            )
                        ),
                        React.createElement('div', { className: 'mb-3' },
                            React.createElement('label', { className: 'form-label' }, '从环境（可多选）'),
                            React.createElement('div', { style: { maxHeight: '260px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '10px' } },
                                envs.map(fp => {
                                    const id = fp.id || fp._id;
                                    const disabled = id === masterId;
                                    return React.createElement('div', { key: id, className: 'form-check mb-1' },
                                        React.createElement('input', {
                                            className: 'form-check-input', type: 'checkbox', id: 'sync-slave-' + id,
                                            checked: slaveIds.includes(id), disabled,
                                            onChange: e => toggleSlave(id, e.target.checked)
                                        }),
                                        React.createElement('label', { className: 'form-check-label', htmlFor: 'sync-slave-' + id },
                                            (fp.name || id) + (disabled ? '（主环境）' : '')
                                        )
                                    );
                                })
                            )
                        ),
                        React.createElement('div', { className: 'd-flex gap-2 flex-wrap mb-3' },
                            React.createElement('button', { className: 'btn btn-primary', onClick: () => handleStartSync(false), disabled: running },
                                running ? '同步中...' : '启动同步'
                            ),
                            React.createElement('button', { className: 'btn btn-warning', onClick: () => handleStartSync(true), disabled: running || Object.keys(slaveProgress).filter(id => slaveProgress[id].status === 'failed').length === 0 }, '重试失败项'),
                            React.createElement('button', { className: 'btn btn-danger', onClick: handleStopSync, disabled: !running }, '停止同步'),
                            React.createElement('button', { className: 'btn btn-outline-secondary', onClick: fetchData }, '刷新环境列表'),
                            React.createElement('button', { className: 'btn btn-outline-secondary', onClick: async () => {
                                const r = await API.getTaskStatus(['syncFunction']);
                                toast('syncFunction 当前状态: ' + ((r && r.syncFunction) ? '运行中' : '空闲'), 'info');
                            } }, '刷新状态')
                        ),
                        React.createElement('div', { className: 'alert ' + (syncState.success === false ? 'alert-danger' : syncState.success === true ? 'alert-success' : 'alert-secondary') },
                            React.createElement('strong', null, '任务状态：'),
                            syncState.phase === 'running' ? '运行中' : syncState.phase === 'completed' ? (syncState.success ? '已完成' : '失败') : '未启动',
                            syncState.message ? (' ｜ ' + syncState.message) : ''
                        ),
                        React.createElement('div', { style: { overflowX: 'auto' } },
                            React.createElement('table', { className: 'web-table' },
                                React.createElement('thead', null, React.createElement('tr', null,
                                    React.createElement('th', null, '环境'),
                                    React.createElement('th', null, '状态'),
                                    React.createElement('th', null, '最后消息'),
                                    React.createElement('th', null, '更新时间')
                                )),
                                React.createElement('tbody', null,
                                    Object.keys(slaveProgress).length === 0
                                        ? React.createElement('tr', null, React.createElement('td', { colSpan: 4, className: 'text-center text-muted' }, '暂无同步明细（启动任务后显示）'))
                                        : Object.entries(slaveProgress).map(([id, st]) => {
                                            const fp = envs.find(x => (x.id || x._id) === id);
                                            return React.createElement('tr', { key: id },
                                                React.createElement('td', null, (fp && fp.name) ? fp.name : id.slice(0, 8)),
                                                React.createElement('td', null, statusBadge(st.status)),
                                                React.createElement('td', null, st.message || '-'),
                                                React.createElement('td', null, st.updatedAt ? new Date(st.updatedAt).toLocaleTimeString() : '-')
                                            );
                                        })
                                )
                            )
                        ),
                        React.createElement('div', { className: 'mt-3' },
                            React.createElement('div', { className: 'text-muted mb-1' }, '最近日志（20条）'),
                            React.createElement('div', { style: { maxHeight: '180px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', padding: '8px', background: '#fafafa' } },
                                lastTaskLogs.length === 0
                                    ? React.createElement('div', { className: 'text-muted' }, '暂无日志')
                                    : lastTaskLogs.map((l, i) => React.createElement('div', { key: i, style: { fontSize: '12px', marginBottom: '4px' } }, '[' + l.time + '] ' + l.message))
                            )
                        )
                    )
            )
        )
    );
}

// ============================================================
// AIAgents Page
// ============================================================
function AIAgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const fetchAgents = useCallback(async () => {
        setLoading(true);
        const res = await API.getAgentTasks();
        if (Array.isArray(res)) {
            setAgents(res);
        } else if (res && Array.isArray(res.data)) {
            setAgents(res.data);
        } else {
            setAgents([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAgents(); }, [fetchAgents]);

    const openWorkspace = async (agent) => {
        const taskName = agent.taskName || agent.name;
        if (!taskName) { toast('任务名称缺失，无法打开', 'error'); return; }
        const res = await API.execTask(taskName, {});
        if (res && res.success) toast('AI 任务已启动：' + taskName, 'success');
        else toast((res && res.message) || ('启动失败: ' + taskName), 'error');
    };

    if (loading) return React.createElement('div', { className: 'loading-overlay' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', null,
        React.createElement('h4', { style: { marginBottom: '20px' } }, 'AI Agents'),
        React.createElement('div', { className: 'web-card' },
            React.createElement('div', { className: 'card-header' },
                React.createElement('span', null, 'AI 代理管理'),
                React.createElement('span', { className: 'badge bg-primary' }, agents.length + ' 个任务')
            ),
            React.createElement('div', { className: 'card-body' },
                agents.length === 0
                    ? React.createElement('div', { className: 'text-center text-muted py-4' }, '暂无 AI 任务')
                    : React.createElement('div', { style: { overflowX: 'auto' } },
                        React.createElement('table', { className: 'web-table' },
                            React.createElement('thead', null, React.createElement('tr', null,
                                React.createElement('th', null, '名称'),
                                React.createElement('th', null, '类型'),
                                React.createElement('th', null, '操作')
                            )),
                            React.createElement('tbody', null,
                                agents.map((a, i) => React.createElement('tr', { key: a.taskName || a.name || i },
                                    React.createElement('td', null, a.taskName || a.name || '-'),
                                    React.createElement('td', null, React.createElement('span', { className: 'badge bg-secondary' }, a.taskType || 'agent')),
                                    React.createElement('td', null,
                                        React.createElement('button', { className: 'btn btn-success btn-sm', onClick: () => openWorkspace(a) },
                                            React.createElement('i', { className: 'bi bi-play-fill me-1' }), '运行'
                                        )
                                    )
                                ))
                            )
                        )
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
