list = document.querySelectorAll("img[alt='red_arrow']");


  for (let pas = 0; pas < 5; pas++) {
  
    for (el of list) {
      if (el.src === "https://app.soan-test.net/static/media/red-arrow.54df3ecf.png" )
      {
        let expr = el.style.transform;
        switch (expr) {
          case '':
            console.log('gauche');
            dispatchEvent(new KeyboardEvent('keypress', {'key': 'q'}));
            break;
          case 'rotate(180deg)':
            console.log('droite');
            dispatchEvent(new KeyboardEvent('keypress', {'key': 'd'}));
            break;
          case 'rotate(90deg)':
            console.log('haut');
            dispatchEvent(new KeyboardEvent('keypress', {'key': 'z'}));
            break;
          case 'rotate(-90deg)':
            console.log('bas');
            dispatchEvent(new KeyboardEvent('keypress', {'key': 's'}));
            break;
          default:
            console.log(`Try again noob !`);
        }
      }
    }
  }