import { useLocation, useNavigate } from "react-router-dom";
import {
  MdOutlineKeyboardArrowUp,
  MdOutlineKeyboardArrowDown,
  MdLogout,
} from "react-icons/md";
import ci from "./assets/img/logo.svg";
import user from "./assets/img/i_user.svg";
import { LuCircleUserRound } from "react-icons/lu";
import { IoMdArrowDropdown } from "react-icons/io";
interface ChatTitleProps {
  tabData: string;
  setTabData: React.Dispatch<React.SetStateAction<string>>;
}
const Header = ({ tabData, setTabData }: ChatTitleProps) => {
  const navigate = useNavigate();
  const loggedIn = localStorage.getItem("isLoggedIn");
  const userId = localStorage.getItem("userId");
  const location = useLocation();
  return (
    <div id="header">
      <div className="tabs">
        <button
          className="tab tab_user"
          style={
            tabData === "user"
              ? { background: "#5278e7", color: "white" }
              : { background: "#eee" }
          }
          onClick={() => setTabData("user")}
        >
          사용자용
        </button>
        <button
          className="tab tab_admin"
          style={
            tabData === "admin"
              ? { background: "#5278e7", color: "white" }
              : { background: "#eee" }
          }
          onClick={() => setTabData("admin")}
        >
          관리자용
        </button>
      </div>
      <div className="heading_area">
        <img className="ci" src={ci} alt="AJ 로고" />
      </div>
      <div
        className="info_area"
        style={
          location.pathname.includes("admin")
            ? { display: "flex" }
            : { display: "none" }
        }
      >
        <div className="login_info">
          <img className="user" src={user} alt="user_profile" />
          <p>{userId}</p>
        </div>
        <button
          className="logout"
          style={
            loggedIn === "true"
              ? { background: "#5278e7" }
              : {
                  background: "#f8920d",
                }
          }
          onClick={() => {
            if (
              loggedIn === "true" &&
              window.confirm("로그아웃하시겠습니까?")
            ) {
              localStorage.setItem("isLoggedIn", "false");
              navigate("/login");
            }
          }}
        >
          {loggedIn === "true" ? <MdLogout /> : "로그인"}
        </button>
      </div>
    </div>
  );
};
export default Header;
