// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../index.css'; 
import banner1 from '../assets/banner1.jpg'; 
import banner2 from '../assets/banner2.jpg'; 
import banner3 from '../assets/banner3.jpg'; 

const banners = [banner1, banner2, banner3]; // 輪播圖片陣列
// 輔助函數：根據日期生成穩定的隨機索引
const getDailyRandomIndex = (max) => {
    // 獲取今天的日期 (YYYYMMDD 格式) 作為種子
    const now = new Date();
    const dateString = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    
    // 使用一個簡單的偽隨機函數
    let seed = dateString;
    // 簡單的哈希函數
    for (let i = 0; i < 5; i++) {
        seed = (seed * 9301 + 49297) % 233280;
    }
    // 返回一個穩定的隨機索引
    return Math.floor((seed / 233280) * max);
};



const HomePage = () => {
    const navigate = useNavigate();
    
    // --- 搜尋欄狀態 ---
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- Banner 狀態 ---
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    // --- 每日健康小知識輪播狀態 ---
    const [dailyTips, setDailyTips] = useState([]);
    const [currentTipIndex, setCurrentTipIndex] = useState(0); 
    const [loadingTips, setLoadingTips] = useState(true);

    // 🎯 【新增狀態】：食譜資料和推薦食譜
    const [allRecipes, setAllRecipes] = useState([]); 
    const [dailyRecipe, setDailyRecipe] = useState(null);
    const [loadingRecipes, setLoadingRecipes] = useState(true);

    // --- 搜尋欄邏輯 ---
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault(); 
        const trimmedSearchTerm = searchTerm.trim();
        if (trimmedSearchTerm === '') {
            return; 
        }
        
        // 導向到食譜清單頁面 /recipes 並帶上搜尋參數
        navigate(`/recipes?search=${encodeURIComponent(trimmedSearchTerm)}`);
        setSearchTerm('');
    };

    // ----------------------------------------------------
    // 🎯 Banner & Tip 的自動輪播邏輯
    // ----------------------------------------------------
    useEffect(() => {
        // Banner 自動輪播 (每 4 秒)
        const interval = setInterval(() => {
            setCurrentBannerIndex((prevIndex) => 
                (prevIndex + 1) % banners.length
            );
        }, 4000); 
        
        // Tip 自動輪播 (每 8 秒)
        const tipInterval = setInterval(() => {
            setDailyTips(prevTips => {
                if (prevTips.length > 0) {
                    setCurrentTipIndex(prevIndex => (prevIndex + 1) % prevTips.length);
                }
                return prevTips;
            });
        }, 8000); 

        return () => {
            clearInterval(interval);
            clearInterval(tipInterval);
        };
    }, []);

    // ----------------------------------------------------
    // 🎯 從 Supabase 獲取每日小知識的邏輯
    // ----------------------------------------------------
    useEffect(() => {
        const fetchDailyTips = async () => {
            setLoadingTips(true);
            
            const { data, error } = await supabase
                .from('daily_tips')
                .select('*'); 
                
            if (error) {
                console.error('Error fetching daily tips:', error);
            } else {
                setDailyTips(data || []);
            }
            setLoadingTips(false);
        };
        
        fetchDailyTips();
    }, []); 

    // 🎯 【新增】：獲取食譜並選擇每日精選
    // ----------------------------------------------------
    const fetchAndSelectDailyRecipe = useCallback(async () => {
        setLoadingRecipes(true);
        
        const { data, error } = await supabase
            .from('recipes')
            .select('id, title, tags, description, image_url, duration_min, calories'); // 只獲取需要的欄位

        if (error) {
            console.error('Error fetching recipes for homepage:', error);
            setLoadingRecipes(false);
            return;
        }

        const recipes = data || [];
        if (recipes.length > 0) {
            // 1. 根據食譜總數獲取一個穩定的每日索引
            const randomIndex = getDailyRandomIndex(recipes.length);
            
            // 2. 設定每日推薦食譜
            setDailyRecipe(recipes[randomIndex]);
            setAllRecipes(recipes); // 儲存所有食譜，以備後續擴展使用
        }
        setLoadingRecipes(false);
    }, []);
    
    useEffect(() => {
        fetchAndSelectDailyRecipe();
    }, [fetchAndSelectDailyRecipe]);
    // 🎯 輔助函數：安全獲取 Tags (用於 JSX 渲染)
    const getSafeTags = (tags) => {
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string' && tags.trim()) {
            return tags.replace(/[{}]/g, '').split(',').map(t => t.trim()).filter(t => t);
        }
        return [];
    };
    return (
        <div className="home-page-content">
            
            {/* --------------------------------- */}
            {/* 1. 搜尋欄位 */}
            {/* --------------------------------- */}
            <form className="main-search-bar" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    placeholder="輸入食材、食譜名稱，立即搜尋..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <button type="submit">
                    <i className="fas fa-search"></i> 搜尋
                </button>
            </form>

            {/* --------------------------------- */}
            {/* 2. 輪播圖區塊 (Banner) */}
            {/* --------------------------------- */}
            <div className="banner-container">
                {banners.map((banner, index) => (
                    <img
                        key={index}
                        src={banner}
                        alt={`網站宣傳圖 ${index + 1}`}
                        className={`banner-img ${index === currentBannerIndex ? 'active' : 'inactive'}`}
                        style={{ 
                            display: index === currentBannerIndex ? 'block' : 'none',
                            width: '100%',
                            height: '350px', 
                            objectFit: 'cover'
                        }}
                    />
                ))}
            </div>
            
            {/* --------------------------------- */}
            {/* 3. 每日健康小知識輪播區塊 */}
            {/* --------------------------------- */}
            <div className="daily-tips-section">
                <h3 className="heandline-font">🧠 每日健康提醒</h3>
                {loadingTips ? (
                    <p style={{textAlign: 'center'}}>載入小知識中...</p>
                ) : currentTip ? (
                    <div className="tip-card">
                        <h4>{currentTip.title}</h4>
                        <p className="tip-content">{currentTip.content}</p>
                        <span className="tip-category">{currentTip.category}</span>
                    </div>
                ) : (
                    <p style={{textAlign: 'center', color: '#888'}}>目前沒有可顯示的健康小知識。</p>
                )}
            </div>


            {/* --------------------------------- */}
            {/* 4. 頁面內容：每日精選與功能入口 */}
            {/* --------------------------------- */}
            <div className="feature-section">
                <h2 className="heandline-font">今日輕食精選</h2>
                <p>探索我們今日為您挑選的一道健康美味！</p>
                
                {loadingRecipes ? (
                    <p>正在為您挑選每日精選...</p>
                ) : dailyRecipe ? (
                    /* 每日推薦卡片 */
                    <div className="daily-recommend-card">
                        <Link to={`/recipe/${dailyRecipe.id}`} className="recipe-card-link">
                            <div className="recipe-card"> 
                                <img 
                                    src={dailyRecipe.image_url || '/placeholder-recipe.jpg'} // 假設已連動 Storage
                                    alt={dailyRecipe.title} 
                                    className="recipe-card-img" 
                                />
                                <h3>{dailyRecipe.title}</h3>
                                <p className="highlight-text">
                                    {getSafeTags(dailyRecipe.tags).slice(0, 2).join(' | ')}
                                </p>
                                <span className="toggle-form-link" style={{ marginTop: '0.5rem' }}>
                                    查看詳情 »
                                </span>
                            </div>
                        </Link>
                    </div>
                ) : (
                    <p>目前食譜庫中沒有可推薦的食譜。</p>
                )}

                {/* 快速功能按鈕 */}
                <div className="quick-access-buttons">
                    <Link to="/recipes" className="quick-button primary-btn-outline">
                        查看所有食譜清單
                    </Link>
                    <Link to="/recipes/draw" className="quick-button primary-btn">
                        懶人抽卡：「現在吃？」
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default HomePage;