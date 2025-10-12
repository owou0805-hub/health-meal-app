// src/pages/LoginPage.jsx
import React, { useState } from 'react';
// 【注意】：不再需要 useNavigate，因為登入導航由 App.jsx 狀態處理
// import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient'; 

const LoginPage = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState(null); 
    const [loading, setLoading] = useState(false); 

    // 🎯 移除 handleForgotPassword 函式 (不再需要)
    /* const handleForgotPassword = async () => { ... }; */

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        
        if (!email || !password) {
            setAuthError("請輸入有效的電子郵件和密碼。");
            return;
        }

        setLoading(true);
        let error = null;
        let authResponse = null;

        if (isRegistering) {
            // 🎯 註冊邏輯：呼叫 Supabase auth.signUp
            authResponse = await supabase.auth.signUp({
                email,
                password,
            });
            error = authResponse.error;
        } else {
            // 🎯 登入邏輯：呼叫 Supabase auth.signInWithPassword
            authResponse = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            error = authResponse.error;
        }

        setLoading(false);

        if (error) {
            console.error('Supabase Auth Error:', error.message);
            setAuthError(`認證失敗: ${error.message}`);
            
        } else if (isRegistering) {
            // 註冊成功
            setAuthError("🎉 註冊成功！請檢查您的電子郵件信箱以完成驗證和登入。");
            setEmail('');
            setPassword('');
            setIsRegistering(false);
            
        } else if (authResponse.data.session) {
            // 登入成功
            console.log('登入成功，User ID:', authResponse.data.user.id);
            onLogin(); 
        } else {
            setAuthError("登入/註冊過程發生未知錯誤。");
        }
    };

    // 🎯 移除 handleForgotPassword 函式 (不再需要)
    /* const handleForgotPassword = async () => { ... }; */

    return (
        <div>
            <h1 className="main-title"><span className="heandline-font">Welcome !</span></h1>
            <p><span className="special-font">今天吃什麼呢？一起來找屬於你的健康食譜</span>！</p>

            <div className="auth-form-container">
                {isRegistering ? (
                    // 註冊表單
                    <form onSubmit={handleFormSubmit} className="auth-form"> 
                        <h2>註冊</h2>
                        {/* 錯誤訊息顯示區 */}
                        {authError && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{authError}</p>}
                        
                        <div className="input-group">
                            <label htmlFor="reg-email">電子郵件：</label>
                            <input
                                id="reg-email"
                                type="email"
                                required
                                placeholder="請輸入電子郵件"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="reg-password">密碼：</label>
                            <input
                                id="reg-password"
                                type="password"
                                required
                                placeholder="請輸入密碼 (至少6個字元)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? '處理中...' : '註冊'}
                        </button>
                        <p onClick={() => { setIsRegistering(false); setAuthError(null); }} className="toggle-form-link">
                            已有帳號？返回登入
                        </p>
                    </form>
                ) : (
                    // 登入表單
                    <form onSubmit={handleFormSubmit} className="auth-form"> 
                        <h2>登入</h2>
                        {/* 錯誤訊息顯示區 */}
                        {authError && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{authError}</p>}
                        
                        <div className="input-group">
                            <label htmlFor="login-email">電子郵件：</label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                placeholder="請輸入電子郵件"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="login-password">密碼：</label>
                            <input
                                id="login-password"
                                type="password"
                                required
                                placeholder="請輸入密碼"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? '登入中...' : '登入'}
                        </button>
                        
                        {/* 🎯 【關鍵】：移除忘記密碼的連結 */}
                        {/* <p onClick={!loading ? handleForgotPassword : null} ... >忘記密碼？</p> */}

                        <p onClick={() => { setIsRegistering(true); setAuthError(null); }} className="toggle-form-link">
                            還沒有帳號？立即註冊
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;