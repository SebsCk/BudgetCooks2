import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }    from './context/AuthContext'
import Navbar              from './components/layout/Navbar'
import Home                from './pages/Home'
import Login               from './pages/Login'
import Signup              from './pages/Signup'
import AdminDashboard      from './pages/AdminDashboard'
import ShoppingList        from './pages/ShoppingList'
import MealPlanner         from './pages/MealPlanner'
import FeedPage            from './pages/FeedPage'
import ChallengesPage      from './pages/ChallengesPage'
import CategoriesPage      from './pages/CategoriesPage'
import AboutPage           from './pages/AboutPage'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"              element={<Home />}            />
          <Route path="/feed"          element={<FeedPage />}        />
          <Route path="/challenges"    element={<ChallengesPage />}  />
          <Route path="/categories"    element={<CategoriesPage />}  />
          <Route path="/about"         element={<AboutPage />}       />
          <Route path="/login"         element={<Login />}           />
          <Route path="/signup"        element={<Signup />}          />
          <Route path="/admin"         element={<AdminDashboard />}  />
          <Route path="/shopping-list" element={<ShoppingList />}    />
          <Route path="/meal-planner"  element={<MealPlanner />}     />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
