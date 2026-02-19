import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';

import LoadingOverlay from './components/LoadingOverlay';
import Button from './components/Button';
import ci from './assets/img/logo.svg';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const VALID_USERS = [ 
    { id: 'manager', pw: 'manager', name: 'manager' },
    { id: 'guest', pw: 'guest', name: 'guest' },
    { id: 'gksektha12', pw: '218738', name: 'testuser' },
    { id: 'jinhob', pw: '221353', name: 'testuser' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const matched = VALID_USERS.find(
        (user) => user.id === username && user.pw === password
      );

      if (matched) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', matched.name);
        localStorage.setItem('userId', matched.id);
        navigate('/console');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      {loading && <LoadingOverlay message="로그인 중..." />}

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center max-w-[150px] sm:max-w-[180px]">
            <img src={ci} alt="logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">관리자 로그인</h1>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-bold text-sm">{error}</p>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              사용자 ID
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
              placeholder="사용자 ID를 입력하세요"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              fullWidth
              icon={LogIn}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/user')}
              // type="submit"
              disabled={loading}
              fullWidth
              icon={User}
            >
              일반 사용자 페이지로 이동
            </Button>
          </div>
        </form>

        {/* 푸터 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>&copy; 2026. AJ Networks Corporation. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
