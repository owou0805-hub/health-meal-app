// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../index.css'; 

// 1. 健康目標 (Goal Options) - 新增
const GOAL_OPTIONS = [
    '減脂', '增肌', '高蛋白', '低碳水', '高纖維', 
    '控糖飲食', '降膽固醇', '低鈉飲食', '美肌養顏', 
    '促進腸胃健康', '提升專注力', '增進睡眠品質'
];

// 2. 飲食習慣 (Diet Options) - 新增
const DIET_OPTIONS = [
    '一般飲食', '全素', '蛋奶素', '魚素', 
    '地中海飲食', '原型食物飲食', '生酮飲食'
];

// 3. 過敏原 (Allergy Options) - 新增
const ALLERGY_OPTIONS = [
    '花生', '堅果', '牛奶', '雞蛋', '大豆', 
    '小麥', '魚類', '甲殼類', '軟體動物', 
    '芒果', '奇異果', '麩質', '雞肉', '牛肉', '豬肉'
];


const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);


    // 從 Supabase 讀取用戶資料的函式
    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError('請先登入以檢視個人設定。');
            setLoading(false);
            return;
        }
        
        // 【關鍵修正】：使用 eq('id', user.id) 精確篩選
        const { data, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id) 
            .single(); 

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = 找不到行 (正常情況)
            console.error('Error fetching profile:', fetchError);
            setError(`無法載入設定：${fetchError.message}`);
        } else if (data) {
            // 載入資料時，確保數組欄位非空
            setProfile({
                ...data,
                health_goals: data.health_goals || [], 
                allergens: data.allergens || [],
            });
        } else {
            // 用戶首次訪問，初始化 profile 狀態
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


    // 🎯 修正：處理單選 (飲食習慣) 變更
    const handleDietChange = (diet) => {
        setProfile(prevProfile => ({ ...prevProfile, dietary_habit: diet }));
    };

    // 🎯 修正後的數組 (多選) 變更函式 (解決按鈕不變色)
    const handleArrayChange = (name, tag) => {
        // 使用 setProfile 的回調函數來確保基於最新的 profile 狀態進行操作
        setProfile(prevProfile => {
            const prevArray = prevProfile[name] || [];
            let newArray;

            if (prevArray.includes(tag)) {
                // 移除標籤：使用 filter 創建一個新數組
                newArray = prevArray.filter(t => t !== tag);
            } else {
                // 新增標籤：使用 slice() 和 spread 確保創建新數組
                newArray = [...prevArray.slice(), tag]; 
            }

            // 返回一個新的 Profile 物件，確保 React 重新渲染
            return { 
                ...prevProfile, 
                [name]: newArray 
            };
        });
    };


    // 提交表單：執行 UPSERT (插入或更新)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage(null);
        setError(null);

        // 必須獲取當前用戶 ID，用於 Supabase 的 upsert 匹配
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError('您尚未登入，請重新登入！');
            setSaving(false);
            return;
        }

        const profileData = {
            id: user.id, // RLS 核心
            health_goals: profile.health_goals || [], 
            dietary_habit: profile.dietary_habit,
            allergens: profile.allergens || [],
        };

        // 使用 upsert 邏輯
        const { error: upsertError } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'id', ignoreDuplicates: false }); 

        if (upsertError) {
            console.error('Save failed:', upsertError);
            setError(`儲存失敗：請檢查資料庫連線或 [health_goals/allergens] 欄位是否設為 Array (text[])。`);
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

    if (error && !profile) {
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

                    
                    {/* 1. 健康目標 (多選標籤) */}
                    <div className="input-group" style={{maxWidth: '800px'}}> {/* 增加 maxWidth 以容納雙排 */}
                        <label className="form-label" style={{marginBottom: '10px'}}>健康目標 (多選):</label>
                        <div className="grid-button-group"> {/* 【關鍵修正】 */}
                            {/* ... GOAL_OPTIONS.map() 保持不變 ... */}
                        </div>
                    </div>

                    {/* 2. 飲食習慣 (單選標籤) */}
                    <div className="input-group" style={{maxWidth: '800px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>飲食習慣 (單選):</label>
                        <div className="grid-button-group"> {/* 【關鍵修正】 */}
                            {/* ... DIET_OPTIONS.map() 保持不變 ... */}
                        </div>
                    </div>

                    {/* 3. 過敏原 (多選標籤) */}
                    <div className="input-group" style={{maxWidth: '800px'}}>
                        <label className="form-label" style={{marginBottom: '10px'}}>排除過敏原 (多選):</label>
                        <div className="grid-button-group"> {/* 【關鍵修正】 */}
                            {/* ... ALLERGY_OPTIONS.map() 保持不變 ... */}
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