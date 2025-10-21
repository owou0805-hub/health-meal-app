// src/pages/RecipeDrawPage.jsx
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
const MEAL_FILTERS = ['早餐', '早午餐', '午餐', '點心', '晚餐'];
const HEALTH_GOAL_FILTERS = [
    '減脂', '增肌', '高蛋白', '低碳水', '高纖維', 
    '控糖飲食', '降膽固醇', '低鈉飲食', '美肌養顏', 
    '促進腸胃健康', '提升專注力', '增進睡眠品質'
];
const DIET_HABIT_FILTERS = [
    '一般飲食', '全素', '蛋奶素', '魚素', 
    '地中海飲食', '原型食物飲食', '生酮飲食'
];
const ALLERGY_FILTERS = [
    '花生', '堅果', '乳製品', '雞蛋', '大豆', 
    '小麥', '魚類', '甲殼類', '軟體動物', 
    '芒果', '奇異果', '麩質', '雞肉', '牛肉', '豬肉'];

const RecipeDrawPage = ({ 
    defaultAllergens = [], 
    defaultGoals = [],
    defaultDiet = null // 接收字串 '一般飲食' 或 null
}) => {
    const navigate = useNavigate();

    // Supabase 資料相關狀態
    const [allRecipes, setAllRecipes] = useState([]); 
    const [loadingData, setLoadingData] = useState(true); 
    const [errorData, setErrorData] = useState(null); 
    
    // 抽卡狀態
    const [currentRecipe, setCurrentRecipe] = useState(null);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null); 
    const [lastDrawnId, setLastDrawnId] = useState(null);
    const [searchParams] = useSearchParams();
    
    // 'availableRecipes' 儲存 URL 搜尋結果
    const [availableRecipes, setAvailableRecipes] = useState([]); 
    // 'filteredRecipes' 儲存最終篩選結果
    const [filteredRecipes, setFilteredRecipes] = useState([]);

    // 篩選選單狀態
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedMeals, setSelectedMeals] = useState([]);
    const [selectedGoals, setSelectedGoals] = useState(defaultGoals);
    const [selectedDiets, setSelectedDiets] = useState(defaultDiet ? [defaultDiet] : []);
    const [selectedAllergies, setSelectedAllergies] = useState(defaultAllergens); 
    
    // Hook
    const currentImageUrlPath = currentRecipe?.image_url || '';
    const { imageUrl: drawnImageUrl, loading: imageLoading } = useImageLoader(currentImageUrlPath);
    
    // 處理選單開關
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
    };
    
    // 處理篩選標籤點擊
    const handleFilterClick = (type, tag) => {
        
        const updateMultiSelect = (prevTags) => {
            if (prevTags.includes(tag)) {
                return prevTags.filter(t => t !== tag); 
            }
            return [...prevTags, tag]; 
        }

        if (type === 'meal') {
            // 餐點篩選：單選邏輯
            setSelectedMeals(prevMeals => prevMeals.includes(tag) ? [] : [tag]);
        } else if (type === 'allergy') {
            // 過敏原篩選：多選邏輯
            setSelectedAllergies(updateMultiSelect);
        } else if (type === 'goal') {
            // 健康目標篩選：多選邏輯
            setSelectedGoals(updateMultiSelect);
        } else if (type === 'diet') {
            // 飲食習慣篩選 : 單選邏輯
            setSelectedDiets(prevDiets => {
                if (prevDiets.includes(tag)) {
                    return []; 
                }
                return [tag]; // 只保留當前選中的標籤
            });
        }
    };
    
    useEffect(() => {
        // 只有當 prop 有值且改變時才更新，防止 Profile 頁面尚未載入時使用空陣列
        if (defaultAllergens && defaultAllergens.length > 0) {
            setSelectedAllergies(defaultAllergens);
        }
        if (defaultGoals && defaultGoals.length > 0) {
            setSelectedGoals(defaultGoals);
        }
        // 當 defaultDiet (字串) 存在時，更新 selectedDiets (陣列)
        if (defaultDiet) {
            setSelectedDiets([defaultDiet]);
        }
    }, [defaultAllergens, defaultGoals, defaultDiet]); // 依賴更新
    
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
                setFilteredRecipes(data || []);
            }
            setLoadingData(false);
        };
        
        fetchRecipes();
    }, []); 

    // useEffect 處理 URL 搜尋
    useEffect(() => {
        if (loadingData) return; 
        const urlSearchTerm = searchParams.get('search');
        
        let baseRecipes = allRecipes;

        if (urlSearchTerm) {
            const decodedSearchTerm = decodeURIComponent(urlSearchTerm).trim().toLowerCase();
            
            baseRecipes = allRecipes.filter(recipe => {
                const matchTitle = recipe.title.toLowerCase().includes(decodedSearchTerm);
                const safeTags = getSafeTags(recipe.tags);
                const matchTags = safeTags.some(tag => 
                    tag.includes(decodedSearchTerm)
                );
                return matchTitle || matchTags;
            });
            
            setIsFilterOpen(true);
            
            const initialRecipe = getRandomRecipe(baseRecipes);
            setCurrentRecipe(initialRecipe);

            if (!initialRecipe && baseRecipes.length === 0) {
                 setError("根據 URL 搜尋關鍵字，沒有找到符合的食譜。");
            }
        }
        
        setAvailableRecipes(allRecipes); 
    

    }, [searchParams, allRecipes, loadingData]); 

    // 🎯 【核心修正 4】：此 useEffect 專門用來更新 'filteredRecipes' 狀態
    useEffect(() => {
        if (loadingData) return;

        let recipes = availableRecipes; // 基礎是 URL 搜尋後的結果

        // 轉換所有選中的標籤為小寫，用於比對
        const lowerMeals = selectedMeals.map(t => t.toLowerCase());
        const lowerGoals = selectedGoals.map(t => t.toLowerCase());
        const lowerDiets = selectedDiets.map(t => t.toLowerCase());
        const lowerAllergies = selectedAllergies.map(t => t.toLowerCase());
        
        recipes = recipes.filter(recipe => {
            const safeTags = getSafeTags(recipe.tags); // 食譜所有標籤 (已小寫)
            
            const passesMealFilter = lowerMeals.length === 0 || lowerMeals.some(mealTag => safeTags.includes(mealTag));
            const passesGoalFilter = lowerGoals.length === 0 || lowerGoals.some(goalTag => safeTags.includes(goalTag));
            // 修改飲食習慣的篩選邏輯
            // 檢查是否 (沒有選擇飲食) 或 (選擇的是'一般飲食')
            const dietFilterIsIgnored = 
                lowerDiets.length === 0 || 
                (lowerDiets.length === 1 && lowerDiets[0] === '一般飲食');
            
            // 如果 dietFilterIsIgnored 為 true，則 passesDietFilter 為 true
            // 否則 (例如選了'全素')，才執行 .some() 檢查
            const passesDietFilter = 
                dietFilterIsIgnored ? true : lowerDiets.some(dietTag => safeTags.includes(dietTag));
            
            const passesAllergyFilter = lowerAllergies.length === 0 || !lowerAllergies.some(allergyTag => safeTags.includes(allergyTag));
            
            return passesMealFilter && passesGoalFilter && passesDietFilter && passesAllergyFilter;
        });

        // 3. 更新計數狀態
        setFilteredRecipes(recipes);
    
    }, [selectedMeals, selectedGoals, selectedDiets, selectedAllergies, availableRecipes, loadingData]); // 依賴所有篩選條件和 availableRecipes
    
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
            // 直接使用 'filteredRecipes' 狀態
            const recipe = getRandomRecipe(filteredRecipes);
            
            if (!recipe) {
                setError("抱歉！根據您的篩選條件，沒有找到符合的食譜。");
            }

            setCurrentRecipe(recipe);
            setLastDrawnId(recipe ? recipe.id : null); 
            setLoading(false);
        }, 500);
    };

    return (
        <div className="page-container-main"> 

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
                
                {/* 標題與篩選鈕定位區 */}
                <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                    <h2 className="heandline-font">食譜抽卡：「現在煮什麼？」</h2>
                    <p>讓系統為你隨機推薦一道美味輕食！</p>

                    {/* 篩選選單區塊 */}
                    <div className="filter-button-and-dropdown-container">
                        <button 
                            onClick={toggleFilter} 
                            className="filter-toggle-button filter-icon-button" 
                        >
                            {isFilterOpen ? '隱藏篩選條件 ▲' : '顯示篩選條件 ▼'}
                        </button>

                        {isFilterOpen && (
                            <div className="filter-options-panel filter-dropdown-float filter-dropdown-right">
                                
                                {/* 提示文字改用 filteredRecipes.length */}
                                <p style={{
                                    fontSize: '0.9em', 
                                    color: '#0e4b2d', 
                                    fontWeight: 'bold', 
                                    borderBottom: '1px solid #ccc', 
                                    paddingBottom: '10px',
                                    marginTop: '0'
                                }}>
                                    {loadingData ? '載入中...' : `目前有 ${filteredRecipes.length} 道食譜符合條件`}
                                </p>
                                {/* 餐點類型 (單選) */}
                                <h4 className="filter-group-title">餐點類型 (單選)</h4> 
                                <div className="filter-tags-group filter-radio-group">
                                    {MEAL_FILTERS.map(tag => (
                                        <button 
                                            key={`meal-${tag}`} 
                                            className={`filter-tag-button ${selectedMeals.includes(tag) ? 'active-meal-radio' : ''}`} 
                                            onClick={() => handleFilterClick('meal', tag)} 
                                            disabled={loading}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* 健康目標 (多選) */}
                                <h4 className="filter-group-title">健康目標 (多選)</h4> 
                                <div className="filter-tags-group">
                                    {HEALTH_GOAL_FILTERS.map(tag => (
                                        <button 
                                            key={`goal-${tag}`} 
                                            className={`filter-tag-button ${selectedGoals.includes(tag) ? 'active' : ''}`} 
                                            onClick={() => handleFilterClick('goal', tag)} 
                                            disabled={loading}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {/*飲食習慣 (單選) */}
                                <h4 className="filter-group-title">飲食習慣 (單選)</h4> 
                                <div className="filter-tags-group filter-radio-group">
                                    {DIET_HABIT_FILTERS.map(tag => (
                                        <button 
                                            key={`diet-${tag}`} 
                                            type="button"
                                            // 用active-meal-radio Class 進行單選變色
                                            className={`filter-tag-button ${selectedDiets.includes(tag) ? 'active-meal-radio' : ''}`} 
                                            // 確保 onClick 呼叫 'diet' 類型
                                            onClick={() => handleFilterClick('diet', tag)} 
                                            disabled={loading}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {/* 排除過敏原 (多選) */}
                                <h4 className="filter-group-title">排除過敏原 (多選)</h4>
                                <div className="filter-tags-group">
                                    {ALLERGY_FILTERS.map(tag => (
                                        <button 
                                            key={`allergy-${tag}`} 
                                            className={`filter-tag-button ${selectedAllergies.includes(tag) ? 'active-allergy' : ''}`} 
                                            onClick={() => handleFilterClick('allergy', tag)} 
                                            disabled={loading}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
                                    請選擇後，點擊「現在吃？」抽取。
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
                        disabled={loading || filteredRecipes.length === 0} 
                        className="draw-button" 
                    >
                        {loading ? '正在推薦...' : (
                            allRecipes.length === 0 ? '無可用食譜' :
                            (filteredRecipes.length === 0 ? '無符合條件食譜' : '現在吃？')
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
                                
                                {/* 圖片載入中提示 (可選) */}
                                {imageLoading && <p>圖片載入中...</p>} 
                                
                                <img 
                                    src={drawnImageUrl} 
                                    alt={currentRecipe.title} 
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
                                <h3>{currentRecipe.title}</h3>
                                
                                {/* Tags 顯示邏輯 */}
                                <div className="recipe-card-tags">
                                    {getSafeTags(currentRecipe.tags).slice(0, 2).map((tag, index) => (
                                        <span key={index} className="card-tag-pill">{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                                    ))}
                                </div>

                                <p>{currentRecipe.description}</p>
                                
                                <span className="toggle-form-link" style={{ marginTop: '0.5rem' }}>
                                    查看詳細做法 »
                                </span>
                            </div>
                        </Link>
                    ) : (
                        // 首次載入或沒有食譜時的提示
                        (!error && !loading) && <p>點擊「現在吃？」按鈕，製做您的美味。</p>
                    )}
                </div>
            </div>
            )}
        </div>
    );
};

export default RecipeDrawPage;