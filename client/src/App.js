
import React from "react";
import axios from "axios";
import "./App.css";
import {BrowserRouter as Router, Switch, Route, Link} from "react-router-dom";

class App extends React.Component{

  state = {
    data: null
  }

  componentDidMount(){
  axios.get("http://localhost:5000")
    .then((response) => {
      this.setState({
        data: response.data})
    })
    .catch((error) => {
      console.log(`Error fetching data: ${error}`)
    })
}
  render(){
    return(
      <Router>
      <div className="App">
      <header className="App-header">
      <h1>Good Things</h1>
      <ul>
        <li>
        <Link to ="/">Home</Link>
        </li>
         <li>
        <Link to ="/register">Register</Link>
        </li>
         <li>
        <Link to ="/login">Login</Link>
        </li>
      </ul>
      
      </header>
      {this.state.data}
    </div>
    </Router>
    );
  }
}

export default App;
