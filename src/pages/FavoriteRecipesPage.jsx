// src/pages/FavoriteRecipesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import RecipeCard from '../components/RecipeCard'; // 假設您要用 RecipeCard 來顯示
import '../index.css'; 

const FavoriteRecipesPage = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFavorites = async () => {
        setLoading(true);
        setError(null);
        
        // 必須先獲取當前用戶 ID
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return; // 未登入則不執行查詢
        }

        // 🎯 核心：使用 JOIN 語句獲取收藏的食譜詳情
        // 從 user_favorites 表開始，JOIN 到 recipes 表
        const { data, error: fetchError } = await supabase
            .from('user_favorites')
            .select(`
                recipe:recipes (id, title, description, image_url, tags, duration_min, calories) 
                /* 這裡使用 'recipe' 替換掉整個 recipes 表，並選取所需欄位 */
            `)
            .eq('user_id', user.id); // RLS 應該會自動處理這個篩選，但手動加上更穩妥

        if (fetchError) {
            console.error('Error fetching favorites:', fetchError);
            setError('無法載入收藏清單。請檢查網路或權限。');
        } else {
            // 清理數據：將巢狀的 recipe 物件提升到頂層
            const favoriteRecipes = data
                .map(item => item.recipe)
                .filter(recipe => recipe !== null); // 移除因關聯性缺失導致的空值
                
            setFavorites(favoriteRecipes);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFavorites();
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
                        // 🎯 使用 RecipeCard 元件來渲染食譜，保持介面一致
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