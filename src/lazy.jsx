import { useEffect, useState } from "react";
// 动态导入的实现
function lazy(dynamicImportComponent) {
  return function () {
    const [Component, setComponent] = useState(null);
    useEffect(() => {
      dynamicImportComponent().then((res) => {
        const LazyComponent = res.default;
        setComponent(LazyComponent);
      });
    }, []);
    return Component && <Component />;
  };
}
