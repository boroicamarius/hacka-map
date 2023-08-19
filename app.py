import requests
import sklearn
import osmnx as ox
import networkx as nx
import shapely
from flask import Flask, request, jsonify, make_response, Response, Request


def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


G = ox.load_graphml(filepath='geodata/graph_ml.osm')


def getNode(id): return G.nodes[id]


def getEdge(start, end):
    return G[start][end][0]


def transformNodeToCoords(node): return [node['y'], node['x']]
def transformToupleToCoords(touple): return [touple[1], touple[0]]


def extractPathCoordinates(nx_path):
    path = []

    for count, id in enumerate(nx_path[:-1]):
        current_node = id
        next_node = nx_path[count+1]

        edge = getEdge(current_node, next_node)

        if 'geometry' in edge:
            geometry = shapely.geometry.LineString(edge['geometry'])
            touple_coords_array = list(geometry.coords)

            for pair in touple_coords_array:
                path.append(transformToupleToCoords(pair))

        else:
            node = getNode(next_node)
            path.append(transformNodeToCoords(node))

    return path


def findClosestNodeToCoords(
    coords): return ox.nearest_nodes(G, coords[0], coords[1])


def findClosestEdgeToCoords(coords):
    
    (longitude, latitude) = coords    
    edge = ox.nearest_edges(
        G, longitude, latitude, return_dist=True)

    return edge


graph_saved_edges = []
removed_edges = []

def applyBarriersToGraph(barriers):

    print("---APPLYING BARRIERS---")
    for barrier in barriers:
        (longitude, latitude) = barrier
        MAX_BARRIER_DISTANCE = 0.000015
        
        while True:
            (edge, distance) = findClosestEdgeToCoords([latitude,longitude])
            if distance > MAX_BARRIER_DISTANCE: break;
            
            print(distance)
            (source, target, option) = edge
            source_node = getNode(source); target_node = getNode(target);

            removed_edges.append([[source_node['y'], source_node['x']], [
                                target_node['y'], target_node['x']]])

            try: G.remove_edge(source, target)
            except: pass;
            
            try: G.remove_edge(target, source)
            except: pass;
            
    print("---BARRIERS APPLIED---")
    return


def removeBarriersFromGraph():

    for edge_save in graph_saved_edges:
        source = edge_save['source']
        target = edge_save['target']
        travel_time = edge_save['travel_time']

        G[source][target][0]['travel_time'] = travel_time

    return


def FindShortestPath(points):

    first_point = points[0]
    last_point = points[-1]

    source = findClosestNodeToCoords(first_point)
    target = findClosestNodeToCoords(last_point)

    nx_id_path = nx.shortest_path(G, source, target, 'travel_time')

    nx_path = extractPathCoordinates(nx_id_path)
    return {'route': nx_path}


app = Flask(__name__)

barriers = [[44.440682029393905, 26.11030697822571],
            [44.44543877546804, 26.10357999801636],
            [44.43469916282961, 26.098258495330814],
            [44.44737085357723,26.105878651142124]]


@app.route("/router", methods=["OPTIONS", "POST"])
def routeEngine():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "POST":
        content_type = request.headers.get('Content-Type')
        data = {}

        if (content_type == 'application/json'):
            data = FindShortestPath(
                request.json['points'])

        json = jsonify(data)

        response = make_response(json)
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.mimetype = 'application/json'

        return response
    else:
        raise RuntimeError(
            "Weird - don't know how to handle method {}".format(request.method))


@app.route("/barriers", methods=["OPTIONS", "GET"])
def sendBarriers():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "GET":

        data = {}
        data['barriers'] = barriers
        data['removed_edges'] = removed_edges

        json = jsonify(data)

        response = make_response(json)
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.mimetype = 'application/json'

        return response
    else:
        raise RuntimeError(
            "Weird - don't know how to handle method {}".format(request.method))


if __name__ == "__main__":
    applyBarriersToGraph(barriers)
    app.run()
