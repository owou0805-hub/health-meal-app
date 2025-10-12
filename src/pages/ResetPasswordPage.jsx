// src/pages/ResetPasswordPage.jsx (簡化邏輯，專注於表單)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // 關鍵修正：預設為 TRUE，讓使用者可以點擊，然後在提交時才檢查 Session
    const [sessionReady, setSessionReady] = useState(true); 
    
    const navigate = useNavigate();

    // 🎯 核心修正：移除所有 useEffect 邏輯，信任 Supabase 已經設定好 Session
    
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage('');

        // 🚨 這是最關鍵的檢查：在提交時，確認 Session 是否存在
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
        // ... (後續的成功/失敗導航邏輯保持不變)
    };

    return (
        <div className="page-container-main">
            <h1 className="main-title">重設密碼</h1>
            <div className="auth-form-container">
                <form onSubmit={handlePasswordReset} className="auth-form">
                    
                    {/* 錯誤/成功訊息區 (只顯示實際錯誤) */}
                    {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                    {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}

                    {/* 🎯 移除所有等待提示，預設表單是啟用的 */}
                    
                    <p>請輸入您的新密碼。</p>
                    {/* ... (輸入框不再禁用，移除 disabled={!sessionReady} ) ... */}
                    
                    <button type="submit" disabled={loading}> {/* 移除 || !sessionReady */}
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