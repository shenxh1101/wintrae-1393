import { useState } from 'react'
import Layout from './components/Layout'
import Books from './pages/Books'
import Readers from './pages/Readers'
import Circulation from './pages/Circulation'
import Inventory from './pages/Inventory'
import Statistics from './pages/Statistics'

function App() {
  const [activeTab, setActiveTab] = useState('books')

  const renderContent = () => {
    switch (activeTab) {
      case 'books':
        return <Books />
      case 'readers':
        return <Readers />
      case 'circulation':
        return <Circulation />
      case 'inventory':
        return <Inventory />
      case 'statistics':
        return <Statistics />
      default:
        return <Books />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

export default App
