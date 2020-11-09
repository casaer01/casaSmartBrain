// eslint-disable-next-line no-unused-vars
import { render } from '@testing-library/react';
import { Component } from 'react';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Signin from'./components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import Particles from 'react-particles-js';
import './App.css';
import Clarifai from 'clarifai';

const app = new Clarifai.App({
  apiKey: '417a4b450e3042dc90979d41d363adc0'
 });

const particlesOptions = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 900
      }
    }
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl:'',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id:'',
        name:'',
        email:'',
        entries: 0,
        joined:'',
      }
    }
  }

  loadUser = (data) => {
    this.setState({user:{
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  componentDidMount() {
    fetch('http://localhost:3000')
    .then(response => response.json())
    .then(console.log)
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace =  data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.leftCol * width,
      topRow: clarifaiFace.topRow * height,
      rightCol: width - (clarifaiFace.rightCol * width),
      bottomRow: height - (clarifaiFace.bottomRow * height),

    }
  }

  displayFaceBox = (box) => {
    this.setState({box:box});
  }

  onInputChange = (event) => {
    this.setState({input:event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
    app.models
      .predict(Clarifai.FACE_DETECT_MODEL,this.state.input)
      .then(response => {
        console.log('hi', response)
        if (response) {
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count}))
            })

        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout'){
      this.setState({isSignedIn: false})
    }else if (route === 'home') {
      this.setState({isSignedIn:true})
    }
    this.setState({route : route});
  }

  render(){ 
    return (
      <div className="App">
        <Particles params={particlesOptions} className='particles' />

        <Navigation isSignedIn={this.state.isSignedIn} onRouteChange={this.onRouteChange} />

        {this.state.route === 'home' 
        ? <div>
            <Logo />
            <Rank />
            <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit} />
            <FaceRecognition box={this.state.box} imageUrl={this.state.imageUrl} />
          </div>
        : (
          this.state.route === 'signin' 
          ? <Signin onRouteChange={this.onRouteChange}/>
          : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
        )
        }
      </div>
    );
  }
}
export default App;
