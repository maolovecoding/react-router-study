/*
 * @Author: 毛毛
 * @Date: 2022-06-09 16:24:36
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-10 09:26:29
 */
import { useRef, useState, useLayoutEffect } from "react";
import { Router, useNavigate, useLocation } from "../react-router";
import { createBrowserHistory, createHashHistory } from "../history";
export * from "../react-router";
/**
 * 一个Router 用在浏览器端 提供最干净的URL
 */
function BrowserRouter({ children }) {
  const historyRef = useRef(null);
  if (historyRef.current === null) {
    historyRef.current = createBrowserHistory();
  }
  const history = historyRef.current;
  const [state, setState] = useState({
    // 动作 POP PUSH
    action: history.action,
    // 路径
    location: history.location,
  });
  // 在DOM渲染前执行
  useLayoutEffect(() => history.listen(setState), [history]);
  return (
    <Router
      children={children}
      location={state.location}
      navigator={history}
      navigationType={state.action}
    />
  );
}
/**
 * 用在浏览器端的Router
 * 把路径保存在URL地址的hash部分，以便改变的时候 不会发送给服务器
 */
function HashRouter({ children }) {
  const historyRef = useRef(null);
  if (historyRef.current === null) {
    historyRef.current = createHashHistory();
  }
  const history = historyRef.current;
  const [state, setState] = useState({
    // 动作 POP PUSH
    action: history.action,
    // 路径
    location: history.location,
  });
  // 在DOM渲染前执行
  useLayoutEffect(() => history.listen(setState), [history]);
  return (
    <Router
      children={children}
      location={state.location}
      navigator={history}
      navigationType={state.action}
    />
  );
}

function Link({ to, ...rest }) {
  const navigate = useNavigate(); // history
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };
  return <a {...rest} href={to} onClick={handleClick}></a>;
}
function NavLink({
  to,
  className: classNameProp, // 类名 可能是字符串 也可能是函数
  end = false, // 是否结束 end为true表示当前路径结束了
  style: styleProp = {}, // 样式 可能是一个对象也可以是一个函数
  children,
  ...rest
}) {
  // 类名
  let className;
  let style;
  const location = useLocation();
  // 当前地址栏的实际路径
  const pathname = location.pathname;
  // 要匹配的路径
  const path = { pathname: to };
  const isActive =
    //1. pathname和to完全相等 激活
    pathname === to ||
    // 2. pathname以to路径开头 且pathname在包含to路径后的下一个字符是 / 且end为false 也需要激活
    (!end && pathname.startsWith(to) && pathname.charAt(to.length) === "/");
  // 类名
  if (typeof classNameProp === "function") {
    className = classNameProp({ isActive });
  } else {
    className = isActive ? classNameProp ?? "active" : "";
  }
  // 样式
  style = typeof styleProp === "function" ? styleProp({ isActive }) : styleProp;
  return (
    <Link className={className} style={style} to={to} {...rest}>
      {children}
    </Link>
  );
}

export { BrowserRouter, HashRouter, Link, NavLink };
