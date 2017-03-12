
/* This will hand all of the drawing for the application. Including:
	-- Hexagons for the land
	-- Logic for piecing together the tiles
	-- Placement of Settlements, Cities, and Roads
	-- Moving the Robber
    -- Keep track of Map State.
        -- Use a Graph for storing hex verticies and edges. 
*/

angular.module('expeditionApp')
.service('MapService', ['MapGraphService', function(MapGraphService) {
	
	// Constants used for calculating hex coordinates
    const HEX_WIDTH = 160;
    const HEX_HEIGHT = 160;
    const ROW_OFFSET = (HEX_WIDTH / 2);
    const MID_ROW_IDX = 2;
    const VERT_GAP_CLOSE = 40; 
    

    /* ---------------------- Interaction with MapGraphService ----------------------- */
    this.addRoadToGraph = function (road) {
        MapGraphService.setEdge(road.color, road.from, road.to);
    }

    this.addBuildingToGraph = function (building) {
        MapGraphService.setVertex(building.color, building.type, building.location);
    }

    // Checks if a road has already been built at the specified location
    this.roadExistsAt = function (from, to) {
        // Edge color initlized to null. Changed when road is built
        return MapGraphService.getEdgeColor(from, to) != null;
    }

    this.buildingExistsAt = function (coord) {
        // vertex.type is initialized to null and changed when settlement is built.
        var vertex = MapGraphService.getVertex(coord);
        return vertex.type != null;
    }

    // This function adds all verticies found in the parameter lands matrix
    this.addAllVerticiesInHexToGraph = function (hexCoordinates) {
        for (var coordLabel in hexCoordinates) {
            if (hexCoordinates.hasOwnProperty(coordLabel)) {
                console.log("Adding vertex: " + coordLabel + ": " + hexCoordinates[coordLabel]);
                var coord = hexCoordinates[coordLabel];  // coordLabel is A, B, C . . . or F
                MapGraphService.addVertex(coord);  // coord is [x,y] coordinates
            }
        }
    }

    // This function forms edges out of all hexagonal points and adds them to the
    // map graph. That is, every hexagon will generate 6 edges and be added to the
    // graph. However, duplicate edges will not be added. NOTE: verticies must 
    // be added BEFORE this function is called - this implementation can be changed.
    this.addAllEdgesFromHexToGraph = function (hexCoordinates) {
        var coordLabels = Object.keys(hexCoordinates);
        for (var i = 0; i < coordLabels.length - 1; i++) {
            var v1 = hexCoordinates[coordLabels[i]];
            var v2 = hexCoordinates[coordLabels[i+1]];
            MapGraphService.addEdge(null, v1, v2);
        }
        // Add coordinate F to coordinate A
        var v1 = hexCoordinates[coordLabels[coordLabels.length - 1]];
        var v2 = hexCoordinates[coordLabels[0]];
        MapGraphService.addEdge(null, v1, v2);
    }

    this.assignCoordinatesToLands = function (lands) {
        var xOffset = 0; var yOffset = 0;
        for (var i = 0; i < lands.length; i++) {
            var row = lands[i];
            for (var j = 0; j < row.length; j++) {
                xOffset = Math.abs(MID_ROW_IDX - i) * ROW_OFFSET;
                xOffset += (HEX_WIDTH * j);  // Additionally, shift left by hexagon's height * column
                
                // Shift down by hexagon's height * row
                yOffset = (HEX_HEIGHT - VERT_GAP_CLOSE) * i;

                /* This information is used by the MapGraph algorithms for uniquely identifying 
                verticies. It aides with retrieving and placing settlements, cities, and roads.
                This infomration is necessary to make a graph implementation work because verticies
                are not unique - multiple lands may share the same vertex. Alternamtive implementation 
                can be to store a mapping from shared points into one vertex id... */
                var hexCoordinates = {
                    A: [80 + xOffset, 0 + yOffset],
                    B: [160 + xOffset, 40 + yOffset],
                    C: [160 + xOffset, 120 + yOffset],
                    D: [80 + xOffset, 160 + yOffset],
                    E: [0 + xOffset, 120 + yOffset],
                    F: [0 + xOffset, 40 + yOffset] 
                };
                lands[i][j].coordinates = hexCoordinates;
            }
        }
    }
}]);