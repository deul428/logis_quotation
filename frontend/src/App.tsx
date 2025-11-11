import User from "./User.tsx";
import User02 from "./User02.tsx";
import Console from "./Console.tsx";
import Header from "./Header.tsx";
import Login from "./Login.tsx";
import "./assets/styles/common.scss";
import "./assets/styles/console.scss";
import "./assets/styles/login.scss";
import { useState, useEffect } from "react";
import { useLocation, Routes, Route, useNavigate } from "react-router-dom";
import "./type.d.ts";
const App: React.FC = () => {
  const [tabData, setTabData] = useState<string>("user");
  const location = useLocation();
  const navigate = useNavigate();

  const loggedIn = localStorage.getItem("isLoggedIn");
  useEffect(() => {
    if (tabData === "console") {
      if (loggedIn !== "true") {
        alert("로그인이 필요한 메뉴입니다.");
        navigate("/login");
      } else {
        navigate("/console");
      } 
    } else if (tabData === "user" && !location.pathname.includes("multi") && !location.pathname.includes("login")) {
      navigate("/user");
    }
  }, [tabData]);

  useEffect(() => {
    if (location.pathname.includes("console")) {
      if (loggedIn !== "true") {
        alert("로그인이 필요합니다.");
        navigate("/login");
      } else {
        navigate("/console");
      }
    }
  }, [location.pathname]);
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/console"
          element={<Console tabData={tabData} setTabData={setTabData} />}
        />
        <Route path="/" element={<User />} />
        <Route path="/multi" element={<User02 />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </>
  );
}; 

export default App;
