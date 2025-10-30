import React, { useState, /* useEffect */ } from "react";
import { /* useLocation, */ useNavigate } from "react-router-dom";
import "./assets/styles/common.scss";
import "./assets/styles/login.scss";

const Login: React.FC = () => {
  const navigate = useNavigate();

  // 로그인 폼 상태
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ 여러 개의 하드코딩된 계정 목록
  const VALID_USERS = [
    { id: "admin", pw: "1234", name: "관리자" },
    { id: "manager", pw: "abcd", name: "매니저" },
    { id: "guest", pw: "guest", name: "게스트" },
  ];
   const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ✅ 입력한 값이 배열 중 하나와 일치하는지 확인
    const matched = VALID_USERS.find(
      (user) => user.id === username && user.pw === password
    );

    if (matched) {
      // ✅ 로그인 성공 → 사용자 정보 저장 (name도 같이)
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userName", matched.name);
      localStorage.setItem("userId", matched.id);

      navigate("/admin");
    } else {
      setError("❌ 아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };


  return (
    <div className="login-wrap">
      <h2>관리자 로그인</h2>

      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
      </form>

      {error && <p className="error-msg">{error}</p>}

      <div className="login-hint">
        <p>💡 테스트 계정</p>
        <ul>
          <li>admin / 1234</li>
          <li>manager / abcd</li>
          <li>guest / guest</li>
        </ul>
      </div>
    </div>
  ); 
};

export default Login;
