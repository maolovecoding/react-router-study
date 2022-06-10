/*
 * @Author: 毛毛
 * @Date: 2022-06-10 08:51:28
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-10 09:53:00
 */

export default function createBrowserHistory() {
  let state;
  let listeners = []; // 存放所有监听函数
  const globalHistory = window.history;
  function go(step) {
    globalHistory.go(step);
  }
  function goBack() {
    globalHistory.back();
  }
  function goForward() {
    globalHistory.forward();
  }
  /**
   * 添加或者跳转路径
   * @param {string|{pathname:string,state:object}} pathname
   * @param {*} nextState
   */
  function push(pathname, nextState) {
    const action = "PUSH";
    if (typeof pathname === "object") {
      state = pathname.state;
      pathname = pathname.pathname;
    } else {
      state = nextState;
    }
    globalHistory.pushState(state, null, pathname);
    notify({ location: { pathname, state }, action });
  }
  function listen(listener) {
    listeners.push(listener);
    // 返回值是一个取消监听的函数
    return () => {
      listeners = listeners.filter((item) => item !== listener);
    };
  }
  window.addEventListener("popstate", () => {
    const location = {
      pathname: window.location.pathname,
      state: globalHistory.state,
    };
    notify({ location, action: "POP" });
  });
  function notify(newState) {
    Object.assign(history, newState);
    history.length = globalHistory.length;
    console.log(history)
    listeners.forEach((listener) =>
      listener({ location: history.location, action: history.action })
    );
  }
  const history = {
    action: "POP",
    go,
    goBack,
    goForward,
    push,
    listen,
    location: {
      pathname: location.pathname,
      state: location.state,
    },
  };
  return history;
}
