import { Link } from 'react-router-dom';
import '../index.css';

const Footer = () => {
  // 頁腳的年份會自動更新
  const currentYear = new Date().getFullYear(); 

  return (
    <footer className="site-footer">
      <div className="footer-content">
        {}
        <div className="footer-section support centered-section">
          <h3>服務與支援</h3>
          <ul>
            <li><Link to="/about">關於我們</Link></li>
            <li><Link to="/privacy">隱私權保護</Link></li>
            <li><Link to="/contact">與我們聯繫</Link></li>
          </ul>
        </div>
        
      </div>
      
      <div className="footer-bottom">
        &copy; {currentYear} 輕食推薦. 版權所有.
      </div>
    </footer>
  );
};

export default Footer;