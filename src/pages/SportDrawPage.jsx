// src/pages/SportDrawPage.jsx

import React, { useState, useEffect } from 'react'; 
import '../index.css';
import useImageLoader from '../hooks/useImageLoader'; 
import { supabase } from '../supabaseClient'; 

const INTENSITY_FILTERS = ['低', '中', '高']; 

// 函數：從陣列中隨機選取一個項目
const getRandomSport = (sports) => {
    if (sports.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * sports.length);
    return sports[randomIndex];
};

// 輔助函數：將資料庫 Tags (可能為字串或陣列) 安全轉換為陣列 (小寫)
const getSafeTags = (tags) => {
    if (Array.isArray(tags)) return tags.map(t => t.trim().toLowerCase());
    if (typeof tags === 'string' && tags.trim()) {
        return tags.replace(/[{}]/g, '').split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    }
    return [];
};
const SportDrawPage = () => {
    // Supabase 資料相關狀態
    const [allSports, setAllSports] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 
    
    // 抽卡流程相關狀態
    const [drawnSport, setDrawnSport] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    // 強度篩選狀態
    const [selectedIntensities, setSelectedIntensities] = useState([]);
    // Hook 
    const sportImagePath = drawnSport ? drawnSport.image_url || drawnSport.image : null;
    const { 
        imageUrl: signedSportUrl, 
        loading: loadingImageUrl 
    } = useImageLoader(sportImagePath); 

    // 處理選單開關
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };
    // 🎯 處理篩選標籤點擊 (多選邏輯 for Intensity)
    const handleFilterClick = (type, tag) => {
        if (type === 'intensity') {
            // 強度篩選：多選邏輯 (因為用戶可能想選 "中" 或 "高")
            setSelectedIntensities(prevIntensities => {
                if (prevIntensities.includes(tag)) {
                    return prevIntensities.filter(t => t !== tag);
                }
                return [...prevIntensities, tag];
            });
        }
        // 這裡可以根據需要新增其他篩選邏輯，例如 duration
    };

    useEffect(() => {
        const fetchSports = async () => {
            setLoadingData(true);
            setErrorData(null);
            
            const { data, error } = await supabase
                .from('sports') 
                .select('*'); 

            if (error) {
                console.error('Error fetching sports:', error);
                setErrorData('無法載入運動資料。請檢查網路或資料庫設定。');
            } else {
                setAllSports(data || []); 
            }
            setLoadingData(false);
        };
        
        fetchSports();
    }, []);

    // 抽一張運動卡片
    const drawRandomSport = () => {
        if (loadingData || isDrawing || allSports.length === 0) return;

        setErrorData(null); 
        setIsDrawing(true);
        setDrawnSport(null); 

        setTimeout(() => {
            let filteredSports = allSports;
            
            // 🎯 實作強度篩選邏輯
            if (selectedIntensities.length > 0) {
                const lowerSelectedIntensities = selectedIntensities.map(t => t.toLowerCase());

                filteredSports = filteredSports.filter(sport => {
                    // 檢查運動的 intensity 欄位 (現在是 text[] 類型) 是否包含任一選中的強度
                    const safeIntensities = getSafeTags(sport.intensity); // 重複使用 getSafeTags
                    return lowerSelectedIntensities.some(intensity => safeIntensities.includes(intensity));
                });
            }

            // 隨機選取一個運動
            const randomIndex = Math.floor(Math.random() * filteredSports.length);
            const newSport = filteredSports[randomIndex];

            if (!newSport) {
                 setErrorData(`抱歉，沒有找到符合選中強度的運動。`);
            }
            setDrawnSport(newSport);
            setIsDrawing(false);
        }, 1000); // 延遲 1 秒
    };

    return (
        <div className="page-container-main"> 
            
            {/* 處理資料庫載入與錯誤狀態 (優先顯示) */}
            {loadingData && (
                <div style={{ textAlign: 'center', padding: '20px' }}><p>正在從資料庫載入運動...請稍候</p></div>
            )}
            
            {errorData && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                    <p>⚠️ 資料載入失敗: {errorData}</p>
                </div>
            )}
            
            {/* 只有在資料載入完成且沒有錯誤時才顯示主要內容 */}
            {(!loadingData && !errorData) && (
                <div className="recipe-draw-page-content content-relative">
                    <h2>每日小運動：「動起來！」</h2>
                    <p>點擊按鈕，系統為您隨機推薦一個輕鬆的居家運動！</p>

                    {/* 🎯 新增篩選按鈕組件 */}
                    <div className="filter-controls-area embedded-controls">
                        <div className="filter-button-and-dropdown-container">
                             {/* 這裡我們將強度篩選直接放在按鈕下方，不需要 toggle */}
                             <h4 className="filter-group-title" style={{marginTop: '0'}}>運動強度 (多選)</h4> 
                             <div className="filter-tags-group">
                                 {INTENSITY_FILTERS.map(tag => (
                                     <button 
                                         key={tag}
                                         className={`filter-tag-button ${selectedIntensities.includes(tag) ? 'active-selection' : ''}`} 
                                         onClick={() => handleFilterClick('intensity', tag)} 
                                     >
                                         {tag}
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>
                    <div className="draw-area">
                        <button 
                            className="draw-button" 
                            onClick={drawRandomSport}
                            disabled={isDrawing || allSports.length === 0} 
                        >
                            {isDrawing ? '正在思考...' : (allSports.length === 0 ? '無可用運動' : '開始運動吧！')}
                        </button>

                        {/* 顯示抽出的運動卡片 */}
                        {drawnSport && (
                            <div className={`drawn-card ${isDrawing ? 'shaking' : ''}`}>
                                
                                {/* 🎯 核心修正 2：圖片渲染邏輯 - 使用 Hook 取得的 URL */}
                                {(loadingImageUrl || !signedSportUrl) ? (
                                    // 圖片載入或簽名 URL 尚未準備好時顯示佔位符
                                    <div className="recipe-card-img-placeholder" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0c3' }}>
                                        {loadingImageUrl ? '圖片載入中...' : '圖片準備中...'}
                                    </div>
                                ) : (
                                    // 圖片載入完成後使用簽名 URL
                                    <img 
                                        src={signedSportUrl} // 使用 Hook 取得的 Signed URL
                                        alt={drawnSport.name} 
                                        className="recipe-card-img" 
                                    />
                                )}
                                {/* 示意圖文字 */}
                                <p style={{
                                    fontSize: '0.75rem', 
                                    color: '#a43d3dff', 
                                    margin: '0 0 0 0',
                                    textAlign: 'center'
                                }}>
                                    (圖片為示意圖)
                                </p>
                                {/* 運動名稱 (標題) */}
                                <h3>{drawnSport.name}</h3>
                                
                                {/* 運動資訊 */}
                                <p>
                                    預計時間: {drawnSport.duration} | 強度: {drawnSport.intensity}
                                </p>
                                
                                {/* 簡介 */}
                                <p>{drawnSport.description}</p>
                                
                                {/* 教學文字 ( Supabase 欄位是 instruction) */}
                                <p className="highlight-text" style={{textAlign: 'left', marginTop: '1rem'}}>
                                    教學：
                                </p>
                                <p style={{textAlign: 'left'}}>
                                    {drawnSport.instruction}
                                </p>

                                {/* 觀看影片連結 (Supabase 欄位是 video_url) */}
                                {drawnSport.video_url && (
                                    <a 
                                        href={drawnSport.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="toggle-form-link"
                                    >
                                        觀看教學影片 »
                                    </a>
                                )}
                            </div>
                        )}
                        
                        {/* 首次載入且無抽卡結果時的提示 */}
                        {(!drawnSport && !isDrawing) && <p>點擊「開始運動吧！」來獲取今天的健身建議。</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportDrawPage;