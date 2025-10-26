// src/pages/RestaurantDrawPage.jsx
import React, { useState, useEffect } from 'react';
import '../index.css'; 
import useImageLoader from '../hooks/useImageLoader'; 
import { supabase } from '../supabaseClient'; 
 
const LOCATION_FILTERS = ['霧峰區', '大里區','太平區', '東區', '南區', '中區', '西區', '北區', '南屯區', '西屯區', '北屯區'];
const TYPE_FILTERS = ['沙拉', '輕食/健康餐盒', '健康早午餐', '點心'];

// 函數：從陣列中隨機選取一個項目
const getRandomRestaurant = (restaurants) => {
    if (restaurants.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * restaurants.length);
    return restaurants[randomIndex];
};

// 輔助函數：將資料庫 Tags (可能為字串或陣列) 安全轉換為陣列 (小寫)
const getSafeTags = (tags) => {
    if (Array.isArray(tags)) {
        return tags.map(t => t.trim().toLowerCase()); // 已經是陣列，直接轉換小寫
    }
    if (typeof tags === 'string' && tags.trim()) {
        // 處理 PostgreSQL 陣列字串格式 {tag1,tag2}
        return tags
            .replace(/[{}]/g, '') // 移除所有 { 和 }
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t); // 移除空字串
    }
    return [];
};


const RestaurantDrawPage = () => {
    // Supabase 資料相關狀態
    const [allRestaurants, setAllRestaurants] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 

    // 抽卡流程相關狀態
    const [currentRestaurant, setCurrentRestaurant] = useState(null);
    const [loading, setLoading] = useState(false); // 抽卡動畫載入狀態
    const [error, setError] = useState(null); // 抽卡篩選錯誤
    
    // 篩選選單狀態
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); 
    const [selectedType, setSelectedType] = useState(null);
    // 符合條件的計數狀態
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    // Hook 
    const currentImageUrlPath = currentRestaurant?.image_url || '';
    const { imageUrl: drawnImageUrl, loading: imageLoading } = useImageLoader(currentImageUrlPath);
    
    // 處理選單開關
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };
    
    // 處理篩選標籤點擊 (單選邏輯)
    const handleFilterClick = (type, tag) => {
        if (type === 'location') {
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
                setAllRestaurants(data || []);
                // 初始化時，filtered 列表等於 all 列表
                setFilteredRestaurants(data || []);
            }
            setLoadingData(false);
        };
        
        fetchRestaurants();
    }, []);
    // 此 useEffect 專門用來更新 'filteredRestaurants' 狀態
    useEffect(() => {
        if (loadingData) return;

        let restaurants = allRestaurants;

        // 1. 地區篩選
        if (selectedLocation) {
            const lowerSelectedLocation = selectedLocation.toLowerCase();
            restaurants = restaurants.filter(rest => {
                const dataLocations = getSafeTags(rest.location);
                return dataLocations.includes(lowerSelectedLocation);
            });
        }
        
        // 2. 類型篩選
        if (selectedType) {
            const lowerSelectedType = selectedType.toLowerCase();
            restaurants = restaurants.filter(rest => {
                const dataTypes = getSafeTags(rest.type);
                return dataTypes.includes(lowerSelectedType);
            });
        }
        
        // 3. 更新儲存篩選結果的 state
        setFilteredRestaurants(restaurants);

    }, [selectedLocation, selectedType, allRestaurants, loadingData]); // 依賴篩選條件和原始資料
    
    // 核心功能：抽一張餐廳卡片
    const drawNewRestaurant = () => {
        // 1. 檢查資料是否正在載入中
        if (loadingData) return;

        setError(null);
        setCurrentRestaurant(null);
        setLoading(true);

        // 使用 setTimeout 模擬網路載入和抽卡動畫
        setTimeout(() => {
            const selectedPlace = getRandomRestaurant(filteredRestaurants);

            if (!selectedPlace) {
                let filterInfo = '所有餐廳中';
                if (selectedLocation) filterInfo += `在 ${selectedLocation}`;
                if (selectedType) {
                    filterInfo += (filterInfo ? ' 且' : '') + ` 類型為 ${selectedType}`;
                }
                setError(`抱歉！${filterInfo || '所有餐廳'} 中找不到任何符合條件的餐廳。`);
            }

            setCurrentRestaurant(selectedPlace);
            setLoading(false);
        }, 500);
    };

    return (
        <div className="page-container-main"> 
    
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
                    <h2 className="heandline-font">輕食餐廳抽卡</h2>
                    <p>選擇地區與類型，讓系統為您隨機推薦一間健康輕食餐廳！</p>

                    {/* 篩選選單區塊 */}
                    <div className="filter-button-and-dropdown-container">
                        <button 
                            onClick={toggleFilter} 
                            className="filter-toggle-button filter-icon-button" 
                        >
                            {isFilterOpen ? '隱藏篩選條件 ▲' : '顯示篩選條件 ▼'}
                        </button>

                        {isFilterOpen && (
                            <div className="filter-options-panel filter-dropdown-float"> 
                                
                                {/* 【新增】：提示文字 */}
                                <p style={{
                                    fontSize: '0.9em', 
                                    color: '#0e4b2d', 
                                    fontWeight: 'bold', 
                                    borderBottom: '1px solid #ccc', 
                                    paddingBottom: '10px',
                                    marginTop: '0'
                                }}>
                                    {loadingData ? '載入中...' : `目前有 ${filteredRestaurants.length} 間餐廳符合條件`}
                                </p>

                                {/* ... (篩選選項 JSX) ... */}
                                <h4 className="filter-group-title">地區 (台中)</h4> 
                                <div className="filter-tags-group filter-radio-group">
                                    {LOCATION_FILTERS.map(tag => (
                                        <button key={tag} className={`filter-tag-button ${selectedLocation === tag ? 'active-meal-radio' : ''}`} onClick={() => handleFilterClick('location', tag)} disabled={loading}>{tag}</button>
                                    ))}
                                </div>
                                {/*餐點類型篩選區塊 */}
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

                                <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                                    請選擇後，點擊「抽出餐廳！」抽取。
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 抽卡與結果區塊 - 置中容器 */}
                <div className="draw-area">
                    {/* 抽卡按鈕 */}
                    <button 
                        onClick={drawNewRestaurant} 
                        disabled={loading || filteredRestaurants.length === 0}
                        className="draw-button" 
                    >
                        {loading ? '正在搜尋推薦中...' : ( //
                            allRestaurants.length === 0 ? '無可用餐廳' :
                            (filteredRestaurants.length === 0 ? '無符合條件餐廳' : '抽出餐廳！')
                        )}
                    </button>
                    {/* 優先顯示錯誤訊息 */}
                    {error && <p className="highlight-text" style={{ color: 'red' }}>{error}</p>}
                    
                    {currentRestaurant ? (
                        // 顯示結果卡片
                        <div className={`drawn-card ${loading ? 'shaking' : ''}`} style={{maxWidth: '400px'}}>

                            <h3>{currentRestaurant.name}</h3>
                            {imageLoading && <p>圖片載入中...</p>}
                            <img 
                                src={drawnImageUrl} 
                                alt={currentRestaurant.name} 
                                className="recipe-card-img" 
                            />
                            <p style={{
                                    fontSize: '0.75rem', 
                                    color: '#a43d3dff', 
                                    margin: '0 0 0 0',
                                    textAlign: 'center'
                                }}>
                                    (圖片為示意圖)
                                </p>
                            <p className="highlight-text" style={{color: 'green', fontSize: '1.1em'}}>
                                {currentRestaurant.rating} ⭐ 
                            </p>
                            
                            <p style={{fontSize: '0.9em', color: '#666'}}>
                                地址：{currentRestaurant.address}
                            </p>
                            
                            {/* 地圖連結 */}
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
                    ) : (
                        // 首次載入或沒有結果時的提示
                        (!error && !loading) && <p>點擊「抽出餐廳！」按鈕，尋找您的美味。</p>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}

export default RestaurantDrawPage;