// src/components/RecipeCard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useImageLoader from '../hooks/useImageLoader'; 
import { supabase } from '../supabaseClient'; // 🎯 引入 supabase


// 收藏邏輯 Hook
const useFavoriteStatus = (recipeId) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const [loading, setLoading] = useState(true);

    // 檢查收藏狀態
    const checkFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // 未登入則跳過

        // 查詢 user_favorites 表，看是否有該用戶和該食譜的記錄
        const { data, error } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('recipe_id', recipeId)
            .maybeSingle(); // 只返回一筆或 null

        setIsFavorited(!!data);
        setLoading(false);
    };

    // 處理收藏/取消收藏
    const toggleFavorite = async (e) => {
        e.preventDefault(); // 阻止 Link 跳轉到詳情頁
        e.stopPropagation(); // 阻止事件冒泡

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("請先登入才能收藏食譜！");
            return;
        }

        setLoading(true);

        if (isFavorited) {
            // 取消收藏：刪除記錄
            await supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('recipe_id', recipeId);
            setIsFavorited(false);

        } else {
            // 新增收藏：插入記錄
            await supabase
                .from('user_favorites')
                .insert([{ user_id: user.id, recipe_id: recipeId }]);
            setIsFavorited(true);
        }
        setLoading(false);
    };
    
    useEffect(() => {
        checkFavorite();
    }, [recipeId]); 

    return { isFavorited, toggleFavorite, loading };
};


const RecipeCard = ({ recipe }) => {
    // 獲取圖片 URL
    const { imageUrl: cardImageUrl } = useImageLoader(recipe.image_url);
    // 🎯 獲取收藏狀態
    const { isFavorited, toggleFavorite, loading: favLoading } = useFavoriteStatus(recipe.id);

    // 處理 Tags 顯示邏輯 (這裡假設 getSafeTags 已經在全局定義或從其他地方匯入)
    const getSafeTags = (tags) => {
        if (Array.isArray(tags)) return tags.map(t => t.trim().toLowerCase());
        if (typeof tags === 'string' && tags.trim()) {
            return tags.replace(/[{}]/g, '').split(',').map(t => t.trim()).filter(t => t); 
        }
        return [];
    };

    const tagsForDisplay = getSafeTags(recipe.tags).slice(0, 2).map(t => 
        t.charAt(0).toUpperCase() + t.slice(1)
    );

    return (
        // 保持 Link 結構
        <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="recipe-card-link">
            <div className="recipe-card"> 
                
                {/* 收藏按鈕區塊 */}
                <button 
                    onClick={toggleFavorite} 
                    disabled={favLoading}
                    className="favorite-button"
                >
                    {/* 使用條件渲染顯示空心或實心愛心 */}
                    <span 
                        role="img" 
                        aria-label="收藏" 
                        className={isFavorited ? 'heart-filled' : 'heart-empty'}
                    >
                        {isFavorited ? '❤️' : '♡'}
                    </span>
                </button>
                
                {/* 圖片區塊 */}
                <img 
                    src={cardImageUrl} 
                    alt={recipe.title} 
                    className="recipe-card-img" 
                />
                
                {/* ... 其他內容 (標題和 Tags) ... */}
                <h3>{recipe.title}</h3>
                
                <div className="recipe-card-tags">
                    {tagsForDisplay.map((tag, index) => (
                        <span key={index} className="card-tag-pill">{tag}</span>
                    ))}
                </div>
            </div>
        </Link>
    );
};

export default RecipeCard;