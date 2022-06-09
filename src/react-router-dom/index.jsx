/*
 * @Author: 毛毛
 * @Date: 2022-06-09 16:24:36
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-09 18:47:32
 */
import { useRef, useState, useLayoutEffect } from "react";
import { Router } from "../react-router";
import { createBrowserHistory, createHashHistory } from "history";
export * from "../react-router";
/**
 * 一个Router 用在浏览器端 提供最干净的URL
 */
function BrowserRouter({ children }) {
  const historyRef = useRef(null);
  if (historyRef.current === null) {
    historyRef.current = createBrowserHistory();
    console.log(historyRef)
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
export { BrowserRouter, HashRouter };
