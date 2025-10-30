// src/pages/SportDrawPage.jsx

import React, { useState, useEffect } from 'react'; 
import '../index.css';
import { supabase } from '../supabaseClient'; 

const INTENSITY_FILTERS = ['低', '中', '高']; 

// 函數：從陣列中隨機選取一個項目
const getRandomItem = (items) => {
    if (items.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
};

// 輔助函數：將資料庫 Tags (可能為字串或陣列) 安全轉換為陣列 (小寫)
const getSafeTags = (tags) => {
    if (Array.isArray(tags)) {
        return tags.map(t => t.trim().toLowerCase()); 
    }
    if (typeof tags === 'string' && tags.trim()) {
        return tags
            .replace(/[{}]/g, '') 
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(t => t); 
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
    const [selectedIntensity, setSelectedIntensity] = useState(null); // 假設強度是單選
    const [filteredSports, setFilteredSports] = useState([]); // 儲存篩選結果

    // 處理篩選標籤點擊 (單選)
    const handleFilterClick = (tag) => {
        setSelectedIntensity(prev => prev === tag ? null : tag);
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
                //初始化 filteredSports
                setFilteredSports(data || []); 
            }
            setLoadingData(false);
        };
        
        fetchSports();
    }, []);

    // 監聽篩選條件，更新 filteredSports 列表
    useEffect(() => {
        if (loadingData) return;

        let sports = allSports;

        if (selectedIntensity) {
            const lowerSelectedIntensity = selectedIntensity.toLowerCase();
            sports = sports.filter(sport => {
                const dataIntensities = getSafeTags(sport.intensity);
                return dataIntensities.includes(lowerSelectedIntensity); 
            });
        }
        
        setFilteredSports(sports);

    }, [selectedIntensity, allSports, loadingData]);

    // 抽一張運動卡片
    const drawRandomSport = () => {
        // 修改禁用條件
        if (loadingData || isDrawing || filteredSports.length === 0) return;

        setErrorData(null);
        setIsDrawing(true);
        setDrawnSport(null);

        setTimeout(() => {
            // 從已篩選的 filteredSports 列表中抽取
            const newSport = getRandomItem(filteredSports);

            if (!newSport) {
                 // 如果沒抽到 (通常是 filteredSports.length === 0)
                setErrorData(`抱歉！在 ${selectedIntensity || '所有'} 強度中找不到運動。`);
            }

            setDrawnSport(newSport);
            setIsDrawing(false);
        }, 1000);
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
                    
                    <div style={{ width: '100%', textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h2>每日小運動</h2>
                        <p> 讓系統為您隨機推薦一個居家運動！</p>
                    </div>
                    {/* 篩選器直接放在這裡 */}
                    <div style={{ marginBottom: '1rem', width: '100%', maxWidth: '250px', margin: '0 auto 1rem auto' }}>
                        <h4 className="filter-group-title" style={{ textAlign: 'center', marginBottom: '10px' }}>選擇運動強度</h4>
                        {/* 篩選按鈕會並列為一列 */}
                        <div className="filter-tags-group filter-radio-group">
                            {INTENSITY_FILTERS.map(tag => (
                                <button
                                    key={tag}
                                    className={`filter-tag-button ${selectedIntensity === tag ? 'active-meal-radio' : ''}`}
                                    onClick={() => handleFilterClick(tag)}
                                    disabled={isDrawing}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                         {/* 提示符合條件的數量 */}
                         <p style={{
                             fontSize: '0.9em',
                             color: '#0e4b2d',
                             fontWeight: 'bold',
                             textAlign: 'center',
                             marginTop: '5px'
                         }}>
                             {loadingData ? '載入中...' : `目前有 ${filteredSports.length} 項運動符合條件`}
                         </p>
                    </div>
                    <div className="draw-area">
                        <button 
                            className="draw-button" 
                            onClick={drawRandomSport}
                            disabled={isDrawing || filteredSports.length === 0} 
                        >
                            {isDrawing ? '正在思考...' : (
                                allSports.length === 0 ? '無可用運動' :
                                (filteredSports.length === 0 ? '無符合條件運動' : '開始運動吧！')
                            )}
                        </button>

                        {/* 顯示抽出的運動卡片 */}
                        {drawnSport && (
                            <div className={`drawn-card ${isDrawing ? 'shaking' : ''}`}>
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
                                    簡易教學：
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
                                        詳細影片教學 »
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