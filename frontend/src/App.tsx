import React, { useState, useEffect } from 'react';
import { useLocation, Routes, Route, useNavigate } from 'react-router-dom';

import Manager from "./Manager";
import Header from './Header';
import Login from './Login';
import User from './User';
import User02 from './User02';
import './App.css';
import './type.d.ts';

const MainLayout: React.FC<{ tabData: string; setTabData: React.Dispatch<React.SetStateAction<string>>; children: React.ReactNode }> = ({
  tabData,
  setTabData,
  children,
}) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Header tabData={tabData} setTabData={setTabData} />
    <main className="flex-1 overflow-auto">{children}</main>
    <footer className="bg-white border-t border-gray-200 py-6 no-print">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-xs">
        &copy; 2026. AJ Networks Corporation. All rights reserved.
      </div>
    </footer>
  </div>
);

const App: React.FC = () => {
  const [tabData, setTabData] = useState<string>('user');
  const location = useLocation();
  const navigate = useNavigate();

  const loggedIn = localStorage.getItem('isLoggedIn');
  useEffect(() => {
    if (tabData === 'manager') {
      if (loggedIn !== 'true') {
        alert('로그인이 필요한 메뉴입니다.');
        navigate('/login');
      } else {
        navigate('/manager');
      }
    } else if (tabData === 'user' && !location.pathname.includes('multi') && !location.pathname.includes('login')) {
      navigate('/user');
    }
  }, [tabData]);

  useEffect(() => {
    if (location.pathname.includes('manager')) {
      if (loggedIn !== 'true') {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else {
        navigate('/manager');
      }
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <MainLayout tabData={tabData} setTabData={setTabData}>
            <Routes>
              <Route path="/manager" element={<Manager tabData={tabData} setTabData={setTabData} />} />
              <Route path="/" element={<User />} />
              <Route path="/multi" element={<User02 />} />
              <Route path="/user" element={<User />} />
            </Routes>
          </MainLayout>
        }
      />
    </Routes>
  );
};

export default App;
