// Handles all map interactions

angular.module('expeditionApp')
.controller('MapController', ['$scope','GameService', function ($scope, GameService, MapService) {

	// Assign coordinates to lands.
    GameService.initializeMap(GameService.landsMatrix);

	$scope.landsArray = GameService.landsMatrix;
    $scope.landsDictionary = GameService.landsDictionary;

	$scope.selectedLandWithID = function (landID) {
        console.log(landID + "selected (from MapController)");
        var landSelected = $scope.landsDictionary[landID];

        // Update Game Service State
        $scope.$parent.lastLandSelected = landSelected;

        $scope.$parent.activeControlPanel = 1;
    }   
}]);