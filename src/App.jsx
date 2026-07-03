import { useContext, useState } from 'react'
import './App.scss'
import HomeAdmin from './pages/admin/homeAdmin/HomeAdmin'
import { BrowserRouter } from 'react-router-dom'
import AdminRouters from './routers/AdminRouters'
import NoelBackground from './components/NoelBackground'
import LayoutClient from './pages/client/LayoutClient'
import { AuthContext } from './contexts/AuthProvider'

function App() {
  const { isLogin } = useContext(AuthContext);

  return (
    <>
      {
        isLogin?.role == "admin" ? <>  <NoelBackground />
          <HomeAdmin /></> : <LayoutClient />
      }
    </>



  )
}

export default App
