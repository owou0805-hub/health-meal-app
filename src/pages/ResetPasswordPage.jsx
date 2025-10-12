import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // 關鍵狀態：追蹤頁面是否已從 URL 成功「激活」
    const [pageActivated, setPageActivated] = useState(false); 
    
    const navigate = useNavigate();

    // =========================================================
    // ⚡ 最終突破：強制使用 Token 進行 Session 設置
    // =========================================================
    useEffect(() => {
        const activateSessionFromUrl = async () => {
            const hash = window.location.hash;
            
            // 檢查 URL 中是否有 Supabase 相關的 Auth Hash
            if (hash.includes('access_token')) {
                // 1. 嘗試獲取 Session，這一步會強制 Supabase SDK 解析 URL Hash
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    // 成功建立 Session，但我們仍需確保用戶可以操作
                    setPageActivated(true); 
                } else {
                    // 即使嘗試了 getSession() 還是失敗，我們顯示錯誤
                    setError('安全連線建立失敗，請確認連結有效。');
                }
            } else {
                // 如果不是從重設連結訪問，則直接顯示錯誤
                setError('請通過您電子郵件中的連結訪問此頁面，連結可能已過期或無效。');
            }
        };

        activateSessionFromUrl();
    }, []); 

    // =========================================================
    // 處理密碼重設提交
    // =========================================================
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        // 🚨 檢查：如果頁面未激活（Session 未設置），則阻止提交
        if (!pageActivated) {
            setError('請等待安全連線建立，或確認您是通過郵件連結訪問。');
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
        // 由於我們在 useEffect 中成功建立了 Session (pageActivated = true)，這裡就能成功
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        setLoading(false);

        if (updateError) {
            // 這個錯誤通常是密碼太弱或網路問題
            console.error('密碼更新失敗:', updateError);
            setError(`密碼更新失敗：${updateError.message}。請確認密碼強度！`); 
        } else {
            setMessage('🎉 密碼已成功重設！您將在 3 秒後返回登入頁面。');
            // 成功後，清除 Session 並導向登入
            await supabase.auth.signOut();
            setTimeout(() => {
                navigate('/'); 
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

                    {/* 🎯 關鍵：只在頁面未激活時顯示等待或錯誤訊息 */}
                    {!pageActivated && !error && (
                         <p className="highlight-text" style={{color: 'orange'}}>正在建立安全連線...</p>
                    )}
                    
                    {/* 只有在頁面激活且沒有錯誤時才顯示表單 */}
                    {pageActivated && !error ? (
                        <>
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                            </div>
                            
                            <button type="submit" disabled={loading}>
                                {loading ? '正在重設...' : '確認重設密碼'}
                            </button>
                        </>
                    ) : (
                         /* 顯示最終錯誤提示 */
                        !error && <p style={{color: 'red', fontWeight: 'bold'}}>請確認您是通過郵件連結訪問此頁面。</p>
                    )}
                    
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