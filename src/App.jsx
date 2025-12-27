// App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Offers from './pages/Offers';
import Support from './pages/Support';

// Import the new pages
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import FAQ from './pages/FAQ';
import './App.css';


function App() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000)
  }, []);

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'offers':
        return <Offers handleNavigation={handleNavigation}/>;
      case 'support':
        return <Support />;
        case 'terms':
          return <TermsOfService />;
        case 'privacy':
          return <PrivacyPolicy />;
        case 'refund':
          return <RefundPolicy />;
        case 'faq':
          return <FAQ />;
      default:
        return <Home />;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <Header
        currentPage={currentPage}
        handleNavigation={handleNavigation}
      />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer handleNavigation={handleNavigation} />
    </div>
  );
}

export default App;
