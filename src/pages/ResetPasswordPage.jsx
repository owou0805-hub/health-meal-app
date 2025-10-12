// src/pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from 'react';
import { supabase, supabaseService } from '../supabaseClient'; 
import { useNavigate, useSearchParams } from 'react-router-dom'; // 🎯 引入 useSearchParams

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [targetUserId, setTargetUserId] = useState(null); // 🎯 新增：儲存要重設密碼的 User ID
    const [searchParams] = useSearchParams(); // 🎯 讀取 URL 參數
    
    const navigate = useNavigate();

    useEffect(() => {
        // 1. 檢查 URL Hash 中的 Token (用於啟動頁面)
        const hash = window.location.hash;
        
        // 2. 檢查 URL 查詢參數中的 User ID
        const urlUserId = searchParams.get('user_id'); 

        if (urlUserId) {
            // 如果我們從 URL 中獲取到了 User ID，則頁面啟動
            setTargetUserId(urlUserId);
            setError(null);
        } else if (!hash.includes('access_token')) {
            // 如果沒有 user_id 且沒有 access_token，則無法操作
            setError('請通過您電子郵件中的有效連結訪問此頁面，無法識別用戶身份。');
        }
    }, [searchParams]); // 依賴 URL 參數變化

    // ... (handlePasswordReset 函式保持不變) ...

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');
        
        // 🚨 關鍵檢查：必須有 targetUserId 才能更新
        if (!targetUserId) {
            setError('無法識別用戶身份，請重新點擊郵件連結。');
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

        // 🎯 最終步驟：使用服務密鑰和 User ID 強制更新密碼
        const { error: updateError } = await supabaseService.auth.admin.updateUserById(
            targetUserId, // <--- 使用從 URL 獲取的 User ID
            { password: newPassword }
        );

        setLoading(false);

        if (updateError) {
            console.error('密碼更新失敗 (Admin):', updateError);
            setError(`密碼更新失敗：${updateError.message}。請確認密碼強度！`); 
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
                    {error && <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>{error}</p>}
                    {message && <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center' }}>{message}</p>}

                    {/* 關鍵：只有在沒有錯誤時才顯示表單，否則顯示錯誤訊息 */}
                    {!error ? (
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
                         <p className="toggle-form-link" style={{marginTop: '20px', cursor: 'auto'}}>
                            請確認您是通過郵件連結訪問此頁面。
                        </p>
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