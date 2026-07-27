import { useContext, useState, Suspense } from 'react'
import { lazy } from 'react';
import './App.scss'
import { BrowserRouter } from 'react-router-dom'
import AdminRouters from './routers/AdminRouters'
import NoelBackground from './components/admin/noelBackground/NoelBackground'
import { AuthContext } from './contexts/AuthProvider'

const HomeAdmin = lazy(() => import('./pages/admin/homeAdmin/HomeAdmin'));
const LayoutClient = lazy(() => import('./pages/client/LayoutClient'));

const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen w-full bg-[#111827]">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#facc15] border-r-[#facc15] rounded-full animate-spin drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-l-red-500 border-b-red-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse] drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
        </div>
    </div>
);

function App() {
  const { isLogin } = useContext(AuthContext);

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
      {
        isLogin?.role == "admin" ? <>  <NoelBackground />
          <HomeAdmin /></> : <LayoutClient />
      }
      </Suspense>
    </>



  )
}

export default App
