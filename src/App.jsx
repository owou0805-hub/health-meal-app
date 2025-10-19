import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // 🎯 匯入 supabase

// 匯入佈局元件
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
// 匯入所有頁面元件 (已移除 ResetPasswordPage)
import LoginPage from './pages/LoginPage';
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
// 【頂層邏輯元件】：處理狀態、Session 監聽和導航
// ----------------------------------------------------
const AppLogicWrapper = ({ isLoggedIn, setIsLoggedIn, handleLogout, handleLogin }) => {
    
    // 🎯 關鍵修正：在這裡初始化 useNavigate Hook
    const navigate = useNavigate(); 
    
    // 儲存用戶的所有偏好設定
    const [userPreferences, setUserPreferences] = useState({
        goals: [],
        diet: '一般飲食',
        allergens: [],
    });
    
    // 獲取當前用戶的所有偏好設定函式
    const fetchUserPreferences = useCallback(async (userId) => {
        if (!userId) {
            setUserPreferences({ goals: [], diet: [], allergens: [] });
            return;
        }
        
        const { data } = await supabase
            .from('user_profiles')
            .select('health_goals, dietary_habit, allergens') 
            .eq('id', userId)
            .single();

        if (data) {
            setUserPreferences({
                goals: data.health_goals || [],
                diet: data.dietary_habit || '一般飲食',
                allergens: data.allergens || [],
            });
        } else {
            setUserPreferences({ goals: [], diet: '一般飲食', allergens: [] });
        }
    }, []); 

    
    // 監聽 Auth 狀態變化和 Session 
    useEffect(() => {
        // 1. 首次掛載時檢查 Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
            if (session) { fetchUserPreferences(session.user.id); }
        });

        // 2. 監聽狀態變化，處理登入/登出同步
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsLoggedIn(!!session);
            
            if (session) {
                fetchUserPreferences(session.user.id);
            } else {
                setUserPreferences({ goals: [], diet: [], allergens: [] }); 
            }
        });

        // 3. 處理密碼重設連結點擊後的自動導航 (已移除，因用戶無此頁面)
        
        return () => subscription.unsubscribe();
    }, [setIsLoggedIn, fetchUserPreferences, navigate]); 

    
    // ====================================================================
    // 登入後路由集合 (MainLayout)
    // ====================================================================
    const LoggedInRoutes = useCallback(() => (
        <MainLayout handleLogout={handleLogout}>
            <Routes>
                <Route path="/home" element={<HomePage />} />
                <Route path="/recipes" element={<RecipeListPage />} />
                
                {/* 🎯 【核心修正】：將 preferences 物件解構後傳遞 */}
                <Route 
                    path="/recipes/draw" 
                    element={<RecipeDrawPage 
                        defaultGoals={userPreferences.goals}
                        defaultDiet={userPreferences.diet} 
                        defaultAllergens={userPreferences.allergens}
                    />} 
                /> 
                
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
    ), [handleLogout, userPreferences]);


    // ====================================================================
    // 未登入路由集合 (AuthLayout)
    // ====================================================================
    const LoggedOutRoutes = useCallback(() => (
        <AuthLayout>
            <Routes>
                <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthLayout>
    ), [handleLogin]);


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

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut(); 
        if (error) {
            console.error('Supabase 登出錯誤:', error.message);
        }
    };

    return (
        <BrowserRouter>
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