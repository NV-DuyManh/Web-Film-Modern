import { useContext, useState, Suspense } from 'react'
import './App.scss'
import { BrowserRouter } from 'react-router-dom'
import AdminRouters from './routers/AdminRouters'
import NoelBackground from './components/admin/noelBackground/NoelBackground'
import { AuthContext } from './contexts/AuthProvider'
import LoadingScreen from './components/client/loadingScreen/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import lazyRetry from './utils/lazyRetry';

const HomeAdmin = lazyRetry(() => import('./pages/admin/homeAdmin/HomeAdmin'));
const LayoutClient = lazyRetry(() => import('./pages/client/LayoutClient'));

const LoadingFallback = () => (
    <div className="fixed inset-0 z-99999 bg-[#06060e] flex justify-center items-center">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#0ea5e9] border-r-[#0ea5e9] rounded-full animate-spin drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-l-purple-500 border-b-purple-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse] drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
        </div>
    </div>
);

function App() {
  const { isLogin } = useContext(AuthContext);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
        {
          isLogin?.role == "admin" ? <>  <NoelBackground />
            <HomeAdmin /></> : <LayoutClient />
        }
        </Suspense>
      </ErrorBoundary>
    </>



  )
}

export default App
