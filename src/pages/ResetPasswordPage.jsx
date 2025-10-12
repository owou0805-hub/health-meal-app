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
    
    // 【修正】：將狀態名稱改回 sessionReady，並預設為 false
    const [sessionReady, setSessionReady] = useState(false); 
    
    const navigate = useNavigate();

    // =========================================================
    // 【核心修正】：使用延遲邏輯來解除鎖定表單
    // =========================================================
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                // 如果 Session 已經存在 (例如，Token 已經被處理好了)
                setSessionReady(true);
            } else {
                // 如果 Session 不存在，我們假設 Token 仍在 URL 中，給予 2 秒延遲，然後強制啟用表單
                setTimeout(() => {
                    setSessionReady(true); 
                    // 🚨 注意：這會讓表單啟用，但如果 Token 真的是過期的，提交時會失敗。
                    // 這是為了繞開頁面鎖定。
                }, 2000); 
            }
        };

        checkSession();
    }, []); 

    // =========================================================
    // 處理密碼重設提交
    // =========================================================
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        // 🚨 檢查：在提交時，確認 Session 是否存在
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
            setError(`密碼更新失敗：${updateError.message}。請確認密碼強度！`); 
        } else {
            setMessage('🎉 密碼已成功重設！您將在 3 秒後返回登入頁面。');
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

                    {/* 🎯 關鍵：檢查 sessionReady 狀態來決定是否啟用表單 */}
                    {/* 顯示等待提示或表單 */}
                    {!sessionReady && !error ? (
                        <p className="highlight-text" style={{color: 'orange'}}>正在建立安全連線...</p>
                    ) : (
                        <>
                            {error && (
                                <p style={{color: 'red', fontWeight: 'bold'}}>
                                    安全連線中斷或連結無效，請重新點擊郵件連結。
                                </p>
                            )}

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