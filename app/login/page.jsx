import './page.css';

export default function LoginPage() {
  return (
    <div className="loginPage">
        
        <div className="loginBox">
            <h2>Login</h2>
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <button>Login</button>
        </div>
    </div>
  )
}