import { useState } from 'react'
import './App.css'
import HomeAdmin from './pages/admin/homeAdmin/HomeAdmin'
import { BrowserRouter } from 'react-router-dom'
import AdminRouters from './routers/AdminRouters'
import NoelBackground from './components/NoelBackground'
import LayoutClient from './pages/client/LayoutClient'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <NoelBackground />
       <HomeAdmin />
       {/* <LayoutClient /> */}
    </>
    
  
    
  )
}

export default App
