// src/components/layout/MainLayout.js
import React from 'react';
import Header from './Header/Header.js';
import ResponsiveNavigation from './Navigation/ResponsiveNavigation.js';
import CompactFooter from './Footer/CompactFooter.js';

const MainLayout = ({ children }) => {
  return (
    <div className="layout-container">
      {/* <Header /> */}
      <ResponsiveNavigation />
      <main className="main-wrapper">
        {children}
      </main>
      <CompactFooter />
    </div>
  );
};

export default MainLayout;