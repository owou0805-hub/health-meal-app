// src/pages/ResetPasswordPage.jsx

import React, { useState } from 'react'; // 移除 useEffect
// 確保匯入了 service client
import { supabase, supabaseService } from '../supabaseClient'; 
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    // 關鍵修正：現在只用 error 顯示提交後的錯誤
    const [error, setError] = useState(null); 
    const [loading, setLoading] = useState(false);
    
    // 關鍵修正：預設表單為啟用狀態 (true)，避免頁面鎖死
    const [pageActivated, setPageActivated] = useState(true); 
    
    const navigate = useNavigate();

    /*
    // 【已移除】：所有複雜的 useEffect 邏輯和 Token 檢查
    */

    // =========================================================
    // 處理密碼重設提交
    // =========================================================
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('兩次輸入的密碼不一致，請重新檢查。');
            return;
        }
        if (newPassword.length < 6) {
            setError('密碼長度必須至少為 6 個字元。');
            return;
        }

        setLoading(true);

        // 1. 🚨 獲取當前用戶資訊（這是必須的，即使 Token 失敗，也需要用戶 ID）
        // 這一行會利用瀏覽器中短暫存在的 Token，取得用戶的 ID
        const { data: { user } } = await supabase.auth.getUser(); 

        if (!user) {
            setLoading(false);
            // 這是最終錯誤：如果連用戶 ID 都取不到，表示 Token 已經徹底失效
            setError('安全連線中斷，無法識別用戶身份。請重新發送密碼重設郵件。');
            // 再次鎖定表單
            setPageActivated(false);
            return;
        }

        // 2. 🎯 使用服務密鑰直接更新用戶密碼 (繞過 Auth Session 檢查)
        const { error: updateError } = await supabaseService.auth.admin.updateUserById(
            user.id,
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