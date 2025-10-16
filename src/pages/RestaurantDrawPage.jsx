// src/pages/RestaurantDrawPage.jsx
import React, { useState, useEffect } from 'react';
import '../index.css'; 
import { supabase } from '../supabaseClient';   

// 篩選器的選項 (這些選項將用於前端介面顯示)
const LOCATION_FILTERS = ['台中西屯區', '台中南屯區', '台中北區', '台中南區'];
const TYPE_FILTERS = ['沙拉', '輕食', '水煮餐', '健康餐盒'];

// 函數：從陣列中隨機選取一個項目
const getRandomRestaurant = (restaurants) => {
    if (restaurants.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    return restaurants[randomIndex];
};

const RestaurantDrawPage = () => {
    // Supabase 資料相關狀態
    const [allRestaurants, setAllRestaurants] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 

    // 抽卡流程相關狀態
    const [currentRestaurant, setCurrentRestaurant] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 
    
    // 篩選選單狀態
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); 
    const [selectedType, setSelectedType] = useState(null); 
    
    // 處理選單開關
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };
    
    // 處理篩選標籤點擊 (單選邏輯)
    const handleFilterClick = (type, tag) => {
        if (type === 'location') {
            // 如果點擊當前已選的標籤，則取消選擇 (設置為 null)
            setSelectedLocation(prev => prev === tag ? null : tag);
        } else if (type === 'type') {
            setSelectedType(prev => prev === tag ? null : tag);
        }
    };
    
    // 【資料載入】：組件首次載入時從 Supabase 獲取所有餐廳資料
    useEffect(() => {
        const fetchRestaurants = async () => {
            setLoadingData(true);
            setErrorData(null);
            
            // 從 'restaurants' 表格中選擇所有欄位
            const { data, error } = await supabase
                .from('restaurants') 
                .select('*'); 

            if (error) {
                console.error('Error fetching restaurants:', error);
                setErrorData('無法載入餐廳資料。請檢查網路或資料庫設定。');
            } else {
                setAllRestaurants(data || []); // 成功時設定資料
            }
            setLoadingData(false);
        };
        
        fetchRestaurants();
    }, []); // 僅在組件首次載入時執行

    // 核心功能：抽一張餐廳卡片
    const drawNewRestaurant = () => {
        // 1. 檢查資料是否正在載入中或未載入
        if (loadingData) return;

        // 2. 檢查篩選條件是否滿足
        if (!selectedLocation || !selectedType) {
            setError("請選擇地區與餐廳類型後再抽取！");
            return;
        }

        setError(null);
        setCurrentRestaurant(null);
        setLoading(true);

        // 使用 setTimeout 模擬網路載入和抽卡動畫
        setTimeout(() => {
            let filteredRestaurants = allRestaurants;
            
            // 1. 根據地區篩選 (AND 邏輯)
            filteredRestaurants = filteredRestaurants.filter(rest => 
                rest.location === selectedLocation
            );

            // 2. 根據類型篩選 (AND 邏輯)
            filteredRestaurants = filteredRestaurants.filter(rest => 
                rest.type === selectedType
            );

            // 3. 排除低分餐廳 (假設只抽 4.0 分以上)
            // 這裡假設資料庫中的 rating 欄位是數字類型
            filteredRestaurants = filteredRestaurants.filter(rest => rest.rating >= 4.0);

            // 隨機選取一家餐廳
            const selectedPlace = getRandomRestaurant(filteredRestaurants);

            if (!selectedPlace) {
                setError(`抱歉！在 ${selectedLocation} 找不到符合 "${selectedType}" 且評價良好的餐廳。`);
            }

            setCurrentRestaurant(selectedPlace);
            setLoading(false);
        }, 800); // 模擬載入時間 0.8 秒
    };

    return (
        <div className="page-container-main"> 
            <div className="recipe-draw-page-wrapper">

                {/* 處理資料庫載入與錯誤狀態 */}
                {loadingData && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>正在從資料庫載入餐廳資料...請稍候</p>
                    </div>
                )}
                
                {errorData && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                        <p>⚠️ 資料載入失敗: {errorData}</p>
                    </div>
                )}

                {/* 只有在資料載入完成且沒有錯誤時才顯示主要內容 */}
                {(!loadingData && !errorData) && (
                <div className="recipe-draw-page-content content-relative"> 
                    
                    <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                        <h2 className="heandline-font">輕食餐廳抽卡：「今天外食吃什麼？」</h2>
                        <p>選擇地區與類型，讓系統為您隨機推薦一間健康輕食餐廳！</p>

                        {/* 篩選選單區塊 - 浮動右側 */}
                        <div className="filter-menu-float-container filter-right-side"> 
                            <button 
                                onClick={toggleFilter} 
                                className="filter-toggle-button filter-icon-button" 
                            >
                                {isFilterOpen ? '隱藏篩選條件 ▲' : '顯示篩選條件 ▼'}
                            </button>

                            {isFilterOpen && (
                                <div className="filter-options-panel filter-dropdown-float filter-dropdown-right"> 
                                    {/* 地區篩選 - 單選 */}
                                    <h4 className="filter-group-title">地區 (台灣台中)</h4> 
                                    <div className="filter-tags-group filter-radio-group">
                                        {LOCATION_FILTERS.map(tag => (
                                            <button
                                                key={tag}
                                                className={`filter-tag-button ${selectedLocation === tag ? 'active-meal-radio' : ''}`}
                                                onClick={() => handleFilterClick('location', tag)}
                                                disabled={loading}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 類型篩選 - 單選 */}
                                    <h4 className="filter-group-title">餐點類型</h4>
                                    <div className="filter-tags-group filter-radio-group">
                                        {TYPE_FILTERS.map(tag => (
                                            <button
                                                key={tag}
                                                className={`filter-tag-button ${selectedType === tag ? 'active-meal-radio' : ''}`}
                                                onClick={() => handleFilterClick('type', tag)}
                                                disabled={loading}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 抽卡與結果區塊 - 置中容器 */}
                    <div className="draw-area">
                        {/* 抽卡按鈕 */}
                        <button 
                            onClick={drawNewRestaurant} 
                            disabled={loading || !selectedLocation || !selectedType || allRestaurants.length === 0}
                            className="draw-button" 
                        >
                            {loading ? '正在搜尋推薦中...' : (allRestaurants.length === 0 ? '無可用餐廳' : '抽出餐廳！')}
                        </button>
                        
                        {/* 優先顯示錯誤訊息 */}
                        {error && <p className="highlight-text" style={{ color: 'red' }}>{error}</p>}
                        
                        {currentRestaurant ? (
                            // 顯示結果卡片
                            <div className="drawn-card-link" style={{ cursor: 'default' }}>
                                <div className={`drawn-card ${loading ? 'shaking' : ''}`} style={{maxWidth: '400px'}}>

                                    <h3>🍴 {currentRestaurant.name}</h3>
                                    <p className="highlight-text" style={{color: 'green', fontSize: '1.1em'}}>
                                        {currentRestaurant.rating} ⭐ 
                                    </p>
                                    
                                    <p style={{fontSize: '0.9em', color: '#666'}}>
                                        地址： {currentRestaurant.address}
                                    </p>
                                    
                                    {/* 地圖連結 (使用修正後的 map_url 欄位) */}
                                    {currentRestaurant.map_url && ( 
                                        <a 
                                            href={currentRestaurant.map_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="toggle-form-link" 
                                            style={{ marginTop: '0.8rem', display: 'inline-block', fontWeight: 'bold' }}
                                        >
                                            在 Google 地圖上導航 »
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // 首次載入或沒有結果時的提示
                            (!error && !loading) && <p>點擊「抽出餐廳！」按鈕，開始尋找您的健康餐。</p>
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

export default RestaurantDrawPage;