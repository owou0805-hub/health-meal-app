import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css'; 
// 匯入 Supabase 客戶端
import { supabase } from '../supabaseClient'; 

// 🎯 請將這裡替換成您中央圖片 Bucket 的名稱
const ALL_IMAGES_BUCKET_NAME = 'all_images'; 
// 圖片連結時效設定為 30 分鐘
const SIGNED_URL_EXPIRY_SECONDS = 1800; 

const RecipeDetailPage = () => {
    // 1. 從 URL 獲取食譜 ID
    const { id } = useParams(); 
    const navigate = useNavigate(); 

    // 狀態
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // 儲存最終的圖片 URL（可能是 Signed URL 或 Placeholder）
    const [imageUrl, setImageUrl] = useState(null); 

    // 2. 核心：根據 ID 從 Supabase 獲取資料
    useEffect(() => {
        const recipeId = parseInt(id, 10);
        if (isNaN(recipeId)) {
            setError('錯誤：無效的食譜 ID。');
            setLoading(false);
            return;
        }

        const fetchRecipe = async () => {
            setLoading(true);
            setError(null);
            setImageUrl(null); // 重設圖片 URL

            // 查詢 Supabase：從 'recipes' 表格中選擇所有資料
            const { data, error: fetchError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', recipeId)
                .single(); 

            if (fetchError) {
                console.error('Error fetching recipe detail:', fetchError);
                setError('無法載入食譜詳情，請檢查網路或食譜是否存在。');
                setRecipe(null);
                setLoading(false);
                return;
            } 
            
            if (data) {
                // 處理 Private 圖片的 Signed URL
                let finalImageUrl = '/placeholder-recipe.jpg'; // 設置預設圖片路徑

                if (data.image_url) {
                    try {
                        // 嘗試從 Supabase 獲取 Signed URL
                        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                            .from(ALL_IMAGES_BUCKET_NAME) 
                            // data.image_url 必須是相對路徑，例如 'recipes/fruit_yogurt.jpg'
                            .createSignedUrl(data.image_url, SIGNED_URL_EXPIRY_SECONDS); 
                        
                        if (signedUrlError) {
                            // 捕捉到 Signed URL 失敗 (例如 400 Bad Request / Object not found)
                            console.error('Signed URL Failed (Path/Storage RLS Error):', signedUrlError);
                            // 保持 finalImageUrl 為預設值
                        } else {
                            // 成功取得臨時網址
                            finalImageUrl = signedUrlData.signedUrl; 
                        }
                    } catch (e) {
                        console.error('Signed URL Catch Error:', e);
                        // 保持 finalImageUrl 為預設值
                    }
                } 

                // 設定最終狀態
                setRecipe(data);
                setImageUrl(finalImageUrl);
            } else {
                setError('抱歉，找不到該食譜。');
            }
            setLoading(false);
        };

        fetchRecipe();
    }, [id]); // 依賴於 URL 中的 ID 變化

    // 3. 渲染邏輯
    
    if (loading) {
        return (
            <div className="page-container-main" style={{ textAlign: 'center' }}>
                <p className="highlight-text">正在載入食譜詳情...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container-main" style={{ textAlign: 'center' }}>
                <h2 style={{color: 'red'}}>載入錯誤</h2>
                <p>{error}</p>
                <button 
                    onClick={() => navigate('/list')} 
                    className="draw-button" 
                    style={{marginTop: '20px'}}
                >
                    返回食譜清單
                </button>
            </div>
        );
    }
    
    if (!recipe) return null; 

    return (
        <div className="page-container-main recipe-detail-wrapper">
            
            {/* 返回按鈕 */}
            <button 
                onClick={() => navigate(-1)} 
                className="circular-back-button"
            >
                &larr;
            </button>
            
            <h1 className="heandline-font">{recipe.title}</h1>
            
            {/* 標籤/時間/熱量資訊 */}
            <div className="recipe-meta-tags">
                {Array.isArray(recipe.tags) && recipe.tags.map((tag, index) => (
                    <span key={index} className="tag-pill">{tag}</span>
                ))}
                {recipe.duration_min && (
                    <span className="tag-pill meta-info">🕑 {recipe.duration_min} 分鐘</span>
                )}
                {recipe.calories && (
                    <span className="tag-pill meta-info">🔥 {recipe.calories} kcal</span>
                )}
            </div>

            <div className="recipe-content-grid">
                
                {/* 左側：圖片與簡介 */}
                <div className="recipe-image-section">
                    <img 
                        // 【關鍵】：使用 imageUrl 狀態，它現在包含了 Signed URL 或 Placeholder
                        src={imageUrl} 
                        alt={recipe.title} 
                        className="recipe-main-image"
                    />
                    <p className="recipe-description-text">{recipe.description}</p>
                </div>

                {/* 右側：食材與步驟 */}
                <div className="recipe-details-section">
                    
                    {/* 食材清單 */}
                    <div className="detail-card">
                        <h3 className="sub-heandline">所需食材</h3>
                        {/* 🎯 最終修正：確保渲染的是一個有效陣列，即使是空陣列也能安全處理 */}
                        {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                            <ul className="ingredient-list">
                                {recipe.ingredients.map((item, index) => (
                                    // 由於資料庫傳輸的元素可能含有隱藏空格，我們用 trim() 清理
                                    <li key={index}>{item ? item.trim() : ''}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>沒有列出詳細食材。</p>
                        )}
                    </div>

                    {/* 烹飪步驟 */}
                    <div className="detail-card">
                        <h3 className="sub-heandline">烹飪步驟</h3>
                        {/* 🎯 修正: 使用正則表達式分割，以識別 1. 2. 等數字開頭的步驟 */}
                        {typeof recipe.instructions === 'string' && recipe.instructions.trim() ? (
                            <ol className="instruction-list">
                                {recipe.instructions
                                    // 核心：使用正則表達式，按 "數字." 後面的內容分割
                                    // 讓步驟成為一個項目陣列
                                    .split(/\s*\d+\.\s*/) 
                                    .filter(step => step.trim() !== '') // 過濾空項目
                                    .map((step, index) => (
                                        // 確保項目是整齊的
                                        <li key={index}>{step.trim()}</li>
                                    ))}
                            </ol>
                        ) : (
                            <p>目前沒有詳細步驟說明。</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default RecipeDetailPage;