// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
// 🎯 【新增】：匯入 Supabase 客戶端
import { supabase } from '../supabaseClient'; // 請根據您的路徑調整

const LoginPage = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 🎯 【新增】：錯誤訊息狀態，用於顯示認證錯誤
  const [authError, setAuthError] = useState(null); 
  const [loading, setLoading] = useState(false); // 避免重複點擊

  const navigate = useNavigate();

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
      // 處理 Supabase 錯誤
      console.error('Supabase Auth Error:', error.message);
      setAuthError(`認證失敗: ${error.message}`);
      
    } else if (isRegistering) {
        // 註冊成功，但 Supabase 預設會發送驗證信
        // 🚨 注意：如果您的 Supabase 設定為需要電子郵件驗證，
        //          用戶不會立即登入。這裡給出提示即可。
        setAuthError("🎉 註冊成功！請檢查您的電子郵件信箱以完成驗證和登入。");
        // 清空表單，導回登入畫面
        setEmail('');
        setPassword('');
        setIsRegistering(false);
        
    } else if (authResponse.data.session) {
      // 登入成功：session 存在
      console.log('登入成功，User ID:', authResponse.data.user.id);
      // 呼叫父組件的 onLogin 函式來更新應用程式的登入狀態
      onLogin(); 
    } else {
        // 處理其他異常情況（例如 session 不存在，但在這個流程中較少見）
        setAuthError("登入/註冊過程發生未知錯誤。");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
        alert("請先在電子郵件欄位中輸入您的帳號。");
        return;
    }
    
    setLoading(true);
    setAuthError(null);
    
    const targetUrl = window.location.origin + '/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // 🚨 這是關鍵！我們要求 Supabase 在重設後將 User ID 導向回我們的頁面
        // Supabase 的驗證服務會自動處理這個參數。
        redirectTo: targetUrl + '?user_id={{user.id}}', 
    });
    
    setLoading(false);
    
    if (error) {
        console.error('Password Reset Error:', error.message);
        setAuthError(`密碼重設失敗: ${error.message}`);
    } else {
        alert(`密碼重設連結已發送到 ${email}。請檢查您的收件匣！`);
    }
  };

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
            <p 
                onClick={!loading ? handleForgotPassword : null} 
                className={`forgot-password-link ${loading ? 'disabled-link' : ''}`}
            >
                忘記密碼？
            </p>
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