'use strict';

///////////////////////////////////////////////////////////////
// QUERY SELECTOR
///////////////////////////////////////////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
///////////////////////////////////////////////////////////////
// WORKOUT
///////////////////////////////////////////////////////////////
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  // prettier-ignore
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, long]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  // Set the workout description
  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      this.months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
///////////////////////////////////////////////////////////////
// RUNNING
///////////////////////////////////////////////////////////////
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.type = 'running';
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  // Calculate the pace (duration / distance)
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
///////////////////////////////////////////////////////////////
// CYCLING
///////////////////////////////////////////////////////////////
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.type = 'cycling';
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  // calculate the speed (distance / duration)
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
///////////////////////////////////////////////////////////////
class App {
  // private propertys with  #, only inside the class
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user position
    this._getPosition();
    // Get datas from loca storage
    this._getLocalStorage();
    // Attach event listener
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  // move the view (on the map) to the clicked list workout
  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(el => el.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  // Get the current position with the navigator
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not access geoloc');
        }
      );
  }
  // create the view of the map, rtfm leaflet
  _loadMap(position) {
    //set constants
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coord = [latitude, longitude];
    // set variables
    this.#map = L.map('map').setView(coord, 13);
    // display the map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // set current position
    this._setCurrentPosition(latitude, longitude);
    // add event listener
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkerMarker(work);
    });
  }
  // When click on the map, show the form to add a new workout
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  // set the current position and add a marker on the map, rtfm
  _setCurrentPosition(latitude, longitude) {
    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          content: 'Yeah Ha.<br> Here I am !',
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .openPopup();
  }
  // When submit a new workout
  _newWorkout(ev) {
    ev.preventDefault();
    // helper
    let workout;
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    // get datas from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    // check datas are valids
    // if wourkout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs doit être un nombre positif');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if wourkout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs doit être un nombre positif');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new objetc to workout array
    this.#workouts.push(workout);
    // render workout on map as marker
    this._renderWorkerMarker(workout);
    // rendre workout in the left list
    this._renderWorkout(workout);
    // hide the form
    this._hideForm();
    // store workouts in the local storage
    this._setLocalStorage();
  }
  // add a new marker on the map
  _renderWorkerMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          content: `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} bitch !`,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .openPopup();
  }
  // add a new workout in the list
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;
    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;
    form.insertAdjacentHTML('afterend', html);
  }
  // when the workout is added, hide the form
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    inputType.value = 'running';
    inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    inputElevation.closest('.form__row').classList.add('form__row--hidden');
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  // store workouts in the local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  // change the form when you choose cycling or running
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  // get local storage datas
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
// launch the app 🚀
const app = new App();
