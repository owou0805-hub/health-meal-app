// src/components/RecipeCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useImageLoader from '../hooks/useImageLoader'; // 🎯 在這裡使用 Hook

const RecipeCard = ({ recipe }) => {
    // 1. 在元件頂層呼叫 Hook
    const { imageUrl: cardImageUrl, loading: imageLoading } = useImageLoader(recipe.image_url);

    // 2. 處理 Tags 顯示邏輯 (可重複使用)
    const getSafeTags = (tags) => {
        // (這裡使用您 App.jsx 裡已經定義的 Tags 邏輯)
        if (Array.isArray(tags)) {
            return tags; 
        }
        if (typeof tags === 'string' && tags.trim()) {
            return tags
                .replace(/[{}]/g, '')
                .split(',')
                .map(t => t.trim())
                .filter(t => t); 
        }
        return [];
    };

    const tagsForDisplay = getSafeTags(recipe.tags).slice(0, 2).map(t => 
        t.charAt(0).toUpperCase() + t.slice(1)
    );

    return (
        <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="recipe-card-link">
            <div className="recipe-card"> 
                
                {/* 圖片載入提示 (可選) */}
                {imageLoading && <p className="image-loading-text">載入中...</p>} 

                <img 
                    src={cardImageUrl} 
                    alt={recipe.title} 
                    className="recipe-card-img" 
                />
                
                <h3>{recipe.title}</h3>
                
                {/* Tags 顯示區塊 */}
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