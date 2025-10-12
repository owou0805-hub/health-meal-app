import React from 'react';

const FavoriteRecipesPage = () => {
  // 這裡未來將從 Supabase 讀取使用者收藏的食譜資料
  const favoriteRecipes = []; // 預設為空

  return (
    <div>
      <h2>我的收藏食譜</h2>
      {favoriteRecipes.length > 0 ? (
        favoriteRecipes.map(recipe => (
          <div key={recipe.id}>
            <h3>{recipe.title}</h3>
            <p>{recipe.description}</p>
          </div>
        ))
      ) : (
        <p>您目前還沒有收藏任何食譜。</p>
      )}
    </div>
  );
};

export default FavoriteRecipesPage;