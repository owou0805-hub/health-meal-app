import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import Footer from '../components/Footer'; 
import '../index.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout">
      <nav className="navbar-auth">
        {/* 【關鍵修正】: 使用 navbar-auth-content 來限制 Logo 寬度 */}
        <div className="navbar-auth-content"> 
          <Link to="/" className="navbar-logo">
            <img src={logo} alt="網站 Logo" className="logo-img" />
          </Link>
        </div>
      </nav>
      <div className="page-container-auth">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default AuthLayout;