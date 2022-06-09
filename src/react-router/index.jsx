/*
 * @Author: 毛毛
 * @Date: 2022-06-09 16:24:33
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-09 19:51:35
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
