/*
 * @Author: 毛毛
 * @Date: 2022-06-10 08:51:30
 * @Last Modified by: 毛毛
 * @Last Modified time: 2022-06-10 10:03:56
 */

export default function createHashHistory() {
  const historyStack = [];
  let historyIndex = -1; // 指针
  let state;
  let action = "POP";
  let listeners = []; // 存放所有监听函数
  function go(step) {
    action = "POP";
    historyIndex += step;
    let nextLocation = historyStack[historyIndex];
    state = nextLocation.state;
    window.location.hash = nextLocation.pathname;
  }
  function goBack() {
    go(-1);
  }
  function goForward() {
    go(+1);
  }
  /**
   * 添加或者跳转路径
   * @param {string|{pathname:string,state:object}} pathname
   * @param {*} nextState
   */
  function push(pathname, nextState) {
    action = "PUSH";
    if (typeof pathname === "object") {
      state = pathname.state;
      pathname = pathname.pathname;
    } else {
      state = nextState;
    }
    window.location.hash = pathname;
  }
  // 修改hash后触发该事件
  const hashchangeHandler = (e) => {
    const pathname = window.location.hash.slice(1);
    Object.assign(history, { action, location: { pathname, state } });
    if (action === "PUSH") {
      historyStack[++historyIndex] = history.location;
    }
    listeners.forEach((listener) =>
      listener({ location: history.location, action: history.action })
    );
  };
  window.addEventListener("hashchange", hashchangeHandler);
  function listen(listener) {
    listeners.push(listener);
    // 返回值是一个取消监听的函数
    return () => {
      listeners = listeners.filter((item) => item !== listener);
    };
  }
  function notify(newState) {}
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
  if (window.history.hash) {
    action = "PUSH";
    hashchangeHandler();
  } else {
    window.location.hash = "/";
  }
  return history;
}
