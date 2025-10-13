import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom'; 
import '../index.css'; 
import useImageLoader from '../hooks/useImageLoader';
import { supabase } from '../supabaseClient'; 

// 函數：從陣列中隨機選取一個項目
const getRandomRecipe = (recipes) => {
    if (recipes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * recipes.length);
    return recipes[randomIndex];
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

// 篩選器的選項
const MEAL_FILTERS = ['早餐', '午餐', '晚餐'];
const ALLERGY_FILTERS = ['花生', '乳製品', '海鮮'];

const RecipeDrawPage = () => {
    const navigate = useNavigate();

    // Supabase 資料相關狀態
    const [allRecipes, setAllRecipes] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 
    
    // 原有的抽卡狀態
    const [currentRecipe, setCurrentRecipe] = useState(null);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null); 
    const [lastDrawnId, setLastDrawnId] = useState(null);
    const [searchParams] = useSearchParams();
    
    // 可用食譜狀態 (經過 URL 篩選後的結果)
    const [availableRecipes, setAvailableRecipes] = useState([]); 

    // 篩選選單狀態
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedMeals, setSelectedMeals] = useState([]); 
    const [selectedAllergies, setSelectedAllergies] = useState([]); 
    
    // 將 Hook 移到元件頂層
    const currentImageUrlPath = currentRecipe?.image_url || '';
    const { imageUrl: drawnImageUrl, loading: imageLoading } = useImageLoader(currentImageUrlPath);
    // 處理選單開關
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };
    
    // 處理篩選標籤點擊
    const handleFilterClick = (type, tag) => {
        if (type === 'meal') {
            // 餐點篩選：單選邏輯 (點擊選中，再點擊取消)
            setSelectedMeals(prevMeals => prevMeals.includes(tag) ? [] : [tag]);
        } else if (type === 'allergy') {
            // 過敏原篩選：多選邏輯
            setSelectedAllergies(prevAllergies => {
                if (prevAllergies.includes(tag)) {
                    return prevAllergies.filter(t => t !== tag);
                }
                return [...prevAllergies, tag];
            });
        }
    };
    
    //useEffect 處理資料庫載入
    useEffect(() => {
        const fetchRecipes = async () => {
            setLoadingData(true);
            setErrorData(null);
            
            // 從 'recipes' 表格中選擇所有欄位
            const { data, error } = await supabase
                .from('recipes') 
                .select('*'); 

            if (error) {
                console.error('Error fetching recipes:', error);
                setErrorData('無法載入食譜資料。請檢查網路或資料庫設定。');
            } else {
                setAllRecipes(data || []); 
                setAvailableRecipes(data || []);
            }
            setLoadingData(false);
        };
        
        fetchRecipes();
    }, []); 

    // useEffect 處理 URL 搜尋
    useEffect(() => {
        if (loadingData) return; 

        const urlSearchTerm = searchParams.get('search');

        if (urlSearchTerm) {
            const decodedSearchTerm = decodeURIComponent(urlSearchTerm).trim().toLowerCase();
            
            const filteredBySearch = allRecipes.filter(recipe => {
                const matchTitle = recipe.title.toLowerCase().includes(decodedSearchTerm);
                
                // 檢查 tags 欄位，使用 getSafeTags 輔助函數
                const safeTags = getSafeTags(recipe.tags);

                const matchTags = safeTags.some(tag => 
                    tag.includes(decodedSearchTerm)
                );
                
                return matchTitle || matchTags;
            });
            
            setAvailableRecipes(filteredBySearch);
            
            setIsFilterOpen(true);
            
            const initialRecipe = getRandomRecipe(filteredBySearch);
            setCurrentRecipe(initialRecipe);

            if (!initialRecipe && filteredBySearch.length === 0) {
                 setError("根據 URL 搜尋關鍵字，沒有找到符合的食譜。");
            }
        } else {
            setAvailableRecipes(allRecipes); 
        }

    }, [searchParams, allRecipes, loadingData]); 

    // 核心功能：抽一張卡片
    const drawNewRecipe = () => {
        if (loadingData) {
            setError("資料庫仍在載入中，請稍候。");
            return;
        }

        setError(null);
        setCurrentRecipe(null); 
        setLoading(true);

        setTimeout(() => {
            let filteredRecipes = availableRecipes; 
            
            // 1. 根據餐點標籤過濾 (AND 邏輯)
            if (selectedMeals.length > 0) {
                filteredRecipes = filteredRecipes.filter(recipe => {
                    const safeTags = getSafeTags(recipe.tags); // 🎯 使用輔助函數

                    // 檢查食譜的 tags 是否包含選中的餐點標籤 (已轉換小寫)
                    return selectedMeals.map(t => t.toLowerCase()).some(mealTag => safeTags.includes(mealTag));
                });
            }
            
            // 2. 根據過敏原標籤過濾 (排除邏輯)
            if (selectedAllergies.length > 0) {
                filteredRecipes = filteredRecipes.filter(recipe => {
                    const safeTags = getSafeTags(recipe.tags); // 🎯 使用輔助函數

                    // 檢查食譜的 tags 是否不包含任何選中的過敏原 (已轉換小寫)
                    return !selectedAllergies.map(t => t.toLowerCase()).some(allergyTag => safeTags.includes(allergyTag));
                });
            }
            
            const recipe = getRandomRecipe(filteredRecipes);
            
            if (!recipe) {
                setError("抱歉！根據您的篩選條件，沒有找到符合的食譜。");
            }

            setCurrentRecipe(recipe);
            setLastDrawnId(recipe ? recipe.id : null); 
            setLoading(false);
        }, 600);
    };

    return (
        <div className="recipe-draw-page-wrapper">
            
            {/* 處理資料庫載入與錯誤狀態 (優先顯示) */}
            {loadingData && (
                <div style={{ textAlign: 'center', padding: '20px' }}><p>正在從資料庫載入食譜...請稍候</p></div>
            )}
            
            {errorData && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                    <p>⚠️ 資料載入失敗: {errorData}</p>
                </div>
            )}

            {/* 只有在資料載入完成且沒有錯誤時才顯示主要內容 */}
            {(!loadingData && !errorData) && (
            <div className="recipe-draw-page-content content-relative"> 
                
                <div style={{ position: 'relative', width: '100%' }}>
                    <h2 className="heandline-font">食譜抽卡：「今天吃什麼？」</h2>
                    <p>點擊按鈕，讓系統為你隨機推薦一道美味輕食！</p>

                    {/* 篩選選單區塊 - 定位在 content 內右上角 */}
                    <div className="filter-menu-float-container filter-right-side">
                        <button 
                            onClick={toggleFilter} 
                            className="filter-toggle-button filter-icon-button" 
                        >
                            ⚙
                        </button>

                        {isFilterOpen && (
                            <div className="filter-options-panel filter-dropdown-float filter-dropdown-right">
                                
                                {/* 餐點篩選 - 單選 */}
                                <h4 className="filter-group-title">餐點類型 (單選)</h4> 
                                <div className="filter-tags-group filter-radio-group">
                                    {MEAL_FILTERS.map(tag => (
                                        <button
                                            key={tag}
                                            className={`filter-tag-button ${selectedMeals.includes(tag) ? 'active-meal-radio' : ''}`}
                                            onClick={() => handleFilterClick('meal', tag)}
                                            disabled={loading}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {/* 過敏原篩選 - 多選 */}
                                <h4 className="filter-group-title">排除過敏原 (多選)</h4>
                                <div className="filter-tags-group">
                                    {ALLERGY_FILTERS.map(tag => (
                                        <button
                                            key={tag}
                                            className={`filter-tag-button ${selectedAllergies.includes(tag) ? 'active-allergy' : ''}`}
                                            onClick={() => handleFilterClick('allergy', tag)}
                                            disabled={loading}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                
                                <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                                    請選擇後，點擊下方「現在吃？」抽取。
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 抽卡與結果區塊 - 置中容器 */}
                <div className="draw-area">
                    {/* 抽卡按鈕 */}
                    <button 
                        onClick={drawNewRecipe} 
                        disabled={loading || availableRecipes.length === 0} 
                        className="draw-button" 
                    >
                        {loading ? '正在推薦...' : (
                            availableRecipes.length === 0 ? '無可用食譜' : '現在吃？'
                        )}
                    </button>
                    
                    {/* 優先顯示錯誤訊息 */}
                    {error && <p className="highlight-text" style={{ color: 'red' }}>{error}</p>}
                    
                    {currentRecipe ? (
                       <Link 
                            to={`/recipe/${currentRecipe.id}`} 
                            className="drawn-card-link"
                            onClick={(e) => { 
                                if (loading) e.preventDefault(); 
                            }}
                        >
                            <div className={`drawn-card ${loading ? 'shaking' : ''}`}>
                                
                                {/* 🎯 修正：使用 Hook 返回的 URL */}
                                {imageLoading && <p>圖片載入中...</p>}
                                <img 
                                    src={drawnImageUrl} 
                                    alt={currentRecipe.title} 
                                    className="recipe-card-img"
                                />
                                <h3>{currentRecipe.title}</h3>
                                
                                {/* Tags 顯示邏輯 (保持不變) */}
                                {(() => {
                                    const safeTags = getSafeTags(currentRecipe.tags);
                                    const tagsForDisplay = safeTags.map(t => 
                                        t.charAt(0).toUpperCase() + t.slice(1)
                                    );
                                    return tagsForDisplay.length > 0 ? (
                                        <div className="recipe-card-tags" style={{ padding: '0 20px', justifyContent: 'center' }}>
                                            {tagsForDisplay.map((tag, index) => (
                                                <span key={index} className="card-tag-pill">{tag}</span>
                                            ))}
                                        </div>
                                    ) : null;
                                })()}

                                <p>{currentRecipe.description}</p>
                                
                                <span className="toggle-form-link" style={{ marginTop: '0.5rem' }}>
                                    查看詳細做法 »
                                </span>
                            </div>
                        </Link>
                    ) : (
                        // 首次載入或沒有食譜時的提示
                        (!error && !loading) && <p>點擊「現在吃？」按鈕，開始抽取食譜。</p>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}

export default RecipeDrawPage;