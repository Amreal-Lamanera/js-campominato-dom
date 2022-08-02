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
// recupero il timer wrapper
let timerWrapperElement = document.getElementById('timer-wrapper');
// recupero il timer
let timerElement = document.getElementById('timer');
// variabile per tenere il tempo
let timer = 0;
// riferimento al timer
let timerIntervalRef;
// variabile contenente il coefficiente di difficoltà
let coefDiff;

/****************************************************************
    funzione di avvio del gioco
****************************************************************/
function playGame() {
    // rivelo il contatore
    toRevealElement.classList.remove('d-none');

    // rivelo il timer
    timerWrapperElement.classList.remove('d-none');

    // reset del timer in caso di riavvio
    timerStop();
    timer = 0;
    timerElement.innerHTML = '00:00:00'
    // avvio il timer
    timerStart();

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

    coefDiff = 1
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
    funzione che avvia il timer
****************************************************************/
const timerStart = () => {
    // if (timerIntervalRef) {
    //     console.log('timer già attivo');
    //     // interrompo e non faccio niente
    //     return
    // }
    timerIntervalRef = setInterval(() => {
        timer++;
        // console.log(timer);
        timerElement.innerHTML = formatTime(timer);
    }, 1000);
}

/****************************************************************
    funzione che blocca il timer e genera il punteggio
****************************************************************/
// il timer verrà bloccato SOLO in caso di vittoria o di sconfitta
const timerStop = () => {
    clearInterval(timerIntervalRef);
}

/****************************************************************
    funzione per la formattazione del time nel DOM
****************************************************************/
const formatTime = (secs) => {
    const pad = (n) => n < 10 ? `0${n}` : n;

    const h = Math.floor(secs / 3600);
    const m = Math.floor(secs / 60) - (h * 60);
    const s = Math.floor(secs - h * 3600 - m * 60);

    return `${pad(h)}:${pad(m)}:${pad(s)}`;
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
    funzione che ritorna true se l'elemento è una bomba
****************************************************************/
function isBomb(elem) {
    const num = parseInt(elem.dataset.myCell);
    return bombsArray.includes(num);
}

/****************************************************************
    funzione che genera il numero di bombe presenti
****************************************************************/
const getBombsNum = (dim) => {
    switch (dim) {
        case 14:
            coefDiff = 2;
            dim *= 2;
            break;
        case 22:
            coefDiff = 4;
            dim *= 3;
            break;
        // versione mobile
        case 5:
            coefDiff = 0.5;
            dim -= 2;
            break;
        case 11:
            coefDiff = 3;
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
    // PER OGNI riga
    for (let x = 0; x < matrix.length; x++) {
        //PER OGNI colonna
        for (let y = 0; y < matrix.length; y++) {
            // SE l'elemento non è già stato rivelato
            if (!matrix[x][y].classList.contains('clicked')) {
                // aggiungo l'event listener reveal
                matrix[x][y].addEventListener('click', revealHandler);

                // TODO: try clickHandler.bind(matrix[x][y],matrix)

                // implemento la bandierina col click destro - versione deskop
                matrix[x][y].addEventListener('contextmenu', function (ev) {
                    // rimuovo il comportamento di default del click destro
                    ev.preventDefault();

                    // TODO: perché devo ripetere questo if?
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
    if (isBomb(matrix[x][y])) {
        gameOver(matrix[x][y]);
    } else { // altrimenti svelo l'area adiacente senza bombe
        revealArea(x, y);
    }

    // rimuovo l'evento reveal all'elemento cliccato
    matrix[x][y].removeEventListener('click', revealHandler);
}


/****************************************************************
    funzione che gestisce il rivelamento degli elementi adiacenti
****************************************************************/
function revealArea(x, y) {
    //decremento contatore celle da rivelare
    bombsNumElement.innerHTML -= 1;
    // SE arrivo a 0 => VITTORIA
    if (bombsNumElement.innerHTML == 0) {
        youWin();
    }

    // inizializzo il contatore di bombe
    let counter = 0;
    // in ogni caso, se sto controllando, rivelo la casella
    matrix[x][y].classList.add('clicked');

    // controllo a riga -1, riga e riga+1
    for (let i = x - 1; i <= x + 1; i++) {
        // SE l'indice esiste
        if (i >= 0 && i < matrix.length) {
            // controllo a colonna -1, colonna e colonna+1
            for (let j = y - 1; j <= y + 1; j++) {
                // SE l'indice esiste
                if (j >= 0 && j < matrix.length) {
                    // SE è una bomba
                    if (isBomb(matrix[i][j])) {
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
 funzione che gestisce la vittoria
****************************************************************/
function youWin() {
    timerStop();
    clearGame();
    statusImg.src = "img/cool.png";
    bombsNumElement.innerHTML = "Hai vinto! <br> Hai totalizzato: " + calcResult() + " punti";
    revealAll();
}

/****************************************************************
    funzione che gestisce il game over
****************************************************************/
function gameOver(elem) {
    timerStop();
    bombsNumElement.innerHTML = "Game over! <br> Hai totalizzato: " + calcResult() + " punti";
    statusImg.src = "img/sad.png"
    elem.innerHTML = '&#128165;';
    elem.classList.add('bomb');
    revealAll(elem);
    flagBtn.classList.add('disabled');
    clearGame();
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
 funzione che svela tutte le celle
 ****************************************************************/
function revealAll(explosion) {
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix.length; y++) {
            if (isBomb(matrix[x][y])) {
                if (matrix[x][y] !== explosion) {
                    matrix[x][y].innerHTML = '&#128163';
                    matrix[x][y].classList.add('bomb')
                }
            }
            matrix[x][y].classList.add('clicked');
        }
    }
}

/****************************************************************
 funzione che calcola il risultato finale
 ****************************************************************/
function calcResult() {
    let result;
    console.log(rowNum);
    console.log(bombsArray.length);
    console.log(parseInt(bombsNumElement.innerHTML));
    console.log(coefDiff);
    console.log(timer);
    let revealedCells = (rowNum ** 2 - bombsArray.length) - parseInt(bombsNumElement.innerHTML)

    // punteggio: celle rivelate * coefficiente - tempo impiegato
    result = Math.floor((revealedCells * coefDiff) - timer / 4);

    // bonus vittoria
    if (parseInt(bombsNumElement.innerHTML) === 0) {
        result += 30;
    }

    if (result < 0) {
        result = 0;
    }

    return result;
}

/****************************************************************
    TODO:   FUNZIONI CHE LAVORANO SOLO SU MOBILE
****************************************************************/

/****************************************************************
    funzione che cambia l'handler reveal-flag
****************************************************************/
function changeHandler() {
    // SE flag è false => sono nello stato di reveal
    if (!flag) {
        // rimuovo gli event listener
        clearGame();
        // chiamo la funzione che aggiunge l'evento flag agli elementi
        addFlagHandler();
        // cambio testo nel pulsante
        flagBtn.innerHTML = "Reveal";
        // cambio lo stato di flag => adesso sono nello stato di flag
        flag = true;
    }
    else { // ALTRIMENTI (sono nello stato di flag)
        // rimuovo gli event listener
        clearGame();
        // chiamo la funzione che aggiunge l'evento reveal agli elementi
        addHandler();
        // cambio testo nel pulsante
        flagBtn.innerHTML = "Flag &#9872;";
        // cambio lo stato di flag => adesso sono nello stato di reveal
        flag = false;
    }
}

/****************************************************************
    funzione che aggiunge l'event flag a tutti gli elementi
****************************************************************/
function addFlagHandler() {
    // PER OGNI riga
    for (let x = 0; x < matrix.length; x++) {
        // PER OGNI colonna
        for (let y = 0; y < matrix.length; y++) {
            // SE l'elemento non è stato rivelato
            if (!matrix[x][y].classList.contains('clicked')) {
                // aggiungp l'event listener flagHandler
                matrix[x][y].addEventListener('click', flagHandler);
            }
        }
    }
}

/****************************************************************
    funzione che gestisce l'event flag
****************************************************************/
function flagHandler() {
    // cerco gli indici della matrice dell'elemento che è stato cliccato
    let x;
    let y;

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
            if (matrix[i][j] === this) {
                x = i;
                y = j;
                break; // al ritrovamento degli indici interrompo il ciclo
            }
        }
    }
    // SE l'elemento cliccato non è già stato rivelato
    if (!matrix[x][y].classList.contains('clicked')) {
        // SE è vuoto
        if (matrix[x][y].innerHTML == '') {
            // metto la bandierina
            matrix[x][y].innerHTML = '&#9873;';
        } else { // ALTRIMENTI (se ha la bandierina)
            // svuoto il contenuto
            matrix[x][y].innerHTML = '';
        }
    }
}
