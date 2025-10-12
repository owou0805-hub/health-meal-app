// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../index.css'; 

// 預設選項列表 (保持不變)
const GOAL_OPTIONS = ['減重', '增肌', '快速備餐', '改善腸道健康'];
const DIET_OPTIONS = ['一般飲食', '素食', '純素', '地中海飲食', '低碳水/生酮'];
const ALLERGY_OPTIONS = ['花生', '乳製品', '海鮮', '麩質', '堅果'];


const ProfilePage = () => {
    // 移除 username 相關狀態
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // 從 Supabase 讀取用戶資料的函式
    const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .single(); 

        if (error && error.code !== 'PGRST116') { // PGRST116 = 找不到行
            console.error('Error fetching profile:', error);
            setError('無法載入用戶資料。');
        } else if (data) {
            setProfile(data);
        } else {
            // 用戶首次訪問，初始化 profile 狀態，確保數組是空的，而不是 null
            setProfile({ 
                health_goals: [], 
                dietary_habit: DIET_OPTIONS[0], 
                allergens: [] 
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, []);


    // 處理單選 (飲食習慣) 變更
    const handleDietChange = (diet) => {
        setProfile({ ...profile, dietary_habit: diet });
    };

    // 🎯 修正後的數組 (多選) 變更函式
    const handleArrayChange = (name, tag) => {
        // 【核心修正】：使用 spread operator 創建新的數組，確保 React 正確偵測到變動
        const currentArray = profile[name] || []; 
        
        if (currentArray.includes(tag)) {
            // 移除標籤
            setProfile({ ...profile, [name]: currentArray.filter(t => t !== tag) });
        } else {
            // 新增標籤
            setProfile({ ...profile, [name]: [...currentArray, tag] });
        }
    };


    // 提交表單：執行 UPSERT (插入或更新)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);

        // 必須獲取當前用戶 ID，用於 Supabase 的 upsert 匹配
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError('您尚未登入，請重新登入！');
            setSaving(false);
            return;
        }

        const profileData = {
            id: user.id, // 使用用戶的 UUID 作為 profile ID
            // 🎯 username 已移除
            health_goals: profile.health_goals,
            dietary_habit: profile.dietary_habit,
            allergens: profile.allergens,
        };

        // 使用 upsert 邏輯：如果存在就更新，否則插入
        const { error } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'id' }); // 衝突時，使用 'id' 欄位進行更新

        if (error) {
            console.error('Save failed:', error);
            // 顯示更精準的錯誤，幫助判斷是否是資料類型錯誤
            setError(`儲存失敗：請檢查資料類型 (Tags/Goals 是否設為 Array)。`);
        } else {
            setSuccessMessage('🎉 您的設定已成功儲存！');
        }

        setSaving(false);
        // 成功後重新載入資料，確保最新狀態
        fetchProfile(); 
    };


    if (loading) {
        return <div className="page-container-main"><p style={{textAlign: 'center'}}>載入個人設定中...</p></div>;
    }

    if (error) {
        return <div className="page-container-main"><p style={{textAlign: 'center', color: 'red'}}>錯誤: {error}</p></div>;
    }

    // 確保 profile 狀態存在
    if (!profile) return null;


    return (
        <div className="page-container-main">
            <h1 className="heandline-font">個人健康設定</h1>
            <p>管理您的飲食偏好和健康目標，以獲得最精準的食譜推薦。</p>

            <div className="auth-form-container">
                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* 成功/錯誤訊息 */}
                    {successMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}
                    {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

                    
                    {/* 🎯 用戶名稱欄位已移除 */}


                    {/* 1. 健康目標 (多選標籤) */}
                    <div className="input-group" style={{maxWidth: '600px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>健康目標 (多選):</label>
                        <div className="filter-tags-group">
                            {GOAL_OPTIONS.map(goal => (
                                <button
                                    key={goal}
                                    type="button"
                                    // 判斷是否選中的邏輯是正確的
                                    className={`filter-tag-button ${profile.health_goals.includes(goal) ? 'active' : ''}`}
                                    onClick={() => handleArrayChange('health_goals', goal)}
                                    disabled={saving}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. 飲食習慣 (單選標籤) */}
                    <div className="input-group" style={{maxWidth: '600px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>飲食習慣 (單選):</label>
                        <div className="filter-tags-group">
                            {DIET_OPTIONS.map(diet => (
                                <button
                                    key={diet}
                                    type="button"
                                    className={`filter-tag-button ${profile.dietary_habit === diet ? 'active-meal-radio' : ''}`}
                                    onClick={() => handleDietChange(diet)} // 🎯 修正：呼叫單選函式
                                    disabled={saving}
                                >
                                    {diet}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* 3. 過敏原 (多選標籤) */}
                    <div className="input-group" style={{maxWidth: '600px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>排除過敏原 (多選):</label>
                        <div className="filter-tags-group">
                            {ALLERGY_OPTIONS.map(allergen => (
                                <button
                                    key={allergen}
                                    type="button"
                                    className={`filter-tag-button ${profile.allergens.includes(allergen) ? 'active-allergy' : ''}`}
                                    onClick={() => handleArrayChange('allergens', allergen)}
                                    disabled={saving}
                                >
                                    {allergen}
                                </button>
                            ))}
                        </div>
                    </div>


                    <button type="submit" disabled={saving}>
                        {saving ? '儲存中...' : '儲存設定'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;