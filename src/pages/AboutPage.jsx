import styles from './AboutPage.module.css'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1>About BudgetCooks</h1>
        <p>A community for Filipinos who love good food without breaking the bank.</p>
      </div>

      <div className="container">
        <div className={styles.content}>

          <section className={styles.section}>
            <h2>🍳 What is BudgetCooks?</h2>
            <p>BudgetCooks is a Filipino community recipe forum where everyday cooks share affordable, delicious meals. Whether you're feeding a family of six on ₱100 or trying to meal prep on a student budget, you'll find real recipes from real people here.</p>
          </section>

          <section className={styles.section}>
            <h2>🏆 Challenges</h2>
            <p>We run community cooking challenges where members compete to create the best meals under a budget limit. Winners get featured on the home page and earn bragging rights as a Top Cook!</p>
          </section>

          <section className={styles.section}>
            <h2>👨‍🍳 Who can join?</h2>
            <p>Everyone! Sign up for free and start sharing your recipes, joining challenges, and commenting on your favorites. Admins help moderate content and manage the community.</p>
          </section>

          <div className={styles.cta}>
            <h3>Ready to join?</h3>
            <div className={styles.ctaBtns}>
              <Link to="/signup" className="btn btn-primary">Sign up for free</Link>
              <Link to="/feed" className="btn btn-outline" style={{color:'var(--terra)',borderColor:'var(--terra)'}}>Browse Recipes</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
