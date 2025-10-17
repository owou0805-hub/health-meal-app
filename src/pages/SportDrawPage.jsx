// src/pages/SportDrawPage.jsx
import React, { useState, useEffect } from 'react'; 
import '../index.css';
import useImageLoader from '../hooks/useImageLoader'; 
import { supabase } from '../supabaseClient'; 

const SportDrawPage = () => {
    // Supabase 資料相關狀態
    const [allSports, setAllSports] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 
    
    // 抽卡流程相關狀態
    const [drawnSport, setDrawnSport] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);

    
    // 🎯 核心修正 1：呼叫 useImageLoader Hook
    // 1. 取得儲存在資料庫中的完整圖片路徑 (例如: "sport/s_1.jpg")
    const sportImagePath = drawnSport ? drawnSport.image_url || drawnSport.image : null;
    
    // 2. 呼叫 Hook 取得有權限的圖片 URL。
    // 假設您的 Bucket 名稱是 'all_images'
    const { 
        imageUrl: signedSportUrl, 
        loading: loadingImageUrl 
    } = useImageLoader(
        'all_images', // 🎯 傳遞您的 Supabase Storage Bucket 名稱
        sportImagePath // 🎯 傳遞完整的路徑 (例如: "sport/s_1.jpg")
    );


    useEffect(() => {
        const fetchSports = async () => {
            setLoadingData(true);
            setErrorData(null);
            
            // 從 'sports' 表格中選擇所有欄位
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

    
    const drawRandomSport = () => {
        if (loadingData || isDrawing || allSports.length === 0) return;

        setErrorData(null); 
        setIsDrawing(true);
        setDrawnSport(null); 

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * allSports.length);
            const newSport = allSports[randomIndex];

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
                    <h2>每日小運動：「動起來！」</h2>
                    <p>點擊按鈕，系統為您隨機推薦一個輕鬆的居家運動！</p>

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
                                    <div className="recipe-card-img-placeholder" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                                        {loadingImageUrl ? '圖片載入中...' : '圖片準備中...'}
                                    </div>
                                ) : (
                                    // 圖片載入完成後使用簽名 URL
                                    <img 
                                        src={signedSportUrl} // 🎯 修正：使用 Hook 取得的 Signed URL
                                        alt={drawnSport.name} 
                                        className="recipe-card-img" 
                                    />
                                )}
                                
                                {/* 運動名稱 (標題) */}
                                <h3>{drawnSport.name}</h3>
                                
                                {/* 運動資訊 */}
                                <p>
                                    預計時間: {drawnSport.duration} | 強度: {drawnSport.intensity}
                                </p>
                                
                                {/* 簡介 */}
                                <p>{drawnSport.description}</p>
                                
                                {/* 教學文字 (假設 Supabase 欄位是 instruction) */}
                                <p className="highlight-text" style={{textAlign: 'left', marginTop: '1rem'}}>
                                    教學：
                                </p>
                                <p style={{textAlign: 'left'}}>
                                    {drawnSport.instruction}
                                </p>

                                {/* 觀看影片連結 (假設 Supabase 欄位是 video_url) */}
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