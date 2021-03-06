/**
 * Created by johnlu on 3/3/17.
 */

 /* The GameService is a STATE MACHINE that represents the current state of
    the game */

angular.module('expeditionApp')
.service('GameService', ['LandFactory', 'PlayerService', 'MapService', 'BuildingFactory', 
    function (LandFactory, PlayerService, MapService, BuildingFactory) {
    var LAND_CONSTRUCTION_DICTIONARY = {
        "grain": 4,
        "lumber": 4,
        "wool": 4,
        "ore": 3,
        "brick": 3,
        "desert": 1
    };
    this.NUM_HEXES_IN_ROW = [3, 4, 5, 4, 3];  // Helps with populating game map

    this.landsMatrix = [[],[],[],[],[]];   // Stores the lands in play for this game
    this.landsDictionary = {}   // Stores lands for later lookup
    this.playersDictionary = {};  // Player information as key, value pair <Color, PlayerObject>
    this.turnsOrder = []  // Array of player colors indicating turn order.

    /* STATES:
        0: INITIAL - players choose initial settlements and roads
        1: ACTIVE - Game is in session
        2: END 
    */
    this.STATE = -1;

    // Pointer to active player
    this.activePlayer = null;

    /* ================================ Observers ================================ */
    // Observers for activePlayer change.
    var activePlayerOberservers = [];
    this.registerActivePlayerObserver = function (observer) {
        activePlayerOberservers.push(observer);
    }

    // Observers for GAME STATE change
    var gameStateObservers = [];
    this.registerGameStateObserver = function (observer) {
        gameStateObservers.push(observer);
    }

    this.setGameState = function (state) {
        this.STATE = state;
        for (var i = 0; i < gameStateObservers.length; i++) {
            gameStateObservers[i].gameStateChanged(state);
        }
    }

    this.setActivePlayer = function (num) {
        this.activePlayer = this.turnsOrder[num];
        console.log("active player set to: " + this.turnsOrder[num].color);
        // Notify all observers
        for (var i = 0; i < activePlayerOberservers.length; i++) {
            activePlayerOberservers[i].updateActivePlayer(this.activePlayer);
        }
    }
    /* ============================== Game Creation ============================== */
    this.createRandomGame = function (numPlayers) {
        // Generate lands randomly for now. MODIFY
        this.generateLandsRandom();
        // Assign dice numbers to land
        this.assignLandDiceNumbersRandom();
        // Create players
    };

    this.generateLandsRandom = function () {
        // construct an array of lands
        var arrangement = [];
        for (var prop in LAND_CONSTRUCTION_DICTIONARY) {
            if (LAND_CONSTRUCTION_DICTIONARY.hasOwnProperty(prop)) {
                var numLandsForType = LAND_CONSTRUCTION_DICTIONARY[prop];
                for (var i = 0; i < numLandsForType; i++) {
                    arrangement.push(prop);
                }
            }
        }
        // Arrange Lands Randomly. Get a number randomly between 0 and 4 (inclusive)
        shuffle(arrangement);
        var idx = 0;
        var numRows = this.landsMatrix.length;
        for (var row = 0; row < numRows; row++) {
            var numCols = this.NUM_HEXES_IN_ROW[row];
            for (var col = 0; col < numCols; col++, idx++) {
                // Use Land Factory to create a land
                var newLand = LandFactory.createLand(arrangement[idx]);
                newLand.landID = "land" + idx.toString(); 

                // Store new land
                this.landsMatrix[row].push(newLand);
                this.landsDictionary[newLand.landID] = newLand; 
            }
        }
    }

    this.assignLandDiceNumbersRandom = function () {
        var possibleNumbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

        // Shuffle Dice Numbers
        shuffle(possibleNumbers);

        // Assign dice numbers to land 
        var idx = 0;
        for (var i = 0; i < this.landsMatrix.length; i++) {
            var numCols = this.NUM_HEXES_IN_ROW[i];
            for (var j = 0; j < numCols; j++) {
                var land = this.landsMatrix[i][j];
                if (land.type !== "desert") {
                    this.landsMatrix[i][j].diceNumber = possibleNumbers[idx++];
                }
            }
        }
    }

    this.getLandWithID = function (landID) {
        return this.landsDictionary[landID];
    }

    /* Helper - Shuffle function */
    function shuffle(array) {
        for (var i = 0; i < array.length; i++) {
            var randIndex = Math.floor(Math.random() * array.length);
            temp = array[randIndex];
            array[randIndex] = array[i];
            array[i] = temp;
        }
    }
    /* ============================== Map-related functions ============================== */
    this.addRoad = function (color, from, to) {
        var newRoad = BuildingFactory.createRoad(color, from, to);
        this.playersDictionary[color].addRoad(newRoad);

        MapService.addRoadToGraph(newRoad);

        return newRoad; // return road created
    }

    this.addBuilding = function (color, coordinates) {
        var newBuilding = BuildingFactory.createBuilding(color, coordinates);
        newBuilding.lands = MapService.getLandsForCoordinates(coordinates);

        // Add building to the player
        this.playersDictionary[color].addBuilding(newBuilding);

        // Add building to the graph
        MapService.addBuildingToGraph(newBuilding);


        return newBuilding;  // return the building created
    }

    this.roadExists = function (from, to) {
        return MapService.roadExistsAt(from, to);
    }

    this.buildingExists = function (coordinates) {
        return MapService.buildingExistsAt(coordinates);
    }

    this.initializeMap = function (lands) {
        MapService.initializeGraph(lands);
    }

    /* ============================ Player-related functions ============================= */
    this.diceRolled = function (diceResult) {
        for (var i = 0; i < this.turnsOrder.length; i++) {
            var player = this.turnsOrder[i];
            player.diceRolled(diceResult);
        }
    }

    // Checks if the game has been won. The game is over when any player's "victoryPoints" 
    // is 10 or above. 
    this.gameWon = function () {
        for (var i = 0; i < this.turnsOrder.length; i++) {
            if (this.playersDictionary[this.turnsOrder[i]].victoryPoints >= 10) {
                return true;
            }
        }
        return false;
    }

    // Take an array of players (color strings) and adds them into the game
    this.addPlayers = function (colorsArray) {
        for (var i = 0; i < colorsArray.length; i++) {
            this.addPlayer(colorsArray[i]);
            console.log("turnsOrder: " + this.turnsOrder);
        }
    }

    this.addPlayer = function (playerColor) {
        var newPlayer = PlayerService.createPlayer(playerColor);
        this.turnsOrder.push(newPlayer); 
        this.playersDictionary[playerColor] = newPlayer;

        return newPlayer;
    }

    this.getPlayerByColor = function (playerColor) {
        return this.playersDictionary[playerColor];
    }

    // This function returns the player whose turn number is "num"
    this.getPlayer = function (num) {
        return this.turnsOrder[0];  
    }

    this.getNumPlayers = function () {
        return this.turnsOrder.length;
    }

}]);