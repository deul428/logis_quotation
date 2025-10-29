import User from "./User.tsx";
import Admin from "./Admin.tsx";
import Header from "./Header.tsx";
import Login from "./Login.tsx";
import "./assets/styles/common.scss";
import "./assets/styles/admin.scss";
import "./assets/styles/login.scss";
import { useState, useEffect } from "react";
import {
  useLocation,
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
const App: React.FC = () => {
  const [tabData, setTabData] = useState<string>("user");
  const location = useLocation();
  const navigate = useNavigate();

  const loggedIn = localStorage.getItem("isLoggedIn");
  useEffect(() => { 
    if (tabData === "admin") {
      if (loggedIn !== "true") {
        alert("로그인이 필요한 메뉴입니다.");
        navigate("/login");
      } else {
        navigate("/admin");
      }
    } else if (tabData === "user") {
      navigate("/user");
    }
  }, [tabData]);

  /*   useEffect(() => {
    console.log("loggedIn:", loggedIn);
    if (loggedIn === "false") {
      navigate("/login");
    }
  }, [loggedIn]); */

  useEffect(() => { 
    if (location.pathname.includes("admin")) {
      if (loggedIn !== "true") {
        alert("로그인이 필요합니다.");
        navigate("/login");
      } else {
        navigate("/admin");
      }
    }
  }, [location.pathname]);
  return (
    <>
      <Header tabData={tabData} setTabData={setTabData} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<User />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </>
  );
};
// function App() {
//   return (
//     <div className="wrap">
//       <Header setTabData={setTabData} />
//       {tabData === "user" ? <User /> : <Admin />}
//     </div>
//   );
// }

export default App;
