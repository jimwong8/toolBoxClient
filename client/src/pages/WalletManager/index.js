import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Button, Card, Spinner } from 'react-bootstrap';
import CustomModal from '../../components/customModal';
import APIManager from '../../utils/api';
import { eventEmitter } from '../../utils/eventEmitter';
import { useTranslation } from 'react-i18next';
import usePathStore from '../../store/pathStore';
import useFingerPrintStore from '../../store/fingerPrintStore';
import useWalletStore from '../../store/walletStore';
import { useToast } from '../../components/Toast';
import './index.scss';


const apiManager = APIManager.getInstance();

const DeletingOverlay = ({ show, text }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontSize: 24,
      color: '#333',
      fontWeight: 500
    }}>
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <div>{text}</div>
    </div>
  );
};

const WalletManage = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [modalProp, setModalProp] = useState({ show: false });
  const [walletList, setWalletList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState({});
  const savePath = usePathStore((state) => state.savePath);
  const fetchPaths = usePathStore((state) => state.fetchPaths);
  const fingerPrints = useFingerPrintStore((state) => state.fingerPrints);
  const fetchFingerPrints = useFingerPrintStore((state) => state.fetchFingerPrints);
  const fetchWallets = useWalletStore((state) => state.fetchWallets);
  const wallets = useWalletStore((state) => state.wallets);

  const childRef = useRef();
  const selectAllRef = useRef(null);

  const updateWalletList = useCallback(async () => {
    try {
      await fetchWallets();
      // wallets 的变化会通过 useEffect 自动同步到 walletList
    } catch (error) {
      console.error('Failed to update wallet list:', error);
      // 如果 store 方法失败，回退到直接 API 调用
      try {
        const res = await apiManager.getAllWallets();
        console.log('getAllWallets res (fallback):', res);
        if (res && Array.isArray(res)) {
          const updatedWalletList = res
            .slice()
            .sort((a, b) => {
              if ((a.createdAt || 0) !== (b.createdAt || 0)) {
                return (a.createdAt || 0) - (b.createdAt || 0);
              }
              if (a.id < b.id) return -1;
              if (a.id > b.id) return 1;
              return 0;
            })
            .map(wallet => ({ ...wallet, selected: false }));
          setWalletList(updatedWalletList);
        }
      } catch (fallbackError) {
        console.error('Fallback wallet fetch also failed:', fallbackError);
      }
    }
  }, [fetchWallets]);


  useEffect(() => {
    fetchPaths();
    updateWalletList();


    // 去重集合，避免同一 taskName 多次触发 reload
    const handled = new Set();

    const onTaskCompleted = async (info) => {
      if (!info || !info.taskName) return;
      if (!info.taskName.includes('initWallet')) return;
      // 已处理过同名任务则忽略
      if (handled.has(info.taskName)) return;
      handled.add(info.taskName);

      // 仅在任务成功时刷新；失败仅记录
      if (info.success) {
        setTimeout(() => window.location.reload(), 500);
      } else {
        console.warn('initWallet task failed:', info);
      }
    };

    eventEmitter.on('taskCompleted', onTaskCompleted);

    // cleanup：卸载监听器，防止热重载或重复添加监听
    return () => {
      if (typeof eventEmitter.off === 'function') {
        eventEmitter.off('taskCompleted', onTaskCompleted);
      } else if (typeof eventEmitter.removeListener === 'function') {
        eventEmitter.removeListener('taskCompleted', onTaskCompleted);
      }
    };
  }, [fetchPaths, updateWalletList]);

  // 监听 wallets store 的变化，同步到本地 walletList
  useEffect(() => {
    if (wallets && wallets.length >= 0) {
      const updatedWalletList = wallets.map(w => ({ ...w, selected: false }));
      setWalletList(updatedWalletList);
    }
  }, [wallets]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const total = Array.isArray(walletList) ? walletList.length : 0;
    const selected = Array.isArray(selectedIds) ? selectedIds.length : 0;
    selectAllRef.current.indeterminate = selected > 0 && selected < total;
  }, [selectedIds, walletList]);

  // 选中/取消选中单个钱包
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.length === walletList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(walletList.map(w => w.id));
    }
  };

  // 编辑钱包名称
  const modifyWalletName = (wallet) => {
    setModalProp({
      show: true,
      title: t('editWalletName'),
      handleClose: () => setModalProp({ ...modalProp, show: false }),
      rowList: [
        [
          { type: 'label', text: t('walletName'), colWidth: 3 },
          { type: 'input', key: 'walletName', inputType: 'text', colWidth: 7, placeholder: t('inputWalletName'), defaultValue: wallet.name || '' },
          {
            type: 'button', text: t('save'), colWidth: 2, click: () => {
              const newName = childRef.current.getValue('walletName');
              if (!newName) {
                alert(t('2007'));
                return;
              }
              apiManager.updateWalletName(wallet.id, newName).then((data) => {
                if (data && data.success) {
                  alert(t('0'));
                  // 更新本地状态
                  setWalletList(walletList.map(w => w.id === wallet.id ? { ...w, name: newName } : w));
                  // 同时刷新 store
                  updateWalletList();
                } else {
                  alert(t(data.code) + ': ' + (data.message || t('unknownError')));
                }
                setModalProp({ show: false });
              });
            }
          }
        ]
      ]
    });
  };

  // 查看钱包详情
  const checkWalletDetail = (wallet) => {
    setModalProp({
      show: true,
      title: t('walletDetail'),
      handleClose: () => setModalProp({ ...modalProp, show: false }),
      rowList: [
        [
          { type: 'label', text: t('walletDetail.id'), colWidth: 3 },
          { type: 'text', key: 'id', text: wallet.id || '', colWidth: 9 }
        ],
        [
          { type: 'label', text: t('walletDetail.name'), colWidth: 3 },
          { type: 'text', key: 'walletName', text: wallet.name || '', colWidth: 9 }
        ],
        [
          { type: 'label', text: t('walletDetail.mnemonic'), colWidth: 3 },
          { type: 'text', key: 'mnemonic', text: wallet.mnemonic || '', colWidth: 9 }
        ],
        [
          { type: 'label', text: t('walletDetail.ethAddress'), colWidth: 3 },
          { type: 'text', key: 'ethAddress', text: wallet.ethAddress || '', colWidth: 9 }
        ],
        [
          { type: 'label', text: t('walletDetail.ethPrivateKey'), colWidth: 3 },
          { type: 'text', key: 'ethPrivateKey', text: wallet.ethPrivateKey || '', colWidth: 9 }
        ],
        [
          { type: 'label', text: t('walletDetail.solAddress'), colWidth: 3 },
          { type: 'text', key: 'solAddress', text: wallet.solAddress || '', colWidth: 9 }
        ],
        [
          { type: 'label', text: t('walletDetail.solPrivateKey'), colWidth: 3 },
          { type: 'text', key: 'solPrivateKey', text: wallet.solPrivateKey || '', colWidth: 9 }
        ]
      ]
    });
  };

  // 绑定指纹环境
  const bindEnv = (wallet, search = '') => {

    const fpKeys = Object.keys(fingerPrints);
    if (search && search.trim() !== '') {
      const filteredKeys = fpKeys.filter(key => fingerPrints[key].name.toLowerCase().includes(search.toLowerCase())
      );
      if (filteredKeys.length === 0) {
        alert(t('noMatchingEnv'));
        return;
      }
    }
    // 计算可选项
    const searchValue = childRef.current?.getValue('envSearch') || '';
    // 只显示未被其它钱包绑定的环境，或已绑定到当前钱包的环境
    const filteredKeys = fpKeys.filter(key => {
      const fp = fingerPrints[key];

      const matchSearch = !searchValue || (fp.name && fp.name.toLowerCase().includes(searchValue.toLowerCase()));

      const notBound = !fp.bindWalletId || fp.bindWalletId === '';

      return matchSearch && notBound;
    });
    const selectOptions = filteredKeys.map(key => ({ value: key, text: fingerPrints[key].name }));

    // 默认选中第一个
    let defaultEnvId = selectOptions.length > 0 ? selectOptions[0].value : '';
    // 修复：每次弹窗打开前重置envId
    if (childRef.current && typeof childRef.current.updateValueObj === 'function') {
      childRef.current.updateValueObj('envId', defaultEnvId);
    }
    setModalProp({
      show: true,
      title: t('bindEnv'),
      handleClose: () => setModalProp({ ...modalProp, show: false }),
      rowList: [
        [
          { type: 'label', text: t('bindEnvTip'), colWidth: 6 },
          wallet.bindEnvId ? { type: 'text', key: 'bindEnvName', text: fingerPrints[wallet.bindEnvId]?.name || t('unknownEnv'), colWidth: 6 } : {}
        ],
        [
          { type: 'input', key: 'envSearch', inputType: 'text', colWidth: 8, placeholder: t('searchEnvName') },
          {
            type: 'button', text: t('search'), colWidth: 4, click: () => {
              const search = childRef.current.getValue('envSearch') || '';
              bindEnv(wallet, search);
            }
          }
        ],
        [
          {
            type: 'select',
            key: 'envId',
            colWidth: 8,
            options: selectOptions,
            defaultValue: defaultEnvId,
            placeholder: t('selectEnv'),
          },
          {
            type: 'button',
            text: t('bind'),
            colWidth: 4,
            click: async () => {
              const envId = childRef.current.getValue('envId');
              if (!envId) {
                showError(t('2007'));
                return;
              }
              setLoading((prev) => ({ ...prev, [`bind_${wallet.id}`]: true }));
              try {
                const data = await apiManager.bindWalletEnv(wallet.id, envId);
                if (data && data.success) {
                  showSuccess(t('0'));
                  setModalProp({ show: false });
                  refreshWalletAndFingerPrints();
                } else {
                  showError(t(data.code) + ': ' + (data.message || t('unknownError')));
                }
              } catch (error) {
                showError(error.message || t('unknownError'));
              } finally {
                setLoading((prev) => ({ ...prev, [`bind_${wallet.id}`]: false }));
              }
            }
          }
        ]
      ]
    });
  };

  // 删除选中钱包
  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      showError(t('noSelected'));
      return;
    }
    setDeleting(true);
    try {
      const res = await apiManager.deleteWallets(selectedIds);
      if (res && res.success) {
        try {
          const storedGroups = localStorage.getItem('syncGroups');
          if (storedGroups) {
            const parsed = JSON.parse(storedGroups);
            if (Array.isArray(parsed)) {
              const removedWallets = new Set(selectedIds);
              const filtered = parsed.filter((group) => {
                const mode = group.mode || 'wallet';
                if (mode !== 'wallet') return true;
                if (removedWallets.has(group.master)) return false;
                const slaves = Array.isArray(group.slaves) ? group.slaves : [];
                return !slaves.some((id) => removedWallets.has(id));
              });
              localStorage.setItem('syncGroups', JSON.stringify(filtered));
            }
          }
        } catch (error) {
          console.error('Failed to update syncGroups:', error);
        }
        setWalletList(walletList.filter(w => !selectedIds.includes(w.id)));
        setSelectedIds([]);
        showSuccess(t('deleteSuccess'));
        fetchFingerPrints();
        updateWalletList();
      } else {
        showError(res?.message || t('deleteFailed'));
      }
    } catch (err) {
      showError(err?.message || t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };
  const handleModalClose = () => {
    setModalProp({ ...modalProp, show: false });
  };

  const createWallet = () => {
    if (!savePath) {
      alert(t('wallet.alert.setSavePath'));
      return;
    }

    setModalProp({
      show: true,
      handleClose: handleModalClose,
      title: t('wallet.modal.create.title'),

      rowList: [
        [
          {
            type: 'label',
            text: t('wallet.modal.create.countLabel'),
            colWidth: 4,
            style: { textAlign: 'center' },
          },
          {
            type: 'input',
            key: 'count',
            placeholder: t('wallet.modal.create.countPlaceholder'),
            colWidth: 8,
            style: { textAlign: 'left' },
          },
        ],
        [
          {
            type: 'button',
            text: t('wallet.modal.create.createButton'),
            colWidth: 4,
            style: { marginLeft: 'auto' },
            click: async () => {
              const countInput = childRef.current.getValue('count');
              if (!countInput) return;
              let count = parseInt(countInput);
              if (isNaN(count) || count <= 0) {
                showError(t('wallet.modal.create.invalidNumber'));
                return;
              }
              setLoading((prev) => ({ ...prev, createWallet: true }));
              try {
                const res = await apiManager.createWallets({ count });
                if (res.success) {
                  showSuccess(t('wallet.modal.create.successCreated', { count }));
                  handleModalClose();
                  await updateWalletList();
                } else {
                  showError(res.message);
                }
              } catch (error) {
                showError(t('wallet.modal.create.failedGeneric'));
              } finally {
                setLoading((prev) => ({ ...prev, createWallet: false }));
              }
            },
          },
        ],
      ],
    });
  };

  // 导出钱包
  const exportWallet = () => {
    setModalProp({
      show: true,
      handleClose: handleModalClose,
      title: t('exportWallet'),
      rowList: [
        [
          {
            type: 'label',
            text: t('chooseExportDirectory'),
            colWidth: 4,
            style: { textAlign: 'center', fontWeight: 'bold' },
          },
          {
            type: 'text',
            key: 'directory',
            text: childRef.current?.getValue('directory') || '',
            colWidth: 4,
            style: { textAlign: 'left', fontStyle: 'italic', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
          },
          {
            type: 'button',
            text: t('chooseDirectory'),
            colWidth: 4,
            style: { textAlign: 'left' },
            click: async () => {
              if (!window.electronAPI) {
                alert(t('runInElectron'));
                return;
              }
              const directory = await window.electronAPI.chooseDirectory();
              if (directory) {
                childRef.current.updateValueObj('directory', directory);
                setModalProp((prev) => ({ ...prev })); // 强制刷新弹窗内容
              }
            }
          },
        ],
        [
          {
            type: 'button',
            text: t('exportWallet'),
            colWidth: 4,
            style: { marginLeft: 'auto' },
            click: async () => {
              const directory = childRef.current.getValue('directory');
              if (!directory) {
                showError(t('invalidExportDirectory'));
                return;
              }
              const ids = selectedIds.length > 0 ? selectedIds : walletList.map(w => w.id);
              if (!Array.isArray(ids) || ids.length === 0) {
                showError(t('noSelected'));
                return;
              }
              setLoading((prev) => ({ ...prev, exportWallet: true }));
              try {
                const res = await apiManager.exportWallets(ids, directory);
                if (res.success) {
                  showSuccess(t('exportSuccess'));
                  handleModalClose();
                } else {
                  showError(res.message);
                }
              } catch (error) {
                showError(error.message || t('unknownError'));
              } finally {
                setLoading((prev) => ({ ...prev, exportWallet: false }));
              }
            },
          },
        ],
      ],
    });
  }

  const importWallet = () => {
    setModalProp({
      show: true,
      handleClose: handleModalClose,
      title: t('importWallet'),
      rowList: [
        [
          {
            type: 'label',
            text: t('chooseImportFile'),
            colWidth: 4,
            style: { textAlign: 'center', fontWeight: 'bold' },
          },
          {
            type: 'text',
            key: 'filePath',
            text: childRef.current?.getValue('filePath') || '',
            colWidth: 4,
            style: { textAlign: 'left', fontStyle: 'italic', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
          },
          {
            type: 'button',
            text: t('chooseFile'),
            colWidth: 4,
            style: { textAlign: 'left' },
            click: async () => {
              if (!window.electronAPI) {
                alert(t('runInElectron'));
                return;
              }
              const filePath = await window.electronAPI.openFile({ filters: [{ name: 'Excel', extensions: ['xlsx'] }] });
              if (filePath) {
                childRef.current.updateValueObj('filePath', filePath);
                setModalProp((prev) => ({ ...prev })); // 强制刷新弹窗内容
              }
            }
          },
        ],
        [
          {
            type: 'button',
            text: t('importWallet'),
            colWidth: 4,
            style: { marginLeft: 'auto' },
            click: async () => {
              const filePath = childRef.current.getValue('filePath');
              if (filePath) {
                setLoading((prev) => ({ ...prev, importWallet: true }));
                try {
                  const res = await apiManager.importWallets(filePath);
                  if (res.success) {
                    showSuccess(t('importSuccess') + `: ${res.message}`);
                    handleModalClose();
                    await updateWalletList();
                  } else {
                    showError(t('importFailed') + ': ' + (res.message || t('unknownError')));
                  }
                } catch (err) {
                  showError(t('importFailed') + ': ' + (err.message || t('unknownError')));
                } finally {
                  setLoading((prev) => ({ ...prev, importWallet: false }));
                }
              } else {
                showError(t('invalidImportFile'));
              }
            },
          ],
        ],
      });
    };

    const refreshWalletAndFingerPrints = async () => {
    fetchFingerPrints();
    await updateWalletList();
  };

  // setInitWallet = () => {
  const setWalletScriptDirectory = async () => {
    let currentDirectory = 'default';
    try {
      const result = await apiManager.getWalletScriptDirectory();
      if (result && result.success && result.directory) {
        currentDirectory = result.directory;
      }
    } catch (error) {
      console.error('获取当前脚本目录失败:', error);
    }
    setModalProp({
      show: true,
      handleClose: handleModalClose,
      title: t('setWalletScriptDirectory'),
      rowList: [
        [
          {
            type: 'label',
            text: t('syncScriptDirectory.current'),
            colWidth: 4,
            style: { textAlign: 'center', fontWeight: 'bold' },
          },
          {
            type: 'text',
            key: 'scriptDirectory',
            text: currentDirectory,
            colWidth: 4,
            style: { textAlign: 'left', fontStyle: 'italic', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
          },
          {
            type: 'label',
            text: '',
            colWidth: 4,
          },
        ],
        [
          {
            type: 'label',
            text: t('syncScriptDirectory.selectNew'),
            colWidth: 4,
            style: { textAlign: 'center', fontWeight: 'bold' },
          },
          {
            type: 'input',
            key: 'scriptDirectoryInput',
            inputType: 'text',
            colWidth: 4,
            placeholder: t('syncScriptDirectory.placeholder'),
            defaultValue: ''
          },
          {
            type: 'button',
            text: t('chooseButton'),
            colWidth: 4,
            style: { textAlign: 'left' },
            click: async () => {
              if (!window.electronAPI) {
                alert(t('runInElectron'));
                return;
              }
              const scriptDirectory = await window.electronAPI.chooseDirectory({});
              if (scriptDirectory) {
                childRef.current.updateValueObj('scriptDirectoryInput', scriptDirectory);
                setModalProp((prev) => ({ ...prev })); 
              }
            }
          },
        ],
        [
          {
            type: 'button',
            text: t('confirmButton'),
            colWidth: 4,
            style: { marginLeft: 'auto' },
            click: () => {
              const scriptDirectory = childRef.current.getValue('scriptDirectoryInput');
              if (scriptDirectory) {
                apiManager.setWalletScriptDirectory(scriptDirectory).then((res) => {
                  if (res.success) {
                    alert(t('setSuccess'));
                    usePathStore.getState().fetchWalletScriptDirectory();
                    handleModalClose();
                  } else {
                    console.log('set wallet script directory failed:', res.message);
                    alert(t('setFailed') + ': ' + (res.message || t('unknownError')));
                  }
                });
              } else {
                alert(t('invalidScriptPath'));
              }
            },
          },
          {
            type: 'button',
            text: t('reset'),
            colWidth: 4,
            click: () => {
              apiManager.resetWalletScriptDirectory().then((res) => {
                if (res && res.success) {
                  alert(t('setSuccess'));
                  usePathStore.getState().fetchWalletScriptDirectory();
                  handleModalClose();
                } else {
                  alert(t('setFailed') + ': ' + (res?.message || t('unknownError')));
                }
              }).catch((err) => {
                alert(t('setFailed') + ': ' + (err?.message || t('unknownError')));
              });
            },
          },
        ],
      ],
    });
  }
  const initWallets = async () => {
    const selectedWallets = walletList.filter(wallet => selectedIds.includes(wallet.id));
    if (selectedWallets.length === 0) {
      showError(t('noSelected'));
      return;
    }

    const unboundWallets = selectedWallets.filter(wallet => !wallet.bindEnvId);
    if (unboundWallets.length > 0) {
      const unboundNames = unboundWallets.map(w => w.name).join(', ');
      showError(t('3010') + ': ' + unboundNames);
      return;
    }

    setLoading((prev) => ({ ...prev, initWallets: true }));
    try {
      const res = await apiManager.initWallets(selectedWallets.map(wallet => wallet.id));
      if (res.success) {
        await updateWalletList();
      } else {
        showError(t(res.code) || res.message || t('unknownError'));
      }
    } catch (err) {
      showError(t('initFailed') + ': ' + (err.message || err));
    } finally {
      setLoading((prev) => ({ ...prev, initWallets: false }));
    }
  }

  const openWallet = async (wallet) => {
    if (!wallet) return;
    if (!wallet.bindEnvId) {
      showError(t('wallet.open.notBound'));
      return;
    }
    setLoading((prev) => ({ ...prev, [`open_${wallet.id}`]: true }));
    try {
      const res = await apiManager.openWallets([wallet.id]);
      if (res && res.success) {
        showSuccess(t('wallet.open.started'));
      } else {
        showError(res?.message || t('wallet.open.failed'));
      }
    } catch (err) {
      showError(t('wallet.open.failed') + ': ' + (err.message || err));
    } finally {
      setLoading((prev) => ({ ...prev, [`open_${wallet.id}`]: false }));
    }
  }

  return (
    <Container className="wallet-manager-page">
      <DeletingOverlay show={deleting} text={t('deletingInProgress')} />
      <h1 style={{ textAlign: 'center' }}>{t('walletManager')}</h1>
      <Card className="control-panel mb-4">
        <Card.Body>
          <div className="btn-row">
            <Button className="btn" onClick={() => createWallet()}>{t('createWallet')}</Button>
            <Button className="btn" onClick={() => importWallet()}>{t('importWallet')}</Button>
            <Button className="btn" onClick={() => exportWallet()}>{t('exportWallet')}</Button>
            <Button className="btn" onClick={() => setWalletScriptDirectory()}>{t('setWalletScriptDirectory')}</Button>
          </div>
        </Card.Body>
      </Card>
      <CustomModal ref={childRef} {...modalProp} />

      <Card className="wallet-list-card mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="header-checkbox-align">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={walletList.length > 0 && selectedIds.length === walletList.length}
              onChange={toggleSelectAll}
              style={{ marginRight: 8 }}
            />
            <span>{t('walletList')}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <Button size="sm" variant="primary" onClick={() => initWallets()}>{t('initWallets')}</Button>
            <Button size="sm" variant="danger" onClick={deleteSelected}>{t('deleteSelected')}</Button>
          </div>
        </Card.Header>
        <Card.Body className="wallet-list-scroll">
          {Array.isArray(walletList) && walletList.length > 0 ? (
            walletList.map((wallet) => (
              <Row key={wallet.id} className="align-items-center wallet-row">
                <Col xs={1} className="d-flex align-items-center p-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(wallet.id)}
                    onChange={() => toggleSelect(wallet.id)}
                  />
                </Col>
                <Col xs={4} className="wallet-name text-truncate p-0" title={wallet.name}>
                  <span style={{ 
                    color: wallet.walletInitialized ? '#28a745' : (wallet.bindEnvId ? '#007bff' : '#6c757d')
                  }}>
                    {wallet.name}
                    {wallet.bindEnvId ? '' : ` (${t('wallet.status.notBound')})`}
                  </span>
                </Col>
                <Col xs="auto" className="p-0">
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => modifyWalletName(wallet)}>{t('edit')}</Button>
                  <Button size="sm" variant="outline-info" className="me-1" onClick={() => checkWalletDetail(wallet)}>{t('viewDetail')}</Button>
                  <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => bindEnv(wallet)}> {
                    wallet.bindEnvId ? t('rebindEnv') : t('bindEnv')}</Button>
                  <Button size="sm" variant="outline-success" onClick={() => openWallet(wallet)}>{t('open')}</Button>
                </Col>
              </Row>
            ))
          ) : (
            <div className="text-muted">{t('noWallets')}</div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WalletManage;

