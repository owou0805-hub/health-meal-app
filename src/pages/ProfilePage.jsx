// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../index.css'; 

// 預設選項列表
const GOAL_OPTIONS = ['減重', '增肌', '快速備餐', '改善腸道健康'];
const DIET_OPTIONS = ['一般飲食', '素食', '純素', '地中海飲食', '低碳水/生酮'];
const ALLERGY_OPTIONS = ['花生', '乳製品', '海鮮', '麩質', '堅果'];


const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // 從 Supabase 讀取用戶資料的函式
    const fetchProfile = async () => {
        setLoading(true);
        // 由於 RLS 已經設定，supabase 會自動過濾出當前用戶的資料
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .single(); // 期望只返回一筆數據

        if (error && error.code !== 'PGRST116') { // PGRST116 = 找不到行 (第一次登入)
            console.error('Error fetching profile:', error);
            setError('無法載入用戶資料。');
        } else if (data) {
            setProfile(data);
        } else {
            // 用戶首次訪問，初始化 profile 狀態
            setProfile({ 
                username: '', 
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


    // 處理表單內容變更
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    // 處理陣列 (多選) 變更
    const handleArrayChange = (name, tag) => {
        const currentArray = profile[name] || [];
        if (currentArray.includes(tag)) {
            setProfile({ ...profile, [name]: currentArray.filter(t => t !== tag) });
        } else {
            setProfile({ ...profile, [name]: [...currentArray, tag] });
        }
    };


    // 提交表單：執行 UPSERT (插入或更新)
    const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);

    // 【關鍵修正】：必須在提交時，獲取當前用戶的 UUID
    const { data: { user } } = await supabase.auth.getUser(); 
    
    if (!user) {
        setError('您尚未登入，請重新登入！');
        setSaving(false);
        return;
    }

    const profileData = {
        // 🎯 確保 ID 是正確的 Supabase 用戶 UUID
        id: user.id, 
        username: profile.username,
        health_goals: profile.health_goals,
        dietary_habit: profile.dietary_habit,
        allergens: profile.allergens,
    };

    // 使用 upsert 邏輯：如果存在就更新，否則插入
    // ... (保留 upsert 邏輯) ...

    const { error } = await supabase
        .from('user_profiles')
        // 【關鍵】確保 onConflict 使用正確的欄位名稱 (id)
        .upsert(profileData, { onConflict: 'id' });

        if (error) {
            console.error('Save failed:', error);
            setError('儲存失敗：請檢查您的網路連線。');
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

    return (
        <div className="page-container-main">
            <h1 className="heandline-font">個人健康設定</h1>
            <p>管理您的飲食偏好和健康目標，以獲得最精準的食譜推薦。</p>

            <div className="auth-form-container">
                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* 成功/錯誤訊息 */}
                    {successMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}
                    {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

                    {/* 1. 用戶名 */}
                    <div className="input-group" style={{maxWidth: '400px'}}>
                        <label htmlFor="username" className="form-label">用戶名稱:</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={profile.username}
                            onChange={handleChange}
                            placeholder="輸入您的暱稱"
                            disabled={saving}
                        />
                    </div>
                    
                    {/* 2. 健康目標 (多選標籤) */}
                    <div className="input-group" style={{maxWidth: '600px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>健康目標 (多選):</label>
                        <div className="filter-tags-group">
                            {GOAL_OPTIONS.map(goal => (
                                <button
                                    key={goal}
                                    type="button"
                                    className={`filter-tag-button ${profile.health_goals.includes(goal) ? 'active' : ''}`}
                                    onClick={() => handleArrayChange('health_goals', goal)}
                                    disabled={saving}
                                >
                                    {goal}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. 飲食習慣 (單選標籤) */}
                    <div className="input-group" style={{maxWidth: '600px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>飲食習慣 (單選):</label>
                        <div className="filter-tags-group">
                            {DIET_OPTIONS.map(diet => (
                                <button
                                    key={diet}
                                    type="button"
                                    className={`filter-tag-button ${profile.dietary_habit === diet ? 'active-meal-radio' : ''}`}
                                    onClick={() => handleChange({ target: { name: 'dietary_habit', value: diet } })}
                                    disabled={saving}
                                >
                                    {diet}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* 4. 過敏原 (多選標籤) */}
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