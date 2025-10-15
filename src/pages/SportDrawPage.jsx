// src/pages/SportDrawPage.jsx
import React, { useState, useEffect } from 'react'; // 【新增】 useEffect
import '../index.css';
import { supabase } from '../supabaseClient'; 

const SportDrawPage = () => {
    // 【新增】：Supabase 資料相關狀態
    const [allSports, setAllSports] = useState([]); // 儲存從 Supabase 讀取的全部運動
    const [loadingData, setLoadingData] = useState(true); // 資料庫載入狀態
    const [errorData, setErrorData] = useState(null); // 資料庫錯誤訊息
    
    // 抽卡流程相關狀態
    const [drawnSport, setDrawnSport] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);


    // 【核心變動 1】：useEffect 處理資料庫載入

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
                setAllSports(data || []); // 成功時設定資料
            }
            setLoadingData(false);
        };
        
        fetchSports();
    }, []);

    
    // 【核心變動 2】：抽卡邏輯使用 allSports

    const drawRandomSport = () => {
        // 1. 檢查資料是否已載入
        if (loadingData) {
            setErrorData("資料仍在載入中，請稍候。"); // 使用 errorData 來顯示載入中的錯誤/提示
            return;
        }

        // 2. 檢查是否有運動資料
        if (allSports.length === 0) {
            setErrorData("資料庫中沒有可用的運動項目。");
            return;
        }

        if (isDrawing) return;

        // 清除任何舊的錯誤提示
        setErrorData(null); 
        setIsDrawing(true);
        setDrawnSport(null); 

        // 模擬抽卡延遲
        setTimeout(() => {
            // 隨機選取一個運動，使用 allSports
            const randomIndex = Math.floor(Math.random() * allSports.length);
            const newSport = allSports[randomIndex];

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
                    <p>⚠️資料載入失敗: {errorData}</p>
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
                            // 如果正在抽卡或沒有資料，則禁用按鈕
                            disabled={isDrawing || allSports.length === 0} 
                        >
                            {isDrawing ? '正在思考...' : (allSports.length === 0 ? '無可用運動' : '開始運動吧！')}
                        </button>

                        {/* 顯示抽出的運動卡片 */}
                        {drawnSport && (
                            <div className={`drawn-card ${isDrawing ? 'shaking' : ''}`}>
                                
                                {/* 運動圖片 (假設 Supabase 欄位是 image_url) */}
                                <img 
                                    src={drawnSport.image_url || drawnSport.image || '/placeholder-sport.jpg'} // 嘗試使用 image_url
                                    alt={drawnSport.name} 
                                    className="recipe-card-img" 
                                />
                                
                                {/* 運動名稱 (標題) */}
                                <h3>{drawnSport.name}</h3>
                                
                                {/* 運動資訊 */}
                                <p>
                                    {/* 假設 Supabase 欄位是 duration 和 intensity */}
                                    預計時間: {drawnSport.duration} 分鐘 | 強度: {drawnSport.intensity}
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