import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import '../index.css';
import { supabase } from '../supabaseClient'; 

const RecipeListPage = () => {
    const navigate = useNavigate();

    // Supabase 資料載入狀態
    const [allRecipes, setAllRecipes] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 
    
    // 篩選狀態
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [searchParams] = useSearchParams();
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');

    // =========================================================
    // 核心變動 1：useEffect 處理資料庫載入
    // =========================================================
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoadingData(true);
            setErrorData(null);
            
            // 從 'recipes' 表格中選擇所有欄位，並依照 id 遞減排序
            // 🎯 這裡仍然選取所有欄位，以便篩選 tags，但我們在渲染時忽略 duration_min/calories
            const { data, error } = await supabase
                .from('recipes') 
                .select('*') 
                .order('id', { ascending: false }); 

            if (error) {
                console.error('Supabase ERROR:', error);
                setErrorData('無法載入食譜清單。請檢查網路或資料庫設定。');
            } else {
                console.log('Fetched Recipes Data:', data);
                setAllRecipes(data || []); 
                setFilteredRecipes(data || []);
            }
            setLoadingData(false);
        };
        
        fetchRecipes();
    }, []); 

    // =========================================================
    // 核心變動 2：useEffect 處理 URL 搜尋
    // =========================================================
    useEffect(() => {
        if (loadingData || errorData) return;
        
        const urlSearchTerm = searchParams.get('search');
        
        if (urlSearchTerm) {
            const decodedTerm = decodeURIComponent(urlSearchTerm).trim().toLowerCase();
            setCurrentSearchTerm(decodedTerm);
            
            // 執行篩選邏輯：檢查標題或標籤 (tags 篩選邏輯保持不變)
            const results = allRecipes.filter(recipe => { 
                const matchTitle = recipe.title.toLowerCase().includes(decodedTerm);
                
                // 檢查 tags 欄位
                const matchTags = Array.isArray(recipe.tags) && recipe.tags.some(tag => 
                    tag.toLowerCase().includes(decodedTerm)
                );
                
                return matchTitle || matchTags;
            });
            
            setFilteredRecipes(results);
            
        } else {
            setCurrentSearchTerm('');
            setFilteredRecipes(allRecipes); 
        }
    }, [searchParams, allRecipes, loadingData, errorData]); 

    // =========================================================
    // JSX 渲染邏輯
    // =========================================================
    return (
        <div className="page-container-main">
            <h2 className="heandline-font">食譜清單</h2>
            
            {/* 處理資料庫載入與錯誤狀態 */}
            {loadingData && (
                <div style={{ textAlign: 'center', padding: '20px' }}><p>正在從資料庫載入食譜清單...請稍候</p></div>
            )}
            
            {errorData && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                    <p>⚠️ 資料載入失敗: {errorData}</p>
                </div>
            )}

            {/* 只有在資料載入完成且沒有錯誤時才顯示主要內容 */}
            {(!loadingData && !errorData) && (
                <>
                    {/* 搜尋結果提示 */}
                    {currentSearchTerm ? (
                        <p className="highlight-text" style={{ marginBottom: '1.5rem', fontSize: '1.1em' }}>
                            正在顯示 **「{currentSearchTerm}」** 的搜尋結果 ({filteredRecipes.length} 筆)
                        </p>
                    ) : (
                        <p>探索我們完整的食譜庫，找到你的下一道美味！</p>
                    )}

                    {/* 食譜網格容器 */}
                    <div className="recipe-grid-container">
                        {filteredRecipes.length > 0 ? (
                            filteredRecipes.map((recipe) => (
                                // 使用 Link 導向到食譜詳情頁
                                <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="recipe-card-link">
                                    <div className="recipe-card"> 
                                        <img 
                                            src={recipe.image_url || '/placeholder-recipe.jpg'} 
                                            alt={recipe.title} 
                                            className="recipe-card-img" 
                                        />
                                        <h3>{recipe.title}</h3>
                                        
                                        {/* 🎯 Tags 顯示區塊 (僅保留主要 Tags) */}
                                        <div className="recipe-card-tags">
                                            {/* 建立一個安全的 Tags 陣列 */}
                                            {(() => {
                                                let safeTags = [];
                                                if (Array.isArray(recipe.tags)) {
                                                    safeTags = recipe.tags; // 已經是陣列，直接使用
                                                } else if (typeof recipe.tags === 'string' && recipe.tags.trim()) {
                                                    // 如果是字串，移除大括號並按逗號分割，創建新的陣列
                                                    safeTags = recipe.tags
                                                        .replace(/[{}]/g, '') // 移除所有 { 和 }
                                                        .split(',')
                                                        .map(t => t.trim())
                                                        .filter(t => t); // 移除空字串
                                                }

                                                // 顯示主要 Tags (最多顯示 2 個)
                                                return safeTags.slice(0, 2).map((tag, index) => (
                                                    <span key={index} className="card-tag-pill">{tag}</span>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                                抱歉，沒有找到符合 **「{currentSearchTerm}」** 的食譜。
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default RecipeListPage;