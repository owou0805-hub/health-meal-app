// src/hooks/useImageLoader.js

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

// 🎯 設定您的 Bucket 名稱和時效
const ALL_IMAGES_BUCKET_NAME = 'all_images';
const SIGNED_URL_EXPIRY_SECONDS = 1800; // 30 分鐘

const useImageLoader = (relativePath) => {
    const [imageUrl, setImageUrl] = useState('/placeholder-recipe.jpg'); // 預設 Placeholder
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!relativePath) {
            setImageUrl('/placeholder-recipe.jpg');
            return;
        }
        
        const fetchSignedUrl = async () => {
            setLoading(true);

            try {
                // 嘗試從 Supabase 獲取 Signed URL
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                    .from(ALL_IMAGES_BUCKET_NAME) 
                    .createSignedUrl(relativePath, SIGNED_URL_EXPIRY_SECONDS); 
                
                if (signedUrlError) {
                    console.error('Signed URL Error:', signedUrlError);
                    setImageUrl('/placeholder-recipe.jpg'); // 失敗時顯示 Placeholder
                } else {
                    setImageUrl(signedUrlData.signedUrl); // 成功時設定臨時 URL
                }
            } catch (e) {
                console.error('Image Loader Failed:', e);
                setImageUrl('/placeholder-recipe.jpg');
            } finally {
                setLoading(false);
            }
        };

        fetchSignedUrl();
    }, [relativePath]); // 依賴於相對路徑變化時觸發

    return { imageUrl, loading };
};

export default useImageLoader;