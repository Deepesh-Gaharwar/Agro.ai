import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">

      <Navbar />

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      {/* <Footer /> */}
      
    </div>
  );
};

export default Layout;