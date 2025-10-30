import { useLocation, useNavigate } from "react-router-dom";
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
      <div
        className="info_area"
        style={
          location.pathname.includes("admin")
            ? { display: "flex" }
            : { display: "none" }
        }
      >
        {loggedIn === "true" ? <span>{userId} 님, 안녕하세요!</span> : <></>}
        <button
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
              window.confirm("정말 로그아웃하시겠습니까?")
            ) {
              localStorage.setItem("isLoggedIn", "false");
              navigate("/login");
            }
          }}
        >
          {loggedIn === "true" ? "로그아웃" : "로그인"}
        </button>
      </div>
    </div>
  );
};
export default Header;
