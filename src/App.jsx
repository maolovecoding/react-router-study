import { useState } from "react";
import {
  HashRouter,
  BrowserRouter,
  Route,
  Routes,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
  // Outlet
} from "./react-router-dom";

const User = (props) => {
  return (
    <div>
      <h3>User</h3>
      <ul>
        <li><Link to="/user/list">用户列表</Link></li>
        <li><Link to="/user/add">添加用户</Link></li>
        <li><Link to="/user/detail/100">用户列表</Link></li>
      </ul>
      {/* 外部的 类似于 router-view */}
      <Outlet/>
    </div>
  );
};
const Home = () => {
  const navigate = useNavigate();
  const navigateTo = () => {
    navigate("/profile");
  };
  return (
    <div>
      Home
      <button onClick={navigateTo}>去往/profile</button>
    </div>
  );
};
const Profile = () => {
  return <div>Profile</div>;
};
const Test = () => {
  return <div>Test</div>;
};
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = () => {
    localStorage.setItem("login", "login");
    setTimeout(() => {
      localStorage.clear();
    }, 5000);
    const to = location.state?.from || "/";
    console.log(location);
    navigate(to);
  };
  return (
    <div>
      <h3>Login</h3>
      <button onClick={login}>登录</button>
    </div>
  );
};
const Protected = (props) => {
  const { component: RouteComponent, path } = props;
  return (
    <div>
      <h3>Protected</h3>
      {localStorage.getItem("login") ? (
        <RouteComponent />
      ) : (
        <Navigate
          to={{
            pathname: "/login",
            state: { from: path, to: "/login" },
          }}
        />
      )}
    </div>
  );
};

const UserAdd = (props) => {
  return <div>UserAdd</div>;
};
const UserList = (props) => {
  return <div>UserList</div>;
};
const UserDetail = (props) => {
  return <div>UserDetail</div>;
};
const activeStyle = {
  background: "#ccc",
};
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ul>
          <li>
            <NavLink
              style={({ isActive }) => (isActive ? activeStyle : {})}
              className={({ isActive }) => (isActive ? "active" : "")}
              to="/"
            >
              home
            </NavLink>
          </li>
          <li>
            <NavLink to="/user">user</NavLink>
          </li>
          <li>
            <NavLink to="/profile">profile</NavLink>
          </li>
          <li>
            <NavLink to="/test/100">test</NavLink>
          </li>
        </ul>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/user/*" element={<User />}>
            <Route path="add" element={<UserAdd />} />
            <Route path="list" element={<UserList />} />
            <Route path="detail/:id" element={<UserDetail />} />
          </Route>
          {/* <Route
            path="/profile"
            element={<Protected path="/profile" component={Profile} />}
          ></Route> */}
          {/* <Route path="/test/:id" element={<Test />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/home" element={<Navigate to="/user" />}></Route> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

// const path = "/post/:id/:age";
// function compilePath(path) {
//   const paramNames = [];
//   const regexpStr = path.replace(/:(\w+)/g, ($1, $2) => {
//     paramNames.push($2);
//     return "([^/]+)";
//   });
//   return [`^${regexpStr}$`, paramNames];
// }
// // const regexpStr = path.split(/:[\w]+/).join("[a-zA-Z0-9]+")
// const [matcher, paramNames] = compilePath(path);
// console.log(matcher, paramNames);
// const paramName = "/post/100/zs"
// const match = paramName.match(matcher);
// console.log(match);
// const values = match.slice(1);
// console.log(values);
// const params = paramNames.reduce((memo, paramName, index) => {
//   memo[paramName] = values[index];
//   return memo
// }, {});
// console.log(params)
