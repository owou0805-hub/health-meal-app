// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react'; // 【修正】：必須匯入 useState 和 useEffect
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../index.css'; // 確保引入全域 CSS

// 【修正】：必須匯入圖片檔案
// 請確保你的圖片檔案路徑是正確的！
import banner1 from '../assets/banner1.jpg'; 
import banner2 from '../assets/banner2.jpg'; 
import banner3 from '../assets/banner3.jpg'; 

// 假設這是一個虛擬的食譜資料，之後會替換為 Supabase 資料
const dummyRecipes = [
  { id: 1, title: '高蛋白雞胸肉沙拉', tags: ['高蛋白', '低碳水'] },
  { id: 2, title: '鮮蔬豆腐湯', tags: ['素食', '快速'] },
  { id: 3, title: '藜麥水果優格杯', tags: ['早餐', '快速'] },
  { id: 4, title: '鮭魚酪梨醬厚吐司', tags: ['早餐', '快速'] },
];

const banners = [banner1, banner2, banner3]; // 輪播圖片陣列

const HomePage = () => {
  // 儲存搜尋欄輸入值的狀態
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    // 處理輸入框內容變化的函式
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // 處理搜尋送出（按下 Enter 或點擊按鈕）的函式
    const handleSearchSubmit = (event) => {
        event.preventDefault(); // 阻止表單預設的重新載入行為
        const trimmedSearchTerm = searchTerm.trim(); // 確保沒有前後空白
        if (trimmedSearchTerm === '') {
        return; // 避免搜尋空白內容
        }
        
        // 【下一步：在這裡執行實際的搜尋導向或篩選邏輯】
        console.log("開始搜尋食譜:", searchTerm);
        
        //  navigate 導向到 /recipes，並將關鍵字編碼後作為 URL 參數
        // encodeURIComponent 確保關鍵字中若有空格或特殊符號能被正確傳遞
        navigate(`/recipes?search=${encodeURIComponent(trimmedSearchTerm)}`); 
        
        // 導向後清空搜尋欄，提供更好的用戶體驗
        setSearchTerm('');
    };
    
  // 1. 輪播圖的狀態管理
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // 2. 自動輪播的邏輯 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % banners.length
      );
    }, 4000); // 4 秒
    
    return () => clearInterval(interval); // 清除定時器，避免記憶體洩漏
  }, []);

  return (
    <div className="page-container-main home-page-content">

      {/* 新增搜尋欄位 */}
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
            // Style for quick visibility and demonstration:
            style={{ 
              display: index === currentBannerIndex ? 'block' : 'none',
              width: '100%',
              height: '270px', // 固定高度，可在 CSS 中調整
              objectFit: 'cover'
            }}
          />
        ))}
      </div>
      
      {/*頁面內容 -> 每日精選與功能入口*/}
      <div className="feature-section">
                <h2 className="heandline-font">今日輕食精選</h2>
                <p>探索我們今日為您挑選的一道健康美味！</p>
                
                {/* 每日推薦卡片 (或您可以選擇在這裡顯示第一筆 dummyRecipes) */}
                <div className="daily-recommend-card">
                    {/* 我們暫時顯示第一道食譜作為每日精選 */}
                    {dummyRecipes.length > 0 && (
                        <Link to={`/recipe/${dummyRecipes[0].id}`} className="recipe-card-link">
                            <div className="recipe-card"> 
                                <img 
                                    src={dummyRecipes[0].imageUrl || '/placeholder-recipe.jpg'} 
                                    alt={dummyRecipes[0].title} 
                                    className="recipe-card-img" 
                                />
                                <h3>{dummyRecipes[0].title}</h3>
                                <p className="highlight-text">{dummyRecipes[0].tags.join(' | ')}</p>
                                <span className="toggle-form-link" style={{ marginTop: '0.5rem' }}>
                                    查看詳情 »
                                </span>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

        </div>
  );
};

export default HomePage;