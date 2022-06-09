# react-router

## 路由实现原理

- 不同的路径渲染不同的组件
- 有两种实现方式
  - HashRouter：利用hash实现路由切换
  - BrowserRouter：利用H5提供的API实现路由的切换

### hash原理

```html
<ul>
  <li><a href="#/a">a组件</a></li>
  <li><a href="#/b">b组件</a></li>
</ul>
<div id="root"></div>
<script>
  window.addEventListener("hashchange",(e)=>{
    const pathname = window.location.hash.slice(1);
    root.innerHTML = pathname
  })
</script>
```

### Browser 原理

- HTML5 提供了一个history接口
- 该接口有两个常用的方法 `history.pushState()`和`history.replaceState()`，以及window.onpopstate事件
- [history api](https://developer.mozilla.org/zh-CN/docs/Web/API/History/pushState)

```html
<ul>
  <li><a onclick="pushA()">a组件</a></li>
  <li><a onclick="pushB()">b组件</a></li>
  <li><a onclick="pushC()">c组件</a></li>
</ul>
<div id="root"></div>
<script>
  ((history) => {
    const pushState = history.pushState
    history.pushState = function (state, title, pathname) {
      const res = pushState.apply(history, arguments);
      if (typeof window.onpushstate === "function") {
        window.onpushstate(new CustomEvent("pushstate", { detail: { pathname, state } }))
      }
    }
    const replaceState = history.replaceState
    history.replaceState = function (state, title, pathname) {
      const res = replaceState.apply(history, arguments)
      if (typeof window.onreplacestate === "function") {
        window.onreplacestate(new CustomEvent("replaceState", { detail: { pathname, state } }))
      }
    }
  })(history)
  function pushA() {
    history.pushState({ name: "A" }, null, "/a")
  }
  function pushB() {
    history.pushState({ name: "B" }, null, "/b")
  }
  function pushC() {
    history.replaceState({ name: "C" }, null, "/c")
  }
  window.addEventListener("popstate", (e) => {
    console.log(e)
    root.innerHTML = e.state?.name
  })
  window.onpushstate = (e) => {
    console.log(e)
    root.innerHTML = e.detail.state?.name
  }
  window.onreplacestate = (e) => {
    console.log(e)
    root.innerHTML = e.detail.state.name
  }
</script>
```

### 安装react-router-dom

```shell
pnpm install react-router react-router-dom 
```

特点：

- `Switch`组件废弃了，在6.0中被Routes替代。
- Route组件的component属性废弃，需要使用element属性
- component属性传入的值是组件本身`{Home}`，而element组件传入的值是组件元素`{<Home/>}`
- render属性变成了element属性

### react-router-dom实现原理

react-router-dom的源码非常少，不到400行，其依赖了react-router库，该库大概1000行左右，react-router库依赖了history库，用来创建history和location等对象。

#### react-router的简单实现

```jsx
/*
 * @Author: 毛毛
 * @Date: 2022-06-09 16:24:33
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-09 19:55:04
 */
import { Children, createContext, useContext } from "react";
const NavigationContext = createContext();
const LocationContext = createContext();
const RouterContext = createContext();
/**
 * 路由容器
 * @param {*} children -> 子组件
 * @param {*} navigator -> history 历史对象
 * @param {*} location -> 地址对象 {pathname:当前路径}
 * @returns
 */
function Router({ children, navigator, location }) {
  return (
    <NavigationContext.Provider value={{ navigator }}>
      <LocationContext.Provider value={{ location }}>
        {children}
      </LocationContext.Provider>
    </NavigationContext.Provider>
  );
}
function Routes({ children }) {
  return useRoutes(createRoutesFromChildren(children));
}
/**
 * 就是个占位组件而已 实际没有任何作用
 * @param {*} props
 */
function Route(props) {}
/**
 * 返回当前的路径对象
 */
function useLocation() {
  console.log(useContext(LocationContext));
  return useContext(LocationContext).location;
}
/**
 * 把路径转换为正则表达式
 * @param {*} path
 */
function compilePath(path) {
  const regexpSource = `^${path}$`;
  return new RegExp(regexpSource);
}

/**
 * 判断此route对应的path路径是否和当前地址栏上的路径pathname匹配
 * @param {string} path
 * @param {string} pathname
 * @returns
 */
function matchPath(path, pathname) {
  const matcher = compilePath(path);
  const match = pathname.match(matcher);
  return match;
}

function useRoutes(routes) {
  // 当前的路径对象
  const location = useLocation();
  // 路径
  const pathname = location.pathname ?? "/";
  console.log(pathname, "-------");
  for (let i = 0; i < routes.length; i++) {
    const { element, path } = routes[i];
    const match = matchPath(path, pathname);
    if (match) return element;
  }
}

function createRoutesFromChildren(children) {
  const routes = [];
  Children.forEach(children, (child) => {
    const route = {
      path: child.props.path, // 路径
      element: child.props.element, // 渲染的元素 不是组件 <Home/>
    };
    routes.push(route);
  });
  return routes;
}

export { Router, Routes, Route };
```

#### react-router-dom的简单实现

```jsx
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
```
