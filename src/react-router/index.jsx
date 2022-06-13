/*
 * @Author: 毛毛
 * @Date: 2022-06-09 16:24:33
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-10 11:33:47
 */
import {
  Children,
  createContext,
  useContext,
  useCallback,
  useEffect,
  cloneElement,
} from "react";
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
  return useContext(LocationContext).location;
}

function useNavigate() {
  const navigator = useContext(NavigationContext).navigator;
  const navigate = useCallback(
    (to) => {
      navigator.push(to);
    },
    [navigator]
  );
  return navigate;
}
/**
 * 把路径转换为正则表达式
 * @param {string} path
 * @param {boolean} end 路径是否是最后一个
 */
function compilePath(path, end) {
  const paramNames = [];
  let regexpSource = `^${path
    // 开头没有斜杠 add -> /add  开头多个斜杠 ///add -> /add
    .replace(/^\/*/, "/")
    .replace(/:(\w+)/g, ($1, $2) => {
      paramNames.push($2);
      return "[^/]+";
    })}`;
  // /user/*
  if (path.endsWith("*")) {
    paramNames.push("*");
    // 出现 * 表示后面的内容 可以是 / 也可以是 /xxx
    regexpSource += "(?:/(.+)|/*)$";
  } else {
    // /user/*/add
    regexpSource += end ? "/*$" : "(?:\b|/|$)";
  }
  const matcher = new RegExp(regexpSource);
  return [matcher, paramNames];
}

/**
 * 判断当前地址栏上的路径pathname 是否和该正则匹配
 * @param {{path:string,end:boolean}} pattern
 * @param {string} pathname
 * @returns
 */
function matchPath(pattern, pathname) {
  const [matcher, paramNames] = compilePath(pattern.path, pattern.end);
  const match = pathname.match(matcher);
  if (!match) return null;
}
/**
 * 合并路径 将多个斜杠合并为一个完整路径
 * @param {*} paths
 * @returns
 */
function joinPaths(paths) {
  return paths.join("/").replace(/\/\/+/g, "/");
}
/**
 * 把路由数组打平为一维
 * @param {*} routes 可能是多维的路由数组
 * @param {*} branches 打平后的路由分支数组
 * @param {*} parentsMeta 父meta
 * @param {*} parentPath 父路径 字符串
 */
function flattenRoutes(
  routes,
  branches = [],
  parentsMeta = [],
  parentPath = ""
) {
  routes.forEach((route) => {
    const meta = {
      relativePath: route.path ?? "", // 相对路径
      route,
    };
    const path = joinPaths([parentPath, meta.relativePath]); // [/user/*, ""]
    const routesMeta = parentsMeta.concat(meta);
    // 有子路由 递归
    if (route.children?.length) {
      // [add, list, detail]
      // 自己的 routesMeta 会成为儿子们的parentsMeta 当前path 就是儿子们的父路径
      flattenRoutes(route.children, branches, routesMeta, path);
    }
    branches.push({
      path,
      routesMeta,
    });
  });
  return branches;
}
/**
 *
 * @param {*} routes
 * @param {*} location
 */
function matchRoutes(routes, location) {
  debugger
  // 获取路径名
  const { pathname } = location;
  // 打平路由 平铺 获取所有的路由分支 多维变一维
  const branches = flattenRoutes(routes);
  // 匹配结果
  let matches = null;
  for (let i = 0; matches === null && i < branches.length; i++) {
    // 匹配分支 和路径名
    matches = matchRoutesBranch(branches[i], pathname);
  }
  return matches;
}
/**
 * 匹配各个分支
 *  第一级 meta.relativePath /user/星/list
 *  第二级 list
 * @param {*} branch 分支
 * @param {*} pathname 路径名
 */
function matchRoutesBranch(branch, pathname) {
  console.log(branch, pathname);
  const { path, routesMeta } = branch;
  // 匹配的路径参数
  const matchedParams = {};
  // 默认匹配的路径 /
  let matchedPathname = "/";
  // 匹配结果
  const matches = [];
  const len = routesMeta.length;
  for (let i = 0; i < len; i++) {
    const meta = routesMeta[i];
    let end = i === len - 1; // 判断是否是最后一级的meta 最后的
    // 剩余路径名
    const remainingPathname =
      matchedPathname === "/"
        ? pathname
        : pathname.slice(matchedPathname.length);
    // 开始用正则进行匹配
    const match = matchPath(
      { path: meta.relativePath, end },
      remainingPathname
    );
    if (!match) return null;
    // /user/:id /add:name 合并父子路径参数
    Object.assign(matchedParams, match.params);
    const route = meta.route;
    matches.push({
      params: matchedParams, // 最终的路径参数对象
      pathname: joinPaths([matchedPathname, match.pathname]), // 完整的匹配路径
      pathnameBase: joinPaths([matchedPathname, match.pathnameBase]), // 类型父路径 或者说基本路径
      route,
    });
    if (match.pathnameBase) {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }
  return matches;
}
/**
 * 渲染 routes
 * @param {*} routes
 * @returns
 */
function useRoutes(routes) {
  // 当前的路径对象
  const location = useLocation();
  // 路径  /user/add
  const pathname = location.pathname ?? "/";
  // 把 routes 和 pathname进行匹配 获取匹配结果
  const matches = matchRoutes(routes, { pathname });
}
/**
 * 把Route组件的儿子们变成routes数组 如果路由有子元素 也要递归处理
 * @param {*} children
 * @returns
 */
function createRoutesFromChildren(children) {
  const routes = [];
  Children.forEach(children, (child) => {
    const route = {
      path: child.props.path, // 路径
      element: child.props.element, // 渲染的元素 不是组件 <Home/>
    };
    // 嵌套路由
    if (child.props.children) {
      route.children = createRoutesFromChildren(child.props.children);
    }
    routes.push(route);
  });
  return routes;
}

function Navigate({ to }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  });
}

function useParams() {
  // const { matches } = useContext(RouterContext);
  // const routeMatch = matches[matches.length - 1];
  // return routeMatch ? routeMatch.params : {};
}

export { Router, Routes, Route, useNavigate, useLocation, Navigate, useParams };
