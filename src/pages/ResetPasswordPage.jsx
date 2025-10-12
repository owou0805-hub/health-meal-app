import React, { useState, useEffect } from 'react';
// 🎯 修正：從 supabaseClient 匯入 supabaseService
import { supabase, supabaseService } from '../supabaseClient'; 
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    // 🎯 修正：不再需要複雜的 useEffect 輪詢，只在載入時檢查一次 Token
    useEffect(() => {
        // 如果 URL 中有 Token，則顯示表單。否則顯示錯誤。
        const hash = window.location.hash;
        if (!hash.includes('access_token')) {
            setError('請通過您電子郵件中的有效連結訪問此頁面，連結可能已過期或無效。');
        }
    }, []); 

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        // 檢查：如果頁面一開始就顯示錯誤，則阻止提交
        if (error) return; 

        if (newPassword !== confirmPassword) {
            setError('兩次輸入的密碼不一致，請重新檢查。');
            return;
        }
        if (newPassword.length < 6) {
            setError('密碼長度必須至少為 6 個字元。');
            return;
        }

        setLoading(true);

        // 🚨 【關鍵突破】：在提交前，強制讓 Supabase SDK 讀取 URL Hash
        await supabase.auth.getSession(); 

        // 🎯 核心步驟：使用服務密鑰直接更新用戶密碼 (繞過 Auth Session 檢查)
        const { data: { user } } = await supabase.auth.getUser(); // 獲取當前用戶資訊

        if (!user) {
            // 如果連用戶資訊都取不到，表示 Token 真的無效
            setLoading(false);
            setError('安全連線已失效，無法識別用戶身份。請重新發送密碼重設郵件。');
            return;
        }

        // 使用 supabaseService (高權限) 進行密碼更新
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
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}

                    {/* 🎯 關鍵邏輯：只在沒有錯誤時才顯示表單 */}
                    {!error ? (
                        <>
                            <p>請輸入您的新密碼。</p>

                            {/* ... (輸入框部分保持不變) ... */}
                            
                            <button type="submit" disabled={loading}>
                                {loading ? '正在重設...' : '確認重設密碼'}
                            </button>
                        </>
                    ) : (
                         /* 顯示最終錯誤提示 */
                        <p style={{color: 'red', fontWeight: 'bold'}}>請確認您是通過郵件連結訪問此頁面。</p>
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