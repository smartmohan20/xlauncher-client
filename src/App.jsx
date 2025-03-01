import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home/Home';
import LoadingPage from './pages/Loading/Loading';
import { useApp } from './contexts/AppContext';

/**
 * Layout component with header and footer
 */
const Layout = ({ children }) => {
  const { isLoading } = useApp();
  
  if (isLoading) {
    return <LoadingPage />;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

/**
 * Main application component
 */
const App = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Home />
            </Layout>
          } />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;