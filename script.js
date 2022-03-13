import Grid from "./classes/Grid.js";
import Tile from "./classes/Tile.js";
import LocalStorageHelper from "./classes/LocalStorageHelper.js";

let localStorageHelper = new LocalStorageHelper();

const fullScreenBtn = document.getElementById('full-screen-btn');
const restartBtn = document.getElementById("restart-btn");
const bestScoreEl = document.getElementById("best-score");
const curentScoreEl = document.getElementById("curent-score");
const gameBoard = document.getElementById("game-board");

let grid = startGame(gameBoard);
restartBtn.addEventListener('click', () => {
    grid = startGame(gameBoard);
});

await addSwipeListeners();

fullScreenBtn.addEventListener('click', () => {
    document.querySelector('.for-full-screen').requestFullscreen();
})

async function addSwipeListeners(){
    window.addEventListener('swiped-left', async function (e) {
        if (canMoveLeft()) {
            await moveLeft();
            afterUserInput();
        }
    });
    window.addEventListener('swiped-right', async function (e) {
        if (canMoveRight()) {
            await moveRight();
            afterUserInput();
        }
    });
    window.addEventListener('swiped-up', async function (e) {
        if (canMoveUp()) {
            await moveUp();
            afterUserInput();
        }
    });
    window.addEventListener('swiped-down', async function (e) {
        if (canMoveDown()) {
            await moveDown();
            afterUserInput();
        }
    });
}

function startGame(gameBoard) {
    let bestScore = localStorageHelper.getBestScore();
    bestScoreEl.innerHTML = bestScore;
    curentScoreEl.innerHTML = '0';

    gameBoard.innerHTML = '';
    let grid = new Grid(gameBoard);

    grid.randomEmptyCell().tile = new Tile(gameBoard);
    grid.randomEmptyCell().tile = new Tile(gameBoard);
    setupInput();
    return grid;
}

function setupInput() {
    window.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(e) {
    switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
            if (!canMoveUp()) {
                setupInput();
                return;
            }
            await moveUp();
            break;
        case "arrowdown":
        case "s":
            if (!canMoveDown()) {
                setupInput();
                return;
            }
            await moveDown();
            break;
        case "arrowleft":
        case "a":
            if (!canMoveLeft()) {
                setupInput();
                return;
            }
            await moveLeft();
            break;
        case "arrowright":
        case "d":
            if (!canMoveRight()) {
                setupInput();
                return;
            }
            await moveRight();
            break;
        default:
            setupInput();
            return;
    }

    afterUserInput();
    setupInput();
}

function afterUserInput(){
    grid.cells.forEach(cell => cell.mergeTiles());

    const newTile = new Tile(gameBoard);
    grid.randomEmptyCell().tile = newTile;

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        newTile.waitForTransition(true).then(() => {
            let currentScore = grid.score();
            let bestScore = localStorageHelper.getBestScore();

            let obj = {};

            if (currentScore > bestScore) {
                localStorageHelper.saveBestScore(currentScore);
                obj.title = "Congratulations!";
                obj.text = `New best record: ${currentScore}`;
            } else if (currentScore == bestScore) {
                obj.title = "Almost!";
                obj.text = 'You almost broke your record';
            } else {
                obj.title = "Game Over!";
                obj.text = `You did: ${currentScore}<br>Your best score: ${bestScore}`;
            }

            Swal.fire({
                title: obj.title,
                confirmButtonText: 'Try again!',
                background: '#333',
                color: '#f3f3f3',
                confirmButtonColor: '#191414',
                html: obj.text
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Starting new game!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    grid = startGame(gameBoard);
                } else if (result.isDenied) {
                    Swal.fire('Changes are not saved', '', 'info')
                }
            })
        });
        return;
    }
    curentScoreEl.innerHTML = grid.score();
}

function moveUp() {
    return slideTiles(grid.cellsByColumn);
}

function moveDown() {
    return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()));
}

function moveLeft() {
    return slideTiles(grid.cellsByRow);
}

function moveRight() {
    return slideTiles(grid.cellsByRow.map(row => [...row].reverse()));
}

function slideTiles(cells) {
    return Promise.all(
        cells.flatMap(group => {
            const promises = [];
            for (let i = 1; i < group.length; i++) {
                const cell = group[i]
                if (cell.tile == null) continue
                let lastValidCell
                for (let j = i - 1; j >= 0; j--) {
                    const moveToCell = group[j]
                    if (!moveToCell.canAccept(cell.tile)) break
                    lastValidCell = moveToCell
                }

                if (lastValidCell != null) {
                    promises.push(cell.tile.waitForTransition())
                    if (lastValidCell.tile != null) {
                        lastValidCell.mergeTile = cell.tile
                    } else {
                        lastValidCell.tile = cell.tile
                    }
                    cell.tile = null
                }
            }
            return promises;
        })
    );
}

function canMoveUp() {
    return canMove(grid.cellsByColumn);
}

function canMoveDown() {
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()));
}

function canMoveLeft() {
    return canMove(grid.cellsByRow);
}

function canMoveRight() {
    return canMove(grid.cellsByRow.map(row => [...row].reverse()));
}

function canMove(cells) {
    return cells.some(group => {
        return group.some((cell, index) => {
            if (index == 0) return false;
            if (cell.tile == null) return false;
            const moveToCell = group[index - 1];
            return moveToCell.canAccept(cell.tile);
        })
    });
}