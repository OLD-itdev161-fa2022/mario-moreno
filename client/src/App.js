
import React from "react";
import './App.css';
import axios from "axios";

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
      <div className="App">
      <header className="App-header">
     Good Things
      </header>
      {this.state.data}
    </div>
    );
  }
}

export default App;
