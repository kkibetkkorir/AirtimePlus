

const Header = ({currentPage, handleNavigation}) => {

  return (
    <header>
      <div className="container">
        <nav className="navbar">
          <a href="#" className="logo" onClick={() => handleNavigation('home')}>
            <i className="fas fa-mobile-alt"></i> AirtimeNow
          </a>
          <ul className="nav-links">
            <li><a
              href="#"
              className={currentPage === 'home' ? 'active' : ''}
              onClick={() => handleNavigation('home')}
            >Home</a></li>
            <li><a
              href="#"
              className={currentPage === 'offers' ? 'active' : ''}
              onClick={() => handleNavigation('offers')}
            >Offers</a></li>
            <li><a
              href="#"
              className={currentPage === 'support' ? 'active' : ''}
              onClick={() => handleNavigation('support')}
            >Support</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;