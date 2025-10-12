// src/layouts/MainLayout.jsx

//已登入使用者設計佈局
import React, { useState } from 'react';
// 【修正】：只導入 Link (移除 Outlet)
import { Link } from 'react-router-dom'; 
import logo from '../assets/logo.png';
import Footer from '../components/Footer';
import '../index.css';

// 【修正】：重新加入 { children } 屬性
const MainLayout = ({ children, handleLogout }) => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  // 切換選單狀態
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // 點擊連結後自動關閉選單
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="main-layout">
      <nav className="navbar-main">
        <Link to="/home" className="navbar-logo" onClick={closeMenu}>
          <img src={logo} alt="網站 Logo" className="logo-img" />
        </Link>
        
        <div className="hamburger-icon" onClick={toggleMenu}>
            {isMenuOpen ? (
                <span className="close-icon">✕</span>
            ) : (
                <>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                </>
            )}
        </div>

        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/home" onClick={closeMenu}>首頁</Link>
          <Link to="/recipes"onClick={closeMenu}>所有食譜</Link>
          <Link to="/recipes/draw"onClick={closeMenu}>現在吃？</Link>
          <Link to="/restaurant-draw" onClick={closeMenu}>餐廳抽卡</Link> 
          <Link to="/sport-draw"onClick={closeMenu}>來運動！</Link>
          <Link to="/favorites" onClick={closeMenu}>我的收藏</Link>
          <Link to="/profile" onClick={closeMenu}>個人檔案</Link>
          <button onClick={() => { handleLogout(); closeMenu(); }}>登出</button>
        </div>
      </nav>
      
      <div className="page-container-main">
        {/* 【核心】：重新使用 {children} 來渲染頁面內容 */}
        {children} 
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;