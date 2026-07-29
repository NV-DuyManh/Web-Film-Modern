import { useContext, useState, Suspense } from 'react'
import { lazy } from 'react';
import './App.scss'
import { BrowserRouter } from 'react-router-dom'
import AdminRouters from './routers/AdminRouters'
import NoelBackground from './components/admin/noelBackground/NoelBackground'
import { AuthContext } from './contexts/AuthProvider'

const HomeAdmin = lazy(() => import('./pages/admin/homeAdmin/HomeAdmin'));
const LayoutClient = lazy(() => import('./pages/client/LayoutClient'));

import LoadingScreen from './components/client/loadingScreen/LoadingScreen';

const LoadingFallback = () => <LoadingScreen />;

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
