import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // 追蹤是否已成功取得 Session，預設為 false
    const [sessionReady, setSessionReady] = useState(false); 
    
    const navigate = useNavigate();

    // =========================================================
    // 核心修正：使用輪詢機制 (Interval) 等待 Session 建立
    // =========================================================
    useEffect(() => {
        // 在開始檢查前，強制清除所有舊的 Session 狀態
        supabase.auth.signOut(); 
        let intervalId;
        
        const checkSession = async (currentIntervalId) => {
            // 1. 嘗試獲取 Session
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                // 成功！清除定時器，設置狀態為 Ready
                clearInterval(currentIntervalId); 
                setSessionReady(true);
            } else {
                // 2. 如果 Session 仍然為空，我們檢查 URL Hash 是否存在
                const hash = window.location.hash;
                
                if (hash.includes('access_token')) {
                    // 【關鍵修正】：如果瀏覽器中有 Token 但 Session 仍為空，
                    //              我們強制呼叫 onAuthStateChange 讓 Supabase SDK 重試解析
                    supabase.auth.onAuthStateChange(() => {}); 

                } else if (!sessionReady) {
                    // 如果 URL 中沒有 Token (已經被清除或原本就沒有) 且沒有 Session
                    clearInterval(currentIntervalId);
                    // 顯示最終錯誤，並停止輪詢
                    setError('請通過您電子郵件中的連結訪問此頁面，連結可能已過期或無效。');
                }
            }
        };

        // 設置輪詢 (每 1 秒檢查一次)
        const initialCheckId = setInterval(() => checkSession(initialCheckId), 1000);

        // 首次立即檢查
        checkSession(initialCheckId);

        // 清理函數：在組件卸載時，務必清除定時器
        return () => {
            clearInterval(initialCheckId);
        };
    }, []);

    // =========================================================
    // 處理密碼重設提交
    // =========================================================
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        // 檢查 Session 是否 Ready
        if (!sessionReady) {
            setError('安全連線尚未建立，請等待頁面載入完成後再操作。');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('兩次輸入的密碼不一致，請重新檢查。');
            return;
        }
        if (newPassword.length < 6) {
            setError('密碼長度必須至少為 6 個字元。');
            return;
        }

        setLoading(true);

        // 🎯 核心步驟：更新密碼
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        setLoading(false);

        if (updateError) {
            console.error('密碼更新失敗:', updateError);
            setError(`密碼更新失敗：${updateError.message}`); 
        } else {
            setMessage('🎉 密碼已成功重設！您將在 3 秒後返回登入頁面。');
            // 成功後，清除 Session 並導向登入
            await supabase.auth.signOut();
            setTimeout(() => {
                navigate('/'); // 導向根目錄 (LoginPage)
            }, 3000);
        }
    };

    return (
        <div className="page-container-main">
            <h1 className="main-title">重設密碼</h1>
            <div className="auth-form-container">
                <form onSubmit={handlePasswordReset} className="auth-form">
                    
                    {/* 錯誤/成功訊息區 */}
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}

                    {/* 🎯 等待狀態提示 */}
                    {!sessionReady && <p className="highlight-text" style={{color: 'orange'}}>{error || '正在建立安全連線...請稍候'}</p>}
                    
                    <p>請輸入您的新密碼。</p>

                    <div className="input-group">
                        <label htmlFor="new-password">新密碼：</label>
                        <input
                            id="new-password"
                            type="password"
                            required
                            placeholder="請輸入新密碼 (至少6個字元)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading || !sessionReady}
                        />
                    </div>
                    
                    <div className="input-group">
                        <label htmlFor="confirm-password">確認密碼：</label>
                        <input
                            id="confirm-password"
                            type="password"
                            required
                            placeholder="請再次輸入新密碼"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading || !sessionReady}
                        />
                    </div>
                    
                    <button type="submit" disabled={loading || !sessionReady}>
                        {loading ? '正在重設...' : '確認重設密碼'}
                    </button>
                    
                    {/* 返回登入按鈕 */}
                    <p onClick={() => navigate('/')} className="toggle-form-link">
                         返回登入頁面
                    </p>
                    
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;