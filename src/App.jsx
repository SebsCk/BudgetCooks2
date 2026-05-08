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
import ForumPage from './pages/ForumPage'
import ShareRecipePage     from './pages/ShareRecipePage'
import RecipeCommentsPage  from './pages/RecipeCommentsPage'
import ProfilePage          from './pages/ProfilePage'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <ErrorBoundary>
        <Routes>
          <Route path="/"              element={<Home />}            />
          <Route path="/feed"          element={<FeedPage />}        />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/share"         element={<ShareRecipePage />} />
          <Route path="/challenges"    element={<ChallengesPage />}  />
          <Route path="/categories"    element={<CategoriesPage />}  />
          <Route path="/about"         element={<AboutPage />}       />
          <Route path="/login"         element={<Login />}           />
          <Route path="/signup"        element={<Signup />}          />
          <Route path="/admin"         element={<AdminDashboard />}  />
          <Route path="/shopping-list" element={<ShoppingList />}    />
          <Route path="/meal-planner"  element={<MealPlanner />}     />
          <Route path="/recipe/:id/comments" element={<RecipeCommentsPage />} />
          <Route path="/profile/:username"      element={<ProfilePage />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  )
}
