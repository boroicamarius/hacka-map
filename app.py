import requests

from flask import Flask, request, jsonify, make_response, Response, Request

from scipy import spatial
import numpy as np
import math as mt

from decimal import Decimal


def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


#   TO REMEMBER:
#       - latitude means height
#       - longitude means width
#

x = 0
y = 1

longitude = x
latitude = y


def inverseLngLat(vector_of_coords):

    resulting_vector = []

    for coord in vector_of_coords:
        #   LatLng for Leaflet.js
        resulting_vector.append([coord[latitude], coord[longitude]])

    return resulting_vector


def transformPointsToAPIQueryString(points):

    points_argument = ""

    for count, point in enumerate(points):
        points_argument += f"{point[longitude]},{point[latitude]}"
        if count != len(points) - 1:
            points_argument += ";"

    return points_argument


def makeOSMRApiCall(points):

    points_argument = transformPointsToAPIQueryString(points)

    query = f"https://router.project-osrm.org/route/v1/driving/{points_argument}?overview=false&steps=true&geometries=geojson"

    osmr_path = requests.get(query).json()["routes"][0]["legs"][0]["steps"]
    return osmr_path


def extractPathFromOSMRApi(osmr_path):

    path = []

    for path_section in osmr_path:
        segment_coords = path_section['geometry']['coordinates']
        for coord in segment_coords:
            path.append(coord)

    return path


def distanceBetween(a, b):
    return ((b[x]-a[x])**2+(b[y]-a[y])**2)**0.5


def distanceOfPointToLine(point, line_start, line_end):
    
    point=np.asfarray(point)
    line_start=np.asfarray(line_start)
    line_end=np.asfarray(line_end)
    
    return np.abs(np.cross(line_end-line_start, line_start-point)) / np.linalg.norm(line_end-line_start)


def findBarriersThatIntersectPath(path, barrier_cooordinates):

    unique_intersected_barriers = set()

    nearest_vector_tree = spatial.KDTree(barrier_cooordinates)

    for index, coord in enumerate(path[:-1]):
        
        next_coord = path[index+1]
        line_length = distanceBetween(coord, next_coord)
        [neighbor_distance, neighbor_index] = nearest_vector_tree.query_ball_point(
            [coord, next_coord], r=line_length)

        distance_index_pair = zip(neighbor_distance, neighbor_index)

        for barrier_distance, barrier_index in distance_index_pair:
            barrier = barrier_cooordinates[barrier_index]

            if distanceOfPointToLine(barrier,coord,next_coord)<0.00002:
                unique_intersected_barriers.add(barrier_index)

    return list(unique_intersected_barriers)


def FindShortestPath(points, barrier_coordinates):

    api_result = makeOSMRApiCall(points)

    path = extractPathFromOSMRApi(api_result)

    intersected_barriers = findBarriersThatIntersectPath(
        path, barrier_coordinates)

    return {'route': inverseLngLat(path), 'intersected_barriers': intersected_barriers}


app = Flask(__name__)


@app.route("/router", methods=["OPTIONS", "POST"])
def hello_world():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "POST":
        content_type = request.headers.get('Content-Type')
        data = {}

        if (content_type == 'application/json'):
            data = FindShortestPath(
                request.json['points'], request.json['barriers'])

        json = jsonify(data)

        response = make_response(json)
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.mimetype = 'application/json'

        return response
    else:
        raise RuntimeError(
            "Weird - don't know how to handle method {}".format(request.method))


if __name__ == "__main__":
    app.run()
