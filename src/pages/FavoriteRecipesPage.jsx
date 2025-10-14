// src/pages/FavoriteRecipesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import RecipeCard from '../components/RecipeCard'; 
import '../index.css'; 

const FavoriteRecipesPage = () => {
    // 狀態
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 函式：從 Supabase 獲取收藏清單並 JOIN 食譜詳情
    const fetchFavorites = async () => {
        setLoading(true);
        setError(null);
        
        // 必須先獲取當前用戶 ID，用於查詢和 RLS 驗證
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            // 由於此頁面需要登入，如果沒有 user，我們只顯示空狀態
            return; 
        }

        // 🎯 核心：使用 JOIN 語句獲取收藏的食譜詳情
        // 這是正確的 Supabase 巢狀 select 語法
        const { data, error: fetchError } = await supabase
            .from('user_favorites')
            .select(`
              recipe:recipes (
                    id, 
                    title, 
                    description, 
                    tags, 
                    image_url, 
                    duration_min, 
                    calories, 
                    ingredients, 
                    instructions
                ) 
            `)
            .eq('user_id', user.id); // 手動加上篩選條件，以確保 RLS 成功

        if (fetchError) {
            console.error('Error fetching favorites:', fetchError);
            setError('無法載入收藏清單。請檢查網路或權限。');
        } else {
            // 清理數據：從 [{recipe: {...}}, {recipe: {...}}] 結構中取出內層的食譜物件
            const favoriteRecipes = data
                .map(item => item.recipe)
                .filter(recipe => recipe !== null); // 過濾掉找不到食譜詳情的記錄
                
            setFavorites(favoriteRecipes);
        }
        setLoading(false);
    };

    // 頁面載入時執行一次，以及當用戶狀態變化時 (雖然在這裡不必要，但保持乾淨)
    useEffect(() => {
        // 確保用戶登入後才執行 fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
             if (session) {
                 fetchFavorites();
             } else {
                 setLoading(false);
             }
        });
    }, []);

    // JSX 渲染邏輯
    if (loading) {
        return <div className="page-container-main"><p style={{textAlign: 'center'}}>正在載入您的收藏...</p></div>;
    }

    if (error) {
        return <div className="page-container-main"><p style={{textAlign: 'center', color: 'red'}}>錯誤: {error}</p></div>;
    }

    return (
        <div className="page-container-main">
            <h2 className="heandline-font">我的收藏食譜</h2>
            
            {favorites.length > 0 ? (
                <div className="recipe-grid-container">
                    {favorites.map(recipe => (
                        // 🎯 使用 RecipeCard 元件來渲染食譜
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
            ) : (
                <p style={{textAlign: 'center', marginTop: '30px'}}>
                    您目前還沒有收藏任何食譜。快去食譜清單尋找吧！
                </p>
            )}
        </div>
    );
};

export default FavoriteRecipesPage;