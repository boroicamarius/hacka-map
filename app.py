import requests

from flask import Flask, request, jsonify, make_response, Response, Request

def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response


def FindShortestPath(points,barriers):
    # Points:  [[longitude, latitude],[...],...]

    if len(points) < 2:
        print("ERROR")
        return {"status": 0}

    query_string = ""

    for count, point in enumerate(points):
        query_string += f"{point[0]},{point[1]}"
        if count != len(points) - 1:
            query_string += ";"

    query = f"https://router.project-osrm.org/route/v1/driving/{query_string}?overview=false&steps=true&geometries=geojson"

    path = requests.get(query).json()["routes"][0]["legs"][0]["steps"]
    
    route = []
    osmr_path = []

    for unit in path:
        path = {}
        path["points"] = unit["geometry"]["coordinates"]

        for point in path["points"]:
            # print(point)
            route.append([point[1],point[0]])

        path["duration"] = unit["duration"]
        path["distance"] = unit["distance"]
        osmr_path.append(path)

    return route

app = Flask(__name__)

@app.route("/router", methods=["OPTIONS","POST"])
def hello_world():
    if request.method=="OPTIONS":
        return _build_cors_preflight_response()
    elif request.method == "POST":
        content_type = request.headers.get('Content-Type')
        data = {}
        
        if (content_type == 'application/json'):
            data = FindShortestPath(request.json['points'],request.json['barriers'])
            
        json = jsonify(data)    
        
        response = make_response(json)
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.mimetype='application/json'
        
        return response
    else:
        raise RuntimeError("Weird - don't know how to handle method {}".format(request.method))


if __name__ == "__main__":
    app.run()
