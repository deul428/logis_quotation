import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Key, LogIn, LogOut } from 'lucide-react';

import Button from './components/Button';
import ci from './assets/img/logo.svg';
import user from './assets/img/i_user.svg';

interface ChatTitleProps {
  tabData: string;
  setTabData: React.Dispatch<React.SetStateAction<string>>;
}

const Header: React.FC<ChatTitleProps> = ({ tabData, setTabData }) => {
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem('isLoggedIn');
  const userId = localStorage.getItem('userId');
  const location = useLocation();
  const isConsole = location.pathname.includes('console');

  const handleLogout = () => {
    if (loggedIn === 'true' && window.confirm('로그아웃하시겠습니까?')) {
      localStorage.setItem('isLoggedIn', 'false');
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm no-print">
      <div className="max-w-[85dvw] mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex 
        flex-row items-center gap-2 min-h-[56px] sm:min-h-[64px] py-2 sm:py-0  justify-end sm:justify-between ">
          {/* 로고 */}
          <div className="flex items-center flex-shrink-0 order-1 hidden sm:block">
            <img src={ci} alt="AJ 로고" className="h-auto max-w-[140px] object-contain" />
          </div>

          {/* 탭: 사용자용 / 관리자용 */}
          {loggedIn &&
            <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-2  sm:w-auto justify-end flex-shrink-0 hidden ">
              <Button
                type="button"
                variant={tabData === 'user' ? 'primary' : 'ghost'}
                onClick={() => setTabData('user')}
                className="min-h-[44px] sm:min-h-[40px] text-sm font-medium px-3 sm:px-4"
              >
                사용자용
              </Button>
              <Button
                type="button"
                variant={tabData === 'console' ? 'primary' : 'ghost'}
                onClick={() => setTabData('console')}
                className="min-h-[44px] sm:min-h-[40px] text-sm font-medium px-3 sm:px-4"
              >
                관리자용
              </Button>
            </div>
          }

          {/* 로그인 정보 / 로그인 버튼 */}
          <div className="flex items-center order-3 sm:order-3 flex-shrink-0">
            {isConsole && loggedIn === 'true' && (
              <div className="hidden sm:flex items-center gap-2 text-gray-600 text-sm font-medium truncate max-w-[120px] lg:max-w-none">
                <img src={user} alt="" className="w-6 h-6 opacity-80 flex-shrink-0" />
                <span className="truncate">{userId}</span>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              icon={loggedIn === 'true' ? Key : LogIn}
              onClick={loggedIn === 'true' ? handleLogout : () => navigate('/login')}
              className={`${loggedIn === 'true' ? '!text-red-600' : ''}`}
            >
              {loggedIn === 'true' ? '로그아웃' : '관리자 로그인'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
