// src/pages/HomePage.jsx

import React, {useState, useEffect, useCallback} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useImageLoader from '../hooks/useImageLoader';
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
    
    // 搜尋欄狀態
    const [searchTerm, setSearchTerm] = useState('');
    
    // Banner 狀態
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    // 每日健康小知識輪播狀態 
    const [dailyTips, setDailyTips] = useState([]);
    const [currentTipIndex, setCurrentTipIndex] = useState(0); 
    const [loadingTips, setLoadingTips] = useState(true);

    // 食譜資料和推薦食譜
    const [allRecipes, setAllRecipes] = useState([]); 
    const [dailyRecipe, setDailyRecipe] = useState(null);
    const [loadingRecipes, setLoadingRecipes] = useState(true);

    // 搜尋欄邏輯
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

    // Banner 的自動輪播邏輯
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBannerIndex((prevIndex) =>
                (prevIndex + 1) % banners.length
            ); //
        }, 4000);; 
        
        return () => {
            clearInterval(interval);
        };
    }, []);

    // 從 Supabase 獲取每日小知識的邏輯
    useEffect(() => {
        const fetchDailyTips = async () => {
            setLoadingTips(true);
            
            const { data, error } = await supabase
                .from('daily_tips')
                .select('id, title, content, category');
                
            if (error) {
                console.error('Error fetching daily tips:', error);
            } else {
                const tips = data || [];
                setDailyTips(tips); 
                if (tips.length > 0) {
                    const dailyIndex = getDailyRandomIndex(tips.length);
                    setCurrentTipIndex(dailyIndex); // 設定當天固定顯示的 Tip 索引
                }
            }
            setLoadingTips(false);
        };
        
        fetchDailyTips();
    }, []); 

    // 獲取食譜並選擇每日精選
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
    // 輔助函數：安全獲取 Tags (用於 JSX 渲染)
    const getSafeTags = (tags) => {
        if (Array.isArray(tags)) return tags;
        if (typeof tags === 'string' && tags.trim()) {
            return tags.replace(/[{}]/g, '').split(',').map(t => t.trim()).filter(t => t);
        }
        return [];
    };
    // 從 dailyTips 陣列和 currentTipIndex 獲取當前 Tip 物件
    const currentTip = dailyTips.length > 0 && dailyTips[currentTipIndex] ? dailyTips[currentTipIndex] : null;
    const { imageUrl: dailyRecipeImageUrl, loading: loadingImage } = useImageLoader(dailyRecipe?.image_url);
    return (
        <div className="home-page-content">

            {/* 搜尋欄位 */}
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

            {/* 輪播圖區塊 (Banner) */}
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
        
            {/* 每日健康小知識輪播區塊 */}
            <div className="daily-tips-section">
                <h3 className="heandline-font">每日健康小知識</h3>
                {loadingTips ? (
                    <p style={{textAlign: 'center'}}>載入小知識中...</p> 
                ) : currentTip ? ( // 檢查 currentTip 是否存在
                    <div className="tip-card">
                        <h4>{currentTip.title}</h4>
                        <p className="tip-content">{currentTip.content}</p> 
                        <span className="tip-category">{currentTip.category}</span>
                    </div>
                ) : (
                    <p style={{textAlign: 'center', color: '#888'}}>目前沒有可顯示的健康小知識。</p> //
                )}
            </div>

            {/* 頁面內容：每日精選與功能入口 */}
              <div className="feature-section">
                <h2 className="heandline-font">今日輕食精選</h2> {/* */}
                <p>探索我們今日為您挑選的一道健康美味！</p> {/* */}

                {loadingRecipes ? (
                    <p>正在為您挑選每日精選...</p> //
                ) : dailyRecipe ? (
                    /* 每日推薦卡片 - 使用您提供的結構 */
                    <div className="daily-recommend-card">
                        <Link to={`/recipe/${dailyRecipe.id}`} className="recipe-card-link"> {/* */}
                            <div className="recipe-card"> {/* */}
                                {loadingImage ? ( // 檢查圖片 URL 是否正在載入
                                    <div className="recipe-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', height: '150px' }}>
                                        圖片載入中...
                                    </div>
                                ) : (
                                    <img
                                        // 使用從 useImageLoader 獲取的 URL
                                        src={dailyRecipeImageUrl}
                                        alt={dailyRecipe.title} //
                                        className="recipe-card-img" //
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-recipe.jpg'; }}
                                    />
                                )}
                                <h3>{dailyRecipe.title}</h3> {/* */}
                                <p className="highlight-text">
                                    {getSafeTags(dailyRecipe.tags).slice(0, 2).join(' | ')} {/* */}
                                </p>
                                <span className="toggle-form-link" style={{ marginTop: '0.5rem' }}>
                                    查看詳情 »
                                </span> {/* */}
                            </div>
                        </Link>
                    </div>
                ) : (
                    <p>目前食譜庫中沒有可推薦的食譜。</p> //
                )}

                {/* 快速功能按鈕 */}
                <div className="quick-access-buttons">
                    <Link to="/recipes" className="quick-button primary-btn-outline">
                        查看所有食譜清單
                    </Link>
                    <Link to="/recipes/draw" className="quick-button primary-btn">
                        快速抽卡：「現在煮？」
                    </Link>
                    <Link to="/restaurant-draw" className="quick-button primary-btn">
                        快速抽卡：「現在去吃？」
                    </Link>
                    <Link to="/sport-draw" className="quick-button primary-btn">
                        快速抽卡：「運動一下」
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default HomePage;