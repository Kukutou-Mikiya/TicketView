from flask import Flask, request, jsonify
import flask
import requests

app = Flask(__name__,static_url_path='/static')
app.debug = True

@app.route('/', methods=['GET'])
def home():
   return app.send_static_file('571hw6.html')


@app.route("/events", methods=["GET"])
def events():
    # Get parameters from the URL
    keyword = request.args.get("keyword")
    radius = int(request.args.get("distance"))
    geoPoint = request.args.get("geoPoint")
    category = request.args.get("category")
    api_key = "94UcyU0cGrWAaWAD6zABpFsfJKNi6znX"

    # Map category to segmentId
    category_to_segmentId = {
        "music": "KZFzniwnSyZfZ7v7nJ",
        "sports": "KZFzniwnSyZfZ7v7nE",
        "arts": "KZFzniwnSyZfZ7v7na",
        "film": "KZFzniwnSyZfZ7v7nn",
        "misc": "KZFzniwnSyZfZ7v7n1",
        "default": ""
    }
    segmentId = category_to_segmentId.get(category, "")

    # Send a GET request to the Ticketmaster Event Search API
    url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword={}&radius={}&unit=miles&geoPoint={}&segmentId={}&apikey={}".format(keyword, radius, geoPoint, segmentId, api_key)
    response = requests.get(url)

    # Return response JSON
    return jsonify(response.json())

if __name__ == "__main__":
    app.run(debug=True)
