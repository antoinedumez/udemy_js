'use strict';

///////////////////////////////////////////////////////////////
// WORKOUT
///////////////////////////////////////////////////////////////
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, long]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  // helper
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
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

  calcPace() {
    //min/km
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

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
///////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
///////////////////////////////////////////////////////////////
class App {
  #map;
  #mapEvent;
  #workout = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _moveToPopup(e) {
    // if (!this.#map) return;
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workout.find(el => el.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not access geoloc');
        }
      );
  }
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
  }
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
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
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
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(ev) {
    // ---- HELPER
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    ev.preventDefault();

    // get datas from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

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
    this.#workout.push(workout);
    // render workout on map as marker
    this._renderWorkerMarker(workout);

    this._renderWorkout(workout);
    this._hideForm();
  }

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
}

const app = new App();
