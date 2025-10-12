// src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // 【修正】：預設為 false，等待 useEffect 檢查
    const [sessionReady, setSessionReady] = useState(false); 
    // 【新增】：處理首次檢查的載入狀態
    const [checkingSession, setCheckingSession] = useState(true); 
    
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                // 成功找到 Session，解除鎖定
                setSessionReady(true);
                setError(null); 
            } else {
                // 如果沒有 Session，顯示錯誤，讓用戶重試
                setSessionReady(false);
                setError('請通過您電子郵件中的有效連結訪問此頁面，連結可能已過期或無效。');
            }
            // 無論成功或失敗，都標記檢查完成
            setCheckingSession(false); 
        };

        // 檢查 URL Hash 中是否有 Token (由 index.html 腳本保證存在)
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            // 由於 Token 存在，我們強制 Supabase 進行檢查
            checkSession();
        } else {
            // 如果沒有 Token (用戶直接訪問此頁面或 Token 被清除)
            setSessionReady(false);
            setCheckingSession(false);
            setError('請通過您電子郵件中的有效連結訪問此頁面。');
        }
    }, []); 
    
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        // 🚨 關鍵檢查：確保 Session 存在 (使用 getSession 來確保不是使用過期的狀態)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
             setError('安全連線中斷或連結無效，請重新點擊郵件連結。');
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
            // 成功後，清除 Session 並導向登入
            await supabase.auth.signOut();
            setMessage('🎉 密碼已成功重設！您將在 3 秒後返回登入頁面。');
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

                    {/* 🎯 關鍵邏輯：根據檢查狀態顯示不同內容 */}
                    {checkingSession ? (
                        <p className="highlight-text" style={{color: 'orange'}}>正在檢查安全連線...</p>
                    ) : (
                        <>
                            {error ? (
                                <p style={{color: 'red', fontWeight: 'bold'}}>
                                    安全連線中斷或連結無效，請重新點擊郵件連結。
                                </p>
                            ) : (
                                <p>請輸入您的新密碼。</p>
                            )}
                            
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
                        </>
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