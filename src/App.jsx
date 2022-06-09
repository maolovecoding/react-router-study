import { useState } from "react";
import { HashRouter, BrowserRouter, Route, Routes } from "./react-router-dom";

const User = () => {
  return <div>User</div>;
};
const Home = () => {
  return <div>Home</div>;
};
const Profile = () => {
  return <div>Profile</div>;
};
const Test = () => {
  return <div>Test</div>;
};
{/* <ul>
<li><a href="/">home</a></li>
<li><a href="/user">user</a></li>
<li><a href="/profile">profile</a></li>
<li><a href="/test">test</a></li>
</ul> */}
function App() {
  return (
    <div className="App">

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/user" element={<User />}></Route>
          <Route path="/profile" element={<Profile />}></Route>
          <Route path="/test" element={<Test />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
