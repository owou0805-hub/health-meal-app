import React from 'react';

const ProfilePage = () => {
  return (
    <div>
      <h2>我的個人檔案</h2>
      {/* 在這裡顯示並編輯使用者的飲食習慣與健康目標 */}
      <form>
        <h3>修改偏好設定</h3>
        <label>飲食習慣：<input type="text" /></label>
        <label>健康目標：<input type="text" /></label>
        <button type="submit">儲存</button>
      </form>
    </div>
  );
};

export default ProfilePage;