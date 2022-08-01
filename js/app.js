// console.log('ok');

// recupero tasto play dal DOM
const play = document.querySelector("input[type='submit']");
// console.log(play);

// avvio il gioco al click
play.addEventListener('click', playGame);

// recupero statusImg
const statusImg = document.getElementById('statusImg');
// avvio il gioco al click
statusImg.addEventListener('click', playGame);
// recupero dove inserire numero di spazi liberi
const toRevealElement = document.getElementById('toReveal');
// recupero griglia dal DOM
let tableContainerElement = document.querySelector('.tableContainer');
// console.log(toRevealElement);
const bombsNumElement = document.getElementById('bombsNum');
// variabile globale contenente il numero di righe
let rowNum;
// variabile globale contenente la posizione delle bombe
let bombsArray = [];
// variabile globale contenente la griglia
let myGrid = [];
// variabile globale contenente la matrice
let matrix = [];
// recupero il flag button
const flagBtn = document.getElementById('flagBtn');
// variabile per lo scambio di flagBtn
let flag;

/****************************************************************
    funzione di avvio del gioco
****************************************************************/
function playGame() {
    // rivelo il contatore
    toRevealElement.classList.remove('d-none');

    // rimuovo dal DOM il wannaPlay
    document.getElementById("wannaPlay").style.display = "none";
    // reset status img
    statusImg.src = "img/smile.png";
    // console.dir(statusImg);


    // recupero difficoltà dal DOM
    rowNum = parseInt(document.querySelector('select').value);

    // controllo SE l'utente fa delle "furbate" con l'inspector
    if ((rowNum !== 10 && rowNum !== 14 && rowNum !== 22) || isNaN(rowNum)) {
        // imposto difficoltà massima
        rowNum = 22;
    }

    // implemento una modalità mobile che lavorerà sulla metà delle caselle ( per gestire meglio il layout)
    const mediaQuery = window.matchMedia('(min-width: 576px)')
    if (!mediaQuery.matches) {
        rowNum /= 2;
        document.getElementById('flagBtn').classList.remove('d-none');
    }

    // imposto lo stile in base alla difficoltà
    tableContainerElement.style.gridTemplateColumns = `repeat(${rowNum},1fr)`;

    // calcolo il numero di celle
    const cellsNum = rowNum ** 2;

    // TODO: avrei potuto fare direttamente la matrice?
    // creo la griglia in html
    myGrid = createGrid(cellsNum);
    // console.log(myGrid);

    let bombsNum = getBombsNum(rowNum);
    console.log(bombsNum);

    // metto nel DOM il numero di caselle libere
    bombsNumElement.innerHTML = cellsNum - bombsNum

    // genero un array di numeri random => posizioni delle bombe
    bombsArray = getBombsArray(bombsNum, cellsNum);
    // TODO: per vedere dove sono le bombe
    // console.log(bombsArray);

    // genero la matrice
    matrix = createMatrix(rowNum, myGrid);
    // console.log(matrix);

    // aggiungo il clickHandler a tutti gli elementi della griglia
    addHandler();

    // evento flag btn & reset
    flagBtn.innerHTML = "Flag &#9872;";
    flag = false;
    flagBtn.classList.remove('disabled');
    flagBtn.addEventListener('click', changeHandler);

}

/****************************************************************
    funzione che crea la griglia
****************************************************************/
function createGrid(dim) {
    // console.log(tableContainer.innerHTML);

    // creo l'array da ritornare
    const grid = [];
    // problema, anche svuotando gli event listner del gioco precedente rimangono attivi - problemi di performance dopo molti new game
    // => SE table container non è vuoto chiamo clearGame e svuoto
    if (tableContainerElement.innerHTML != '') {
        clearGame();
        tableContainerElement.innerHTML = '';
    }

    // PER OGNI ciclo genero un elemento html (square) e lo inserisco nel DOM
    for (let i = 0; i < dim; i++) {
        const cell = getSquareElement();

        // imposto un dataset da 0 a dim alle celle
        cell.dataset.myCell = i;

        //TODO: DA AGGIUNGERE PER CHEATTARE CON LA CONSOLE!!!
        // cell.innerHTML = i + 1;

        // appendo elemento al tabellone
        tableContainerElement.append(cell);
        // e lo inserisco nell'array grid
        grid.push(cell);
    }

    // ritorno la griglia grid
    return grid;
}

/****************************************************************
    funzione che crea l'elemento casella
****************************************************************/
function getSquareElement() {
    const square = document.createElement('div');
    square.classList.add('square');
    // aggancia evento click
    // square.addEventListener('click', clickHandler);
    return square;
}

/****************************************************************
    funzione che gestisce l'event reveal
****************************************************************/
function revealHandler() {
    // mi servono gli indici della matrice all'elemento che sto utilizzando
    let x;
    let y;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
            if (matrix[i][j] === this) {
                x = i;
                y = j;
                break;
            }
        }
    }

    // aggiungo classe clicked in ogni caso
    matrix[x][y].classList.toggle('clicked');

    // controllo se ho trovato una bomba
    if (bombsArray.includes(parseInt(matrix[x][y].dataset.myCell))) {
        statusImg.src = "img/sad.png"
        matrix[x][y].innerHTML = '&#128165;';
        matrix[x][y].classList.add('bomb');
        bombsNumElement.innerHTML = "Game over! :(";
        revealAll(matrix[x][y]);
        flagBtn.classList.add('disabled');
        clearGame();
    } else { // altrimenti svelo l'area adiacente senza bombe
        revealArea(x, y);
    }

    // dobbiamo far sì che una volta partita la funzione venga rimosso l'evento
    matrix[x][y].removeEventListener('click', revealHandler);
}

/****************************************************************
    funzione che rimuove gli eventi
****************************************************************/
function clearGame() {
    // so che se non è vuoto, tutti gli elementi avranno ALMENO la classe square
    const squareElements = document.querySelectorAll('.square');
    // console.log(squareElements.length);

    // PER OGNI elemento square, rimuovo l'evento click
    for (let i = 0; i < squareElements.length; i++) {
        squareElements[i].removeEventListener('click', revealHandler);
        squareElements[i].removeEventListener('click', flagHandler);
        // console.dir(squareElements[i]);
    }
}

/****************************************************************
    funzione che genera il numero di bombe presenti
****************************************************************/
const getBombsNum = (dim) => {
    switch (dim) {
        case 14:
            dim *= 2;
            break;
        case 22:
            dim *= 3;
            break;
        // versione mobile
        case 5:
            dim -= 2;
            break;
        case 11:
            dim += 4;
            break;
    }
    return dim;
}

/****************************************************************
    funzione che genera un array con la posizione delle bombe
****************************************************************/
const getBombsArray = (dim, num) => {
    const array = [];
    for (let i = 0; i < dim; i++) {
        array[i] = Math.floor(Math.random() * num);
        // SE elemento ripetuto, ripeto il ciclo decrementando i
        // TODO: trovata su internet, non so come funzioni...
        const uniqueBombs = array.filter(unique);
        if (array.length > uniqueBombs.length) {
            i--;
        }
    }
    return array;
}

/****************************************************************
    funzione di supporto al filtro per eliminare doppioni da un array
****************************************************************/
const unique = (value, index, self) => {
    return self.indexOf(value) === index;
}

/****************************************************************
    funzione che trasforma una griglia in una matrice
****************************************************************/
function createMatrix(row, grid) {
    const matrixX = [];
    let index = 0;
    for (let x = 0; x < row; x++) {
        const matrixY = [];
        for (let y = 0; y < row; y++) {
            matrixY[y] = grid[index++];
        }
        matrixX.push(matrixY);
    }
    return matrixX;
}

/****************************************************************
    funzione che aggiunge l'event reveal a tutti gli elementi
****************************************************************/
function addHandler() {
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix.length; y++) {
            if (!matrix[x][y].classList.contains('clicked')) {
                matrix[x][y].addEventListener('click', revealHandler);

                // TODO: try clickHandler.bind(matrix[x][y],matrix)

                // implemento la bandierina col click destro
                matrix[x][y].addEventListener('contextmenu', function (ev) {
                    ev.preventDefault();

                    if (!this.classList.contains('clicked')) {
                        if (this.innerHTML == '') {
                            this.innerHTML = '&#9873;';
                        } else {
                            this.innerHTML = '';
                        }
                    }
                    return false;
                }, false);
            }
        }
    }
}

/****************************************************************
    TODO:   FUNZIONI CHE LAVORANO SOLO SU MOBILE
****************************************************************/

/****************************************************************
    funzione che cambia l'handler reveal-flag
****************************************************************/
function changeHandler() {
    if (!flag) {
        clearGame();
        addFlagHandler();
        flagBtn.innerHTML = "Reveal";
        flag = true;
    }
    else {
        clearGame();
        addHandler();
        flagBtn.innerHTML = "Flag &#9872;";
        flag = false;
    }
}

/****************************************************************
    funzione che aggiunge l'event flag a tutti gli elementi
****************************************************************/
function addFlagHandler() {
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix.length; y++) {
            if (!matrix[x][y].classList.contains('clicked')) {
                matrix[x][y].addEventListener('click', flagHandler);
            }
        }
    }
}

/****************************************************************
    funzione che gestisce l'event flag
****************************************************************/
function flagHandler() {
    let x;
    let y;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
            if (matrix[i][j] === this) {
                x = i;
                y = j;
                break;
            }
        }
    }
    if (!matrix[x][y].classList.contains('clicked')) {
        if (matrix[x][y].innerHTML == '') {
            matrix[x][y].innerHTML = '&#9873;';
        } else {
            matrix[x][y].innerHTML = '';
        }
    }
}

/****************************************************************
    funzione che gestisce il rivelamento degli elementi adiacenti
****************************************************************/
function revealArea(x, y) {
    // inizializzo il contatore di bombe
    let counter = 0;
    // in ogni caso, se sto controllando, rivelo la casella
    matrix[x][y].classList.add('clicked');

    //decremento contatore celle da rivelare
    bombsNumElement.innerHTML -= 1;
    // SE arrivo a 0 => VITTORIA
    if (bombsNumElement.innerHTML == 0) {
        clearGame();
        statusImg.src = "img/cool.png";
        bombsNumElement.innerHTML = "Hai vinto!";
        revealAll(matrix);
    }

    // controllo a riga -1, riga e riga+1
    for (let i = x - 1; i <= x + 1; i++) {
        // SE l'indice esiste
        if (i >= 0 && i < matrix.length) {
            // controllo a colonna -1, colonna e colonna+1
            for (let j = y - 1; j <= y + 1; j++) {
                // SE l'indice esiste
                if (j >= 0 && j < matrix.length) {
                    // SE è una bomba
                    if (bombsArray.includes(parseInt(matrix[i][j].dataset.myCell))) {
                        // incremento il contatore di bombe
                        counter++;
                    }
                }
            }
        }
    }

    // in ogni caso inserisco il risultato del conteggio bombe adiacenti nella casella
    matrix[x][y].innerHTML = counter;

    // controllo a riga -1, riga e riga+1
    for (let i = x - 1; i <= x + 1; i++) {
        // SE l'indice esiste
        if (i >= 0 && i < matrix.length) {
            // controllo a colonna -1, colonna e colonna+1
            for (let j = y - 1; j <= y + 1; j++) {
                // SE l'indice esiste
                if (j >= 0 && j < matrix.length) {
                    // SE non è se stesso (altrimenti va in loop)
                    // E SE non contiente la classe clicked (loop di nuovo - cella già controllata)
                    if ((i !== x || j !== y) && !matrix[i][j].classList.contains('clicked')) {
                        // SE non ha bombe dintorno
                        if (counter === 0) {
                            revealArea(i, j)
                        }
                    }
                }
            }
        }
    }
}

/****************************************************************
    funzione che svela tutte le celle
****************************************************************/
function revealAll(explosion) {
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix.length; y++) {
            if (bombsArray.includes(parseInt(matrix[x][y].dataset.myCell))) {
                if (matrix[x][y] !== explosion) {
                    matrix[x][y].innerHTML = '&#128163';
                    matrix[x][y].classList.add('bomb')
                }
            }
            matrix[x][y].classList.add('clicked');
        }
    }
}