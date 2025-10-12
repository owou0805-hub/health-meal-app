import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // 🎯 匯入 supabase

// 匯入佈局元件
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
// 匯入所有頁面元件
import LoginPage from './pages/LoginPage';
// 🎯 【移除】: import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
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
// 【核心邏輯】：處理狀態和 Session 監聽
// ----------------------------------------------------
const AppLogicWrapper = ({ isLoggedIn, setIsLoggedIn, handleLogout, handleLogin }) => {
    
    // 🎯 監聽 Auth 狀態變化和 Session 
    useEffect(() => {
        // 1. 首次掛載時檢查是否有活動 Session (保持登入狀態)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
        });

        // 2. 監聽狀態變化，處理登入/登出同步
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsLoggedIn(!!session);
        });

        // 清理函數：組件卸載時取消訂閱
        return () => subscription.unsubscribe();
    }, [setIsLoggedIn]);

    
    // ====================================================================
    // 登入後路由集合 (MainLayout)
    // ====================================================================
    const LoggedInRoutes = useCallback(() => (
        <MainLayout handleLogout={handleLogout}>
            <Routes>
                {/* 頁面路由：所有功能頁面 */}
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
            
            {/* 1. 共享路由 (不需登入即可訪問) */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* 2. 核心邏輯：根據登入狀態渲染 Layouts 集合 */}
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

    // 🎯 修正：登出邏輯 (使用 async 函式清除 Supabase Session)
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut(); 
        if (error) {
            console.error('Supabase 登出錯誤:', error.message);
        }
        // 狀態會通過 onAuthStateChange 監聽器自動更新為 false
    };

    return (
        <BrowserRouter>
            {/* 最終渲染 AppLogicWrapper，它在路由環境中處理所有邏輯和渲染 */}
            <AppLogicWrapper 
                isLoggedIn={isLoggedIn} 
                setIsLoggedIn={setIsLoggedIn} 
                handleLogout={handleLogout} 
                handleLogin={handleLogin}
            />
        </BrowserRouter>
    );
}

export default App;