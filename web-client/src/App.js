import logo from './logo.svg';
import './App.css';
import {
    GoogleOAuthProvider,
    useGoogleOneTapLogin
} from '@react-oauth/google';


function App() {
    return (
        <GoogleOAuthProvider clientId="891834389250-gl91er24vf148f2aau68manfekkkgme0.apps.googleusercontent.com">
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <p>
                        Edit <code>src/App.js</code> and save to reload.
                    </p>
                    <a
                        className="App-link"
                        href="https://reactjs.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn React
                    </a>
                    <GoogleOneTap/>
                    <button onClick={() => window.location.reload()}>Sign out</button>
                </header>
            </div>
        </GoogleOAuthProvider>
    );
}

function GoogleOneTap() {
    useGoogleOneTapLogin({
        onSuccess: credentialResponse => {
            console.log(credentialResponse);
        },
        onError: () => {
            console.log('Login Failed');
        },
    });
    return (<div></div>)
}
export default App;
