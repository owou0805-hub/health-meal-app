import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // 🎯 匯入 supabase

// 匯入佈局元件
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
// 匯入所有頁面元件
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
// ... (所有頁面元件匯入) ...
import ProfilePage from './pages/ProfilePage';
import RecipeDetailPage from './pages/RecipeDetailPage'; 
import RecipeListPage from './pages/RecipeListPage';
import RecipeDrawPage from './pages/RecipeDrawPage';
import RestaurantDrawPage from './pages/RestaurantDrawPage';
import SportDrawPage from './pages/SportDrawPage'; 
import FavoriteRecipesPage from './pages/FavoriteRecipesPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ContactPage from './pages/ContactPage';
import './index.css';


// ----------------------------------------------------
// 【頂層邏輯元件】：處理狀態、Token 監聽和導航
// ----------------------------------------------------
const RouterWrapper = ({ isLoggedIn, setIsLoggedIn, handleLogout, handleLogin }) => {
    const navigate = useNavigate();
    // 🎯 1. 立即檢查 URL Hash，並處理導航
    const handleAuthHash = () => {
        const hash = window.location.hash;
        
        // 檢查 URL 中是否有 Supabase 相關的 Auth Hash (Token 或 Error)
        if (hash.includes('access_token') || hash.includes('type=recovery')) {
            
            // 【重要】這裡不需要等待 Session，因為我們只負責導航
            
            // 清除 URL Hash (防止它遺留在下一頁)
            // 這裡不使用 navigate，而是直接操作 history，防止 navigate 影響 hash 解析
            window.history.replaceState(
                {}, 
                document.title, 
                window.location.pathname + window.location.search
            );

            // 導航到重設密碼頁面
            navigate('/reset-password', { replace: true });
            
            // 返回 true，通知渲染器應該跳過當前渲染
            return true;
        }
        return false;
    };
    
    // 檢查 Hash 是否存在，如果存在，立即返回 null 以停止當前渲染，並讓 navigate 執行
    if (handleAuthHash()) {
        return null; // 立即跳過渲染，讓 navigate 生效
    }

    // 2. 監聽 Auth 狀態變化，用於保持登入同步 (與導航無關)
    useEffect(() => {
        // 1. 首次掛載時檢查 Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
        });

        // 2. 監聽狀態變化，處理登入/登出同步
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsLoggedIn(!!session);
            
            // 🎯 【關鍵】：在任何 Auth 狀態變化時，如果 URL 仍然帶有 Token，就導航到重設頁。
            // 這個邏輯必須保留，因為它比 ResetPasswordPage 的 useEffect 更早觸發。
            const hash = window.location.hash;
            if (hash.includes('access_token') || hash.includes('type=recovery')) {
                navigate('/reset-password', { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, setIsLoggedIn]);

    
    // ====================================================================
    // 登入後路由集合 (MainLayout)
    // ====================================================================
    const LoggedInRoutes = useCallback(() => (
        // MainLayout 接收 handleLogout 函式
        <MainLayout handleLogout={handleLogout}> 
            <Routes>
                {/* 頁面路由：確保所有路徑都以 / 開頭，用於巢狀 Routes */}
                <Route path="/home" element={<HomePage />} />
                <Route path="/recipes" element={<RecipeListPage />} />
                <Route path="/recipes/draw" element={<RecipeDrawPage />} /> 
                <Route path="/recipe/:id" element={<RecipeDetailPage />} /> 
                <Route path="/restaurant-draw" element={<RestaurantDrawPage />} /> 
                <Route path="/sport-draw" element={<SportDrawPage />} />
                <Route path="/favorites" element={<FavoriteRecipesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* 導向：處理根目錄和 404 */}
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
        </MainLayout>
    ), [handleLogout]);


    // ====================================================================
    // 未登入路由集合 (AuthLayout)
    // ====================================================================
    const LoggedOutRoutes = useCallback(() => (
        <AuthLayout>
            <Routes>
                {/* 登入頁是 /，並處理其他未匹配路徑 */}
                <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthLayout>
    ), [handleLogin]);


    // 這裡渲染您的頂層路由
    return (
        <Routes>
            
            {/* 1. 獨立的密碼重設頁面 (不受登入狀態影響) */}
            <Route path="/reset-password" element={<ResetPasswordPage />} /> 

            {/* 2. 共享路由 (不需登入即可訪問) */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* 3. 核心邏輯：根據登入狀態渲染 Layouts 集合 */}
            <Route 
                path="*" 
                element={
                    isLoggedIn ? <LoggedInRoutes /> : <LoggedOutRoutes />
                }
            />
        </Routes>
    );
};
// ----------------------------------------------------


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    // 🎯 修正點：將 handleLogout 設為 async 並呼叫 supabase.auth.signOut()
    const handleLogout = async () => {
        // 1. 呼叫 Supabase API 終止 Session
        const { error } = await supabase.auth.signOut(); 

        if (error) {
            console.error('Supabase 登出錯誤:', error.message);
        }
        
        // 2. 更新 App 的本地狀態，觸發路由重新導向
        setIsLoggedIn(false);
    };

    return (
        <BrowserRouter>
            {/* 最終渲染 RouterWrapper，它在路由環境中處理所有邏輯和渲染 */}
            <RouterWrapper 
                isLoggedIn={isLoggedIn} 
                setIsLoggedIn={setIsLoggedIn} 
                handleLogout={handleLogout} 
                handleLogin={handleLogin}
            />
        </BrowserRouter>
    );
}

export default App;