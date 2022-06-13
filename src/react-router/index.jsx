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
const RouterContext = createContext({
  outlet: null,
  matches: [],
});
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
  const routes = createRoutesFromChildren(children);
  return useRoutes(routes);
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
 * @param {boolean} end 路径是否是最后一个 立即结束
 */
function compilePath(path, end) {
  const paramNames = [];
  let regexpSource = `^${path
    // /user/* -> /user
    .replace(/^\/*\*?$/, "")
    // 开头没有斜杠 add -> /add  开头多个斜杠 ///add -> /add
    .replace(/^\/*/, "/")
    .replace(/:(\w+)/g, ($1, $2) => {
      paramNames.push($2);
      return "([^/]+)";
    })}`;
  // /user/*
  if (path.endsWith("*")) {
    paramNames.push("*");
    // 出现 * 表示后面的内容 可以是 / 也可以是 /xxx
    regexpSource += "(?:/(.+)|/*)$";
  } else {
    // /user
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
  // 获取当前匹配的路径
  const matchedPathname = match[0]; // /user
  // 基准路径名 如果结尾有 / 会被去掉
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  // 获取后面分组的值 也就是匹配到的分组路径 * 会匹配所有的
  const values = match.slice(1);
  // 获取捕获的分组
  const captureGroups = match.slice(1);
  // 获取路径参数
  const params = paramNames.reduce((memo, paramName, index) => {
    if (paramName === "*") {
      const value = captureGroups[index];
      // 重新计算 pathnameBase /user/* -> /user/add/ddd   pathnameBase拿到的就是 /user
      pathnameBase = matchedPathname
        .slice(0, matchedPathname.length - value.length)
        .replace(/(.)\/+$/, "$1");
    }
    memo[paramName] = values[index];
    return memo;
  }, {});
  return {
    params,
    pathname: matchedPathname, // 自己匹配到的完整路径
    pathnameBase, // 匹配子路由的基路径
    pattern,
  };
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
  routes.forEach((route, index) => {
    const meta = {
      relativePath: route.path ?? "", // 相对路径
      route,
      childrenIndex: route.index,
    };
    const path = joinPaths([parentPath, meta.relativePath]); // [/user/*, ""]
    const routesMeta = parentsMeta.concat(meta);
    // 有子路由 递归
    if (route.children?.length) {
      // [add, list, detail]
      // 自己的 routesMeta 会成为儿子们的parentsMeta 当前path 就是儿子们的父路径
      flattenRoutes(route.children, branches, routesMeta, path);
    }
    // 添加到分支数组
    branches.push({
      path, // 代表此分支路径
      routesMeta, // 代表meta的数组
      score: computeScope(path, route.index), // 计算分支权重 给每个分支一个分数 后面按照分数对分支倒叙排序
    });
  });
  return branches;
}
const splatPenalty = -2; // 路径中 有 * 则权重减二
const indexRouteValue = 2;
const paramRegExp = /^:\w+$/; // 路径参数
const dynamicSegmentValue = 3;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const isSplat = (s) => s === "*";
/**
 *
 * @param {*} path
 * @param {*} index
 */
function computeScope(path, index) {
  // /user/add  -> ["", "user","add"]
  const segments = path.split("/");
  // 初始分数
  let initialScope = segments.length;
  if (segments.some(isSplat)) {
    initialScope -= splatPenalty;
  }
  if (typeof index !== "undefined") {
    initialScope += indexRouteValue;
  }
  // 过滤掉 *  /user/* ["", "user","*"] -> ["","user"]
  return segments
    .filter((s) => !isSplat(s))
    .reduce((scope, segment) => {
      let currScope = 0;
      // 是否是路径参数
      if (paramRegExp.test(segment)) {
        currScope += dynamicSegmentValue;
      } else {
        if (segment === "") {
          currScope += emptySegmentValue;
        } else {
          currScope += staticSegmentValue;
        }
      }
      return (scope += currScope);
    }, initialScope);
}
/**
 *
 * @param {Array} branches
 */
function rankRouteBranches(branches) {
  console.log(branches)
  return branches.sort((a, b) => {
    if (a.score === b.score) {
      // 比较索引 大的排前面
      return compareIndex(
        a.routesMeta.map((meta) => meta.childrenIndex),
        b.routesMeta.map((meta) => meta.childrenIndex)
      );
    } else {
      // 降序排列
      return b.score - a.score;
    }
  });
}
/**
 * 比较 index的大小 index大的权重大
 * @param {Array} a
 * @param {Array} b
 * @returns
 */
function compareIndex(a, b) {
  // a b 长度一致 并且两个数组（除了最后一项）对应位置的值全都相等 说明 a 和 b 是兄弟（路由是兄弟，同一个父路由）
  const siblings =
    a.length === b.length &&
    a.slice(0, -1).every((value, index) => value === b[index]);
  // 是兄弟 就比较自己的 index大小 不是兄弟 就无所谓顺序了
    return siblings ? b[b.length - 1] - a[a.length - 1] : 0;
}
/**
 * 用路由配置 去匹配真正的路径
 * @param {*} routes 路由配置
 * @param {*} location 当前浏览器的路径对象
 */
function matchRoutes(routes, location) {
  // 获取路径名
  const { pathname } = location;
  // 打平路由 平铺 获取所有的路由分支 多维变一维
  const branches = flattenRoutes(routes);
  // 按照权重排序 分支路由
  rankRouteBranches(branches);
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
  // 获取当前分支的meta数组
  const { routesMeta } = branch;
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
  return _renderMatches(matches);
}
/**
 * 渲染匹配路由
 * @param {*} matches
 */
function _renderMatches(matches) {
  if (matches === null) return matches;
  return matches.reduceRight((outlet, match, index) => {
    return (
      <RouterContext.Provider
        value={{
          outlet,
          // /user 0-1 /user/add 0-2
          matches: matches.slice(0, index + 1),
        }}
      >
        {match.route.element}
      </RouterContext.Provider>
    );
  }, null);
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
      index: child.props.index,
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
  const { matches } = useContext(RouterContext);
  // 找到最后一个匹配
  const routeMatch = matches[matches.length - 1];
  // 返回匹配结果中的路径参数对象
  return routeMatch ? routeMatch.params : {};
}

function Outlet() {
  return useOutlet();
}

function useOutlet() {
  return useContext(RouterContext).outlet;
}

export {
  Router,
  Routes,
  Route,
  useRoutes,
  useNavigate,
  useLocation,
  Navigate,
  useParams,
  Outlet,
  useOutlet,
};
